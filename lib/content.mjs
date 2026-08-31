import {
  lstat,
  mkdir,
  readFile,
  readdir,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import { sha256 } from "./hashing.mjs";
import { oqcError } from "./errors.mjs";

const defaultIgnoredDirectories = new Set([
  ".obsidian",
  "private",
  "templates",
]);
export const supportedPublicExtensions = Object.freeze([
  ".md",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".pdf",
  ".mp3",
  ".mp4",
]);
const supportedExtensions = new Set(supportedPublicExtensions);

function portablePath(value) {
  return value.replaceAll("\\", "/").replace(/^\.\//u, "");
}

function resolveInside(root, relativePath, label) {
  const portable = portablePath(relativePath);
  if (
    !portable ||
    path.isAbsolute(relativePath) ||
    /^[A-Za-z]:/u.test(portable)
  ) {
    throw new Error(
      `${label} path escapes the Vault or staging directory: ${relativePath}`,
    );
  }
  const absolutePath = path.resolve(root, ...portable.split("/"));
  const relative = path.relative(path.resolve(root), absolutePath);
  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(
      `${label} path escapes the Vault or staging directory: ${relativePath}`,
    );
  }
  return { absolutePath, portable };
}

function collisionKey(targetPath) {
  return portablePath(targetPath).toLocaleLowerCase("en");
}

function assertUniqueTargetMappings(records, contentPolicy) {
  const byTarget = new Map();
  for (const record of records) {
    const mapping = targetPathForSource(record.sourcePath, contentPolicy);
    if (mapping.status === "EXCLUDED") continue;
    const key = collisionKey(mapping.targetPath);
    const previous = byTarget.get(key);
    if (previous) {
      throw oqcError("CONTENT_TARGET_COLLISION", {
        targetPath: mapping.targetPath,
        sourcePaths: [previous, record.sourcePath].sort(),
      });
    }
    byTarget.set(key, record.sourcePath);
  }
}

export function targetPathForSource(sourcePath, contentPolicy = {}) {
  const portable = portablePath(sourcePath);
  const excluded = new Set([
    ...defaultIgnoredDirectories,
    ...(contentPolicy.excludeDirectories ?? []).map(portablePath),
  ]);
  if (
    [...excluded].some(
      (directory) =>
        portable === directory || portable.startsWith(`${directory}/`),
    )
  ) {
    return { status: "EXCLUDED", sourcePath: portable, targetPath: null };
  }
  return {
    status: "INCLUDED",
    sourcePath: portable,
    targetPath:
      contentPolicy.homeSource === portable
        ? contentPolicy.homeTarget
        : portable,
  };
}

async function enumerateVault(vaultPath, ignoredDirectories) {
  const records = [];

  async function walk(directory, relativeDirectory = "") {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
    for (const entry of entries) {
      if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
      const absolutePath = path.join(directory, entry.name);
      const metadata = await lstat(absolutePath);
      if (entry.isSymbolicLink() || metadata.isSymbolicLink()) {
        throw new Error(
          `symbolic link or reparse point is not allowed: ${absolutePath}`,
        );
      }
      const relativePath = portablePath(
        path.join(relativeDirectory, entry.name),
      );
      if (entry.isDirectory()) {
        await walk(absolutePath, relativePath);
        continue;
      }
      if (
        !entry.isFile() ||
        !supportedExtensions.has(path.extname(entry.name).toLowerCase())
      )
        continue;
      const bytes = await readFile(absolutePath);
      records.push({
        sourcePath: relativePath,
        sourceSha256: sha256(bytes),
        bytes: metadata.size,
      });
    }
  }

  await walk(vaultPath);
  return records.sort((left, right) =>
    left.sourcePath.localeCompare(right.sourcePath, "en"),
  );
}

export async function discoverContent({
  vaultPath,
  baseline = [],
  mode,
  manifestPath,
  ignoreDirectories = [],
  contentPolicy = {},
}) {
  if (!["changed", "manifest"].includes(mode))
    throw new Error("mode must be changed or manifest");
  const ignored = new Set([...defaultIgnoredDirectories, ...ignoreDirectories]);
  let selected;
  if (mode === "manifest") {
    if (!manifestPath)
      throw new Error("manifestPath is required in manifest mode");
    const values = JSON.parse(
      (await readFile(manifestPath, "utf8")).replace(/^\uFEFF/u, ""),
    );
    if (
      !Array.isArray(values) ||
      values.some((value) => typeof value !== "string")
    ) {
      throw new Error("content manifest must be an array of paths");
    }
    selected = new Set(
      values.map((value) => {
        const resolved = resolveInside(vaultPath, value, "manifest");
        const mapping = targetPathForSource(resolved.portable, contentPolicy);
        if (mapping.status === "EXCLUDED")
          throw oqcError("CONTENT_POLICY_EXCLUDED", {
            sourcePath: resolved.portable,
          });
        return resolved.portable;
      }),
    );
  }

  const baselineByPath = new Map(
    baseline.map((item) => [portablePath(item.sourcePath), item.sourceSha256]),
  );
  const records = await enumerateVault(vaultPath, ignored);
  assertUniqueTargetMappings(records, contentPolicy);
  const items = [];
  const skipped = [];
  const excluded = [];
  for (const record of records) {
    if (selected && !selected.has(record.sourcePath)) continue;
    const mapping = targetPathForSource(record.sourcePath, contentPolicy);
    if (mapping.status === "EXCLUDED") {
      excluded.push({
        sourcePath: record.sourcePath,
        reason: "CONTENT_POLICY_EXCLUDED",
      });
      continue;
    }
    const mappedRecord = { ...record, targetPath: mapping.targetPath };
    if (
      mode === "changed" &&
      baselineByPath.get(record.sourcePath) === record.sourceSha256
    ) {
      skipped.push({
        sourcePath: record.sourcePath,
        reason: "UNCHANGED",
      });
      continue;
    }
    items.push(mappedRecord);
  }
  if (selected) {
    const found = new Set(records.map((record) => record.sourcePath));
    for (const requested of selected)
      if (!found.has(requested))
        throw new Error(`manifest item not found: ${requested}`);
  }
  return { items, skipped, excluded, findings: [] };
}

export async function preparePublicCopies({
  items,
  vaultPath,
  stagingContentPath,
}) {
  const copies = [];
  for (const item of items) {
    const source = resolveInside(vaultPath, item.sourcePath, "source");
    const target = resolveInside(
      stagingContentPath,
      item.targetPath ?? item.sourcePath,
      "target",
    );
    const sourceMetadata = await lstat(source.absolutePath);
    if (!sourceMetadata.isFile() || sourceMetadata.isSymbolicLink()) {
      throw new Error(`source must be a regular file: ${item.sourcePath}`);
    }
    const bytes = await readFile(source.absolutePath);
    const sourceSha256 = sha256(bytes);
    if (item.sourceSha256 && item.sourceSha256 !== sourceSha256) {
      throw new Error(`source changed after discovery: ${item.sourcePath}`);
    }
    await mkdir(path.dirname(target.absolutePath), { recursive: true });
    await writeFile(target.absolutePath, bytes);
    copies.push({
      sourcePath: source.portable,
      sourceSha256,
      targetPath: target.portable,
      targetSha256: sha256(bytes),
      copyStatus: "COPIED",
    });
  }
  return copies;
}

export async function installPublicCopies({
  copies,
  stagingContentPath,
  siteContentPath,
  writeFileImpl = writeFile,
  restoreWriteFileImpl = writeFile,
}) {
  const snapshots = [];
  const touched = new Set();
  const restore = async () => {
    const failures = [];
    for (const snapshot of snapshots) {
      if (!touched.has(snapshot.target)) continue;
      try {
        if (snapshot.original === null) {
          await unlink(snapshot.target);
        } else {
          await restoreWriteFileImpl(snapshot.target, snapshot.original);
        }
      } catch (error) {
        failures.push({
          path: snapshot.target,
          code: error.code ?? "ROLLBACK_FAILED",
          message: error.message,
        });
      }
    }
    return failures;
  };
  try {
    for (const copy of copies) {
      const target = resolveInside(
        siteContentPath,
        copy.targetPath,
        "installation target",
      );
      let original = null;
      try {
        original = await readFile(target.absolutePath);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      snapshots.push({ target: target.absolutePath, original });
    }
    for (const copy of copies) {
      const source = resolveInside(
        stagingContentPath,
        copy.targetPath,
        "staging source",
      );
      const target = resolveInside(
        siteContentPath,
        copy.targetPath,
        "installation target",
      );
      touched.add(target.absolutePath);
      await mkdir(path.dirname(target.absolutePath), { recursive: true });
      await writeFileImpl(
        target.absolutePath,
        await readFile(source.absolutePath),
      );
    }
  } catch (error) {
    const rollbackFailures = await restore();
    if (rollbackFailures.length > 0) error.rollbackFailures = rollbackFailures;
    throw error;
  }
  return { copies, rollback: restore };
}

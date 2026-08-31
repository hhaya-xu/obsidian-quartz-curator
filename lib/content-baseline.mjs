import assert from "node:assert/strict";
import { lstat, mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { discoverContent } from "./content.mjs";
import { supportedPublicExtensions } from "./content.mjs";
import { sha256 } from "./hashing.mjs";
import { atomicWriteJson } from "./io.mjs";

const schemaVersion = "oqc.content-baseline.v1";
const initializedByValues = new Set([
  "certification",
  "adopt-existing",
  "publish",
]);

export function createContentBaseline({ siteId, initializedBy, items }) {
  assert.ok(typeof siteId === "string" && siteId, "siteId is required");
  assert.ok(
    initializedByValues.has(initializedBy),
    "initializedBy is unsupported",
  );
  assert.ok(Array.isArray(items), "baseline items must be an array");
  return {
    schemaVersion,
    siteId,
    initializedBy,
    items: [...items].sort((left, right) =>
      left.sourcePath.localeCompare(right.sourcePath, "en"),
    ),
  };
}

export async function readContentBaseline({ baselinePath, siteId }) {
  try {
    const value = JSON.parse(
      (await readFile(baselinePath, "utf8")).replace(/^\uFEFF/u, ""),
    );
    const legacy = Array.isArray(value);
    const baseline = legacy
      ? createContentBaseline({
          siteId,
          initializedBy: "publish",
          items: value,
        })
      : value;
    assert.equal(baseline.schemaVersion, schemaVersion);
    assert.equal(baseline.siteId, siteId);
    assert.ok(Array.isArray(baseline.items), "baseline items must be an array");
    return { status: "READY", legacy, baseline };
  } catch (error) {
    if (error.code === "ENOENT")
      return { status: "MISSING", legacy: false, baseline: null };
    throw error;
  }
}

export async function writeContentBaseline({ baselinePath, baseline }) {
  await mkdir(path.dirname(baselinePath), { recursive: true });
  await atomicWriteJson(baselinePath, baseline);
  return baselinePath;
}

function resolveTargetInside(contentRoot, targetPath) {
  const absolutePath = path.resolve(
    contentRoot,
    ...targetPath.replaceAll("\\", "/").split("/"),
  );
  const relative = path.relative(path.resolve(contentRoot), absolutePath);
  assert.ok(
    relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative),
    `target path escapes site content: ${targetPath}`,
  );
  return absolutePath;
}

function targetKey(targetPath) {
  return targetPath.replaceAll("\\", "/").toLocaleLowerCase("en");
}

async function inspectTarget(contentRoot, targetPath) {
  const absolutePath = resolveTargetInside(contentRoot, targetPath);
  try {
    const metadata = await lstat(absolutePath);
    if (metadata.isSymbolicLink() || !metadata.isFile())
      throw new Error(`target must be a regular file: ${absolutePath}`);
    return { status: "PRESENT", sha256: sha256(await readFile(absolutePath)) };
  } catch (error) {
    if (error.code === "ENOENT") return { status: "MISSING", sha256: null };
    throw error;
  }
}

async function enumerateSiteTargets(contentRoot) {
  const targets = [];
  async function walk(directory, relativeDirectory = "") {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      const relative = path.posix.join(relativeDirectory, entry.name);
      const metadata = await lstat(absolute);
      if (entry.isSymbolicLink() || metadata.isSymbolicLink())
        throw new Error(
          `symbolic link or reparse point is not allowed: ${absolute}`,
        );
      if (entry.isDirectory()) {
        await walk(absolute, relative);
      } else if (
        entry.isFile() &&
        supportedPublicExtensions.includes(
          path.extname(entry.name).toLowerCase(),
        )
      ) {
        targets.push({
          targetPath: relative,
          targetSha256: sha256(await readFile(absolute)),
        });
      }
    }
  }
  try {
    await walk(contentRoot);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return targets.sort((left, right) =>
    left.targetPath.localeCompare(right.targetPath, "en"),
  );
}

export async function buildExistingContentBaseline({
  profile,
  initializedBy = "adopt-existing",
}) {
  const discovery = await discoverContent({
    vaultPath: profile.vaultPath,
    baseline: [],
    mode: "changed",
    contentPolicy: profile.content,
  });
  const contentRoot = path.resolve(
    profile.siteProjectPath,
    profile.contentDirectory,
  );
  const items = [];
  const notPresent = [];

  for (const item of discovery.items) {
    const targetPath = resolveTargetInside(contentRoot, item.targetPath);
    let metadata;
    try {
      metadata = await lstat(targetPath);
    } catch (error) {
      if (error.code === "ENOENT") {
        notPresent.push({
          sourcePath: item.sourcePath,
          targetPath: item.targetPath,
          reason: "TARGET_NOT_PRESENT",
        });
        continue;
      }
      throw error;
    }
    if (metadata.isSymbolicLink())
      throw new Error(
        `symbolic link or reparse point is not allowed: ${targetPath}`,
      );
    if (!metadata.isFile())
      throw new Error(`existing target must be a regular file: ${targetPath}`);
    const targetBytes = await readFile(targetPath);
    items.push({
      sourcePath: item.sourcePath,
      targetPath: item.targetPath,
      sourceSha256: item.sourceSha256,
      targetSha256: sha256(targetBytes),
    });
  }

  const mappedTargets = new Set(items.map((item) => item.targetPath));
  const orphanTargets = (await enumerateSiteTargets(contentRoot))
    .filter(
      (target) =>
        ![...mappedTargets].some(
          (mapped) => targetKey(mapped) === targetKey(target.targetPath),
        ),
    )
    .map((target) => ({ ...target, reason: "ORPHAN_TARGET" }));

  return {
    baseline: createContentBaseline({
      siteId: profile.siteId,
      initializedBy,
      items,
    }),
    excluded: discovery.excluded,
    notPresent,
    orphanTargets,
    findings: discovery.findings,
  };
}

export async function compareContentBaseline({ profile, baseline }) {
  const discovery = await discoverContent({
    vaultPath: profile.vaultPath,
    baseline: [],
    mode: "changed",
    contentPolicy: profile.content,
  });
  const contentRoot = path.resolve(
    profile.siteProjectPath,
    profile.contentDirectory,
  );
  const currentBySource = new Map(
    discovery.items.map((item) => [item.sourcePath, item]),
  );
  const baselineBySource = new Map(
    baseline.items.map((item) => [item.sourcePath, item]),
  );
  const result = {
    changed: [],
    unchanged: [],
    sourceDeleted: [],
    targetMissing: [],
    targetDrift: [],
    excluded: discovery.excluded,
    findings: discovery.findings,
  };
  for (const item of discovery.items) {
    const previous = baselineBySource.get(item.sourcePath);
    if (!previous) {
      result.changed.push(item);
      continue;
    }
    const targetPath = previous.targetPath ?? item.targetPath;
    const target = await inspectTarget(contentRoot, targetPath);
    const detail = {
      sourcePath: item.sourcePath,
      targetPath,
      sourceSha256: item.sourceSha256,
      baselineSourceSha256: previous.sourceSha256,
      targetSha256: target.sha256,
      baselineTargetSha256: previous.targetSha256,
    };
    if (item.sourceSha256 !== previous.sourceSha256) result.changed.push(item);
    if (target.status === "MISSING") {
      result.targetMissing.push({ ...detail, reason: "TARGET_MISSING" });
    } else if (target.sha256 !== previous.targetSha256) {
      result.targetDrift.push({ ...detail, reason: "TARGET_DRIFT" });
    } else if (item.sourceSha256 === previous.sourceSha256) {
      result.unchanged.push(detail);
    }
  }
  for (const previous of baseline.items) {
    if (!currentBySource.has(previous.sourcePath)) {
      const target = await inspectTarget(contentRoot, previous.targetPath);
      result.sourceDeleted.push({
        sourcePath: previous.sourcePath,
        targetPath: previous.targetPath,
        sourceSha256: null,
        baselineSourceSha256: previous.sourceSha256,
        targetSha256: target.sha256,
        baselineTargetSha256: previous.targetSha256,
        reason: "SOURCE_DELETED",
      });
      const detail = {
        sourcePath: previous.sourcePath,
        targetPath: previous.targetPath,
        sourceSha256: null,
        baselineSourceSha256: previous.sourceSha256,
        targetSha256: target.sha256,
        baselineTargetSha256: previous.targetSha256,
      };
      if (target.status === "MISSING") {
        result.targetMissing.push({ ...detail, reason: "TARGET_MISSING" });
      } else if (target.sha256 !== previous.targetSha256) {
        result.targetDrift.push({ ...detail, reason: "TARGET_DRIFT" });
      }
    }
  }
  return result;
}

export { enumerateSiteTargets, inspectTarget };

import { readFile } from "node:fs/promises";
import path from "node:path";

import { canonicalSha256, sha256 } from "./hashing.mjs";
import { inventoryRegularFiles } from "./io.mjs";

const fingerprintFields = [
  "oqcVersion",
  "quartzVersion",
  "overlaySha256",
  "installedOverlaySha256",
  "publicConfigSha256",
  "themeSha256",
  "baseUrl",
];

async function filesFingerprint(root, relativePaths) {
  const records = [];
  for (const relativePath of relativePaths) {
    const bytes = await readFile(path.join(root, relativePath));
    records.push({
      path: relativePath.replaceAll("\\", "/"),
      sha256: sha256(bytes),
    });
  }
  return canonicalSha256(records);
}

async function installedOverlayFingerprint(siteProjectPath, overlayFiles) {
  const records = [];
  for (const overlayFile of overlayFiles) {
    let installedSha256 = null;
    try {
      installedSha256 = sha256(
        await readFile(
          path.join(siteProjectPath, ...overlayFile.path.split("/")),
        ),
      );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    records.push({ path: overlayFile.path, sha256: installedSha256 });
  }
  return canonicalSha256(records);
}

export async function computeFingerprint(profile, { oqcSourceRoot }) {
  const quartzPackage = JSON.parse(
    await readFile(path.join(profile.siteProjectPath, "package.json"), "utf8"),
  );
  const oqcVersion = (
    await readFile(path.join(oqcSourceRoot, "VERSION"), "utf8")
  ).trim();
  const overlayFiles = await inventoryRegularFiles(
    path.join(oqcSourceRoot, "overlay"),
  );
  const themeCandidates = [
    "quartz/styles/custom.scss",
    "quartz/styles/oqc-theme-tokens.scss",
    "quartz/styles/oqc-visual.scss",
  ];
  const availableThemeFiles = [];
  for (const relativePath of themeCandidates) {
    try {
      await readFile(path.join(profile.siteProjectPath, relativePath));
      availableThemeFiles.push(relativePath);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  if (availableThemeFiles.length === 0)
    throw new Error("no certified theme files were found");

  return {
    oqcVersion,
    quartzVersion: quartzPackage.version,
    overlaySha256: canonicalSha256(overlayFiles),
    installedOverlaySha256: await installedOverlayFingerprint(
      profile.siteProjectPath,
      overlayFiles,
    ),
    publicConfigSha256: await filesFingerprint(profile.siteProjectPath, [
      "quartz.config.ts",
      "quartz.layout.ts",
    ]),
    themeSha256: await filesFingerprint(
      profile.siteProjectPath,
      availableThemeFiles,
    ),
    baseUrl: profile.baseUrl,
  };
}

export function compareLock(lock, current) {
  const drift = [];
  for (const field of fingerprintFields) {
    if (lock?.[field] === current[field]) continue;
    drift.push({
      field,
      expected: lock?.[field] ?? null,
      actual: current[field] ?? null,
      owner: "馆长",
      action: "oqc certify --profile <profile>",
    });
  }
  return { valid: drift.length === 0, drift };
}

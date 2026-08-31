import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { compareLock, computeFingerprint } from "../fingerprint.mjs";
import {
  compareContentBaseline,
  readContentBaseline,
} from "../content-baseline.mjs";
import { validateProfile } from "../profile.mjs";

const installedSourceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

async function readJson(filePath) {
  return JSON.parse((await readFile(filePath, "utf8")).replace(/^\uFEFF/u, ""));
}

function runtimePath(profilePath, profile) {
  return path.isAbsolute(profile.runtimeDirectory)
    ? profile.runtimeDirectory
    : path.resolve(path.dirname(profilePath), profile.runtimeDirectory);
}

export async function statusCommand({
  profilePath,
  oqcSourceRoot = installedSourceRoot,
}) {
  const profile = validateProfile(await readJson(profilePath));
  const current = await computeFingerprint(profile, { oqcSourceRoot });
  let lock;
  try {
    lock = await readJson(path.join(profile.siteProjectPath, "oqc.lock.json"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const comparison = lock
    ? compareLock(lock, current)
    : {
        valid: false,
        drift: [
          {
            field: "certificationLock",
            expected: "present",
            actual: "missing",
            owner: "馆长",
            action: "oqc certify --profile <profile>",
          },
        ],
      };

  if (!comparison.valid) {
    return {
      status: "BLOCKED_CERTIFICATION",
      mode: "blocked",
      certificationStatus: "INVALID",
      baselineStatus: "NOT_CHECKED",
      drift: comparison.drift,
      changedContent: [],
      unchangedContent: [],
      content: { sourceDeleted: [], targetMissing: [], targetDrift: [] },
      excludedContent: [],
      unresolvedIncidents: [],
      nextOwner: "馆长",
      nextCommand: "oqc certify --profile <profile>",
    };
  }

  const baselineResult = await readContentBaseline({
    baselinePath: path.join(
      runtimePath(profilePath, profile),
      "published-content.json",
    ),
    siteId: profile.siteId,
  });
  if (baselineResult.status === "MISSING") {
    return {
      status: "BASELINE_REQUIRED",
      mode: "blocked",
      certificationStatus: "VALID",
      baselineStatus: "MISSING",
      changedContent: [],
      unchangedContent: [],
      content: { sourceDeleted: [], targetMissing: [], targetDrift: [] },
      excludedContent: [],
      drift: [],
      unresolvedIncidents: [],
      nextOwner: "馆长",
      nextCommand: `oqc publish --site ${profile.siteId} --adopt-existing`,
    };
  }
  const content = await compareContentBaseline({
    profile,
    baseline: baselineResult.baseline,
  });
  if (
    content.sourceDeleted.length > 0 ||
    content.targetMissing.length > 0 ||
    content.targetDrift.length > 0
  ) {
    return {
      status: "CONTENT_RECONCILIATION_REQUIRED",
      mode: "blocked",
      certificationStatus: "VALID",
      baselineStatus: baselineResult.legacy ? "LEGACY" : "READY",
      drift: [],
      changedContent: content.changed,
      unchangedContent: content.unchanged,
      content: {
        sourceDeleted: content.sourceDeleted,
        targetMissing: content.targetMissing,
        targetDrift: content.targetDrift,
      },
      excludedContent: content.excluded,
      unresolvedIncidents: [],
      nextOwner: "馆长",
      nextCommand: "oqc status --site <siteId>",
    };
  }
  return {
    status: "READY",
    mode: "fast",
    certificationStatus: "VALID",
    baselineStatus: baselineResult.legacy ? "LEGACY" : "READY",
    drift: [],
    changedContent: content.changed,
    unchangedContent: content.unchanged,
    content: {
      sourceDeleted: content.sourceDeleted,
      targetMissing: content.targetMissing,
      targetDrift: content.targetDrift,
    },
    excludedContent: content.excluded,
    unresolvedIncidents: [],
    nextOwner: "知识库管理者",
    nextCommand: `oqc publish --site ${profile.siteId} --changed --push`,
  };
}

export function formatStatus(result) {
  return [
    `站点认证：${result.certificationStatus === "VALID" ? "有效" : "不可用"}`,
    `内容基线：${result.baselineStatus ?? "未知"}`,
    `待发布：${result.changedContent.length}`,
    `已排除：${result.excludedContent?.length ?? 0}`,
    `下一责任人：${result.nextOwner}`,
    `下一动作：${result.nextCommand}`,
  ].join("\n");
}

import {
  access,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { discoverContent, preparePublicCopies } from "../content.mjs";
import {
  buildExistingContentBaseline,
  writeContentBaseline,
} from "../content-baseline.mjs";
import { oqcError, sanitizeDiagnostic } from "../errors.mjs";
import { computeFingerprint } from "../fingerprint.mjs";
import { canonicalSha256 } from "../hashing.mjs";
import { createIncident, writeIncident } from "../incident.mjs";
import {
  atomicWriteJson,
  atomicWriteBytes,
  atomicWriteText,
  inventoryRegularFiles,
} from "../io.mjs";
import { renderProfile, validateProfile } from "../profile.mjs";
import { adaptPublicCopies } from "../public-copy.mjs";
import { verifyQuartz } from "../quartz.mjs";
import { defaultRegistryPath, registerSite } from "../site-registry.mjs";

const installedSourceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

async function readProfile(profilePath) {
  return validateProfile(
    JSON.parse((await readFile(profilePath, "utf8")).replace(/^\uFEFF/u, "")),
  );
}

function runtimePath(profilePath, profile) {
  return path.isAbsolute(profile.runtimeDirectory)
    ? profile.runtimeDirectory
    : path.resolve(path.dirname(profilePath), profile.runtimeDirectory);
}

export async function runProductionGates({
  profile,
  oqcSourceRoot,
  verifyQuartzImpl = verifyQuartz,
}) {
  profile = validateProfile(profile);
  const fixturePath = await mkdtemp(
    path.join(os.tmpdir(), "oqc-certify-fixture-"),
  );
  const excludedRoots = new Set([
    ".git",
    ".oqc-local",
    "node_modules",
    "public",
  ]);
  await cp(profile.siteProjectPath, fixturePath, {
    recursive: true,
    force: true,
    filter: (source) => {
      const relative = path.relative(profile.siteProjectPath, source);
      if (!relative) return true;
      return !excludedRoots.has(relative.split(path.sep)[0]);
    },
  });
  const authorityNodeModules = path.join(
    profile.siteProjectPath,
    "node_modules",
  );
  try {
    await access(authorityNodeModules);
    await symlink(
      authorityNodeModules,
      path.join(fixturePath, "node_modules"),
      "junction",
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const isolatedProfile = { ...profile, siteProjectPath: fixturePath };
  const rendered = renderProfile(isolatedProfile);
  await atomicWriteText(
    path.join(fixturePath, "quartz.config.ts"),
    rendered.config,
  );
  await atomicWriteText(
    path.join(fixturePath, "quartz.layout.ts"),
    rendered.layout,
  );
  await cp(
    path.join(oqcSourceRoot, "overlay", "quartz"),
    path.join(fixturePath, "quartz"),
    {
      recursive: true,
      force: true,
    },
  );
  const discovered = await discoverContent({
    vaultPath: profile.vaultPath,
    baseline: [],
    mode: "changed",
    contentPolicy: profile.content,
  });
  const copies = await preparePublicCopies({
    items: discovered.items,
    vaultPath: profile.vaultPath,
    stagingContentPath: path.join(fixturePath, profile.contentDirectory),
  });
  const publicItems = await adaptPublicCopies({
    copies,
    contentRoot: path.join(
      isolatedProfile.siteProjectPath,
      isolatedProfile.contentDirectory,
    ),
    profile: isolatedProfile,
  });
  const quartz = await verifyQuartzImpl({
    profile: isolatedProfile,
    candidate: { items: publicItems },
  });
  return {
    technicalStatus: "PASS",
    evidencePaths: [fixturePath],
    fixturePath,
    candidate: { items: publicItems },
    fingerprint: await computeFingerprint(isolatedProfile, { oqcSourceRoot }),
    quartz,
  };
}

async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function candidateForActiveContent(profile, candidate) {
  const items = [];
  for (const item of candidate?.items ?? []) {
    if (!item.targetPath) continue;
    const targetPath = path.join(
      profile.siteProjectPath,
      profile.contentDirectory ?? "content",
      ...item.targetPath.split("/"),
    );
    if (await pathExists(targetPath)) items.push(item);
  }
  return { ...candidate, items };
}

export async function installCertifiedSurface({
  profile,
  oqcSourceRoot,
  gates,
  verifyQuartzImpl = verifyQuartz,
  copyImpl = cp,
  removeBackupImpl = rm,
  restoreWriteImpl = atomicWriteBytes,
}) {
  if (!gates.fixturePath) throw oqcError("CERTIFIED_SURFACE_MISSING");
  const overlayFiles = await inventoryRegularFiles(
    path.join(oqcSourceRoot, "overlay"),
  );
  const relativePaths = [
    "quartz.config.ts",
    "quartz.layout.ts",
    ...overlayFiles.map((item) => item.path),
  ];
  const backupPath = await mkdtemp(
    path.join(os.tmpdir(), "oqc-certify-backup-"),
  );
  const installed = [];
  let settled = false;
  const rollbackInstalled = async () => {
    const failures = [];
    for (const item of [...installed].reverse()) {
      const targetPath = path.join(
        profile.siteProjectPath,
        ...item.relativePath.split("/"),
      );
      try {
        if (item.existed) {
          await restoreWriteImpl(
            targetPath,
            await readFile(
              path.join(backupPath, ...item.relativePath.split("/")),
            ),
          );
        } else {
          await rm(targetPath, { force: true });
        }
      } catch (error) {
        failures.push({
          path: targetPath,
          backupPath,
          code: error.code ?? "ROLLBACK_FAILED",
          message: error.message,
        });
      }
    }
    if (failures.length === 0) {
      try {
        await removeBackupImpl(backupPath, { recursive: true, force: true });
      } catch (error) {
        failures.push({
          path: backupPath,
          code: error.code ?? "ROLLBACK_FAILED",
          message: error.message,
        });
      }
    }
    return failures;
  };
  try {
    for (const relativePath of relativePaths) {
      const sourcePath = path.join(
        gates.fixturePath,
        ...relativePath.split("/"),
      );
      const targetPath = path.join(
        profile.siteProjectPath,
        ...relativePath.split("/"),
      );
      const existed = await pathExists(targetPath);
      if (existed) {
        const backupFilePath = path.join(
          backupPath,
          ...relativePath.split("/"),
        );
        await mkdir(path.dirname(backupFilePath), { recursive: true });
        await cp(targetPath, backupFilePath, { force: true });
      }
      await mkdir(path.dirname(targetPath), { recursive: true });
      installed.push({ relativePath, existed });
      await copyImpl(sourcePath, targetPath, { force: true });
    }
    const quartz = await verifyQuartzImpl({
      profile,
      candidate: await candidateForActiveContent(
        profile,
        gates.candidate ?? { items: [] },
      ),
    });
    return {
      installedPaths: relativePaths,
      quartz,
      async commit() {
        if (settled) return;
        try {
          await removeBackupImpl(backupPath, { recursive: true, force: true });
        } catch (error) {
          error.backupPath = backupPath;
          error.safeResume = `Remove-Item -LiteralPath "${backupPath}" -Recurse -Force`;
          throw error;
        }
        settled = true;
      },
      async rollback() {
        if (settled) return [];
        const failures = await rollbackInstalled();
        if (failures.length === 0) settled = true;
        return failures;
      },
    };
  } catch (error) {
    const rollbackFailures = await rollbackInstalled();
    if (rollbackFailures.length > 0) error.rollbackFailures = rollbackFailures;
    if (rollbackFailures.length > 0 && !error.safeResume) {
      const uniquePaths = [
        ...new Set(
          rollbackFailures
            .flatMap((failure) => [failure.path, failure.backupPath])
            .filter((failurePath) => typeof failurePath === "string"),
        ),
      ];
      error.safeResume = `MANUAL_RECOVERY_REQUIRED paths=${uniquePaths.join(";")}`;
    }
    throw error;
  }
}

export const productionCertificationAdapters = {
  runAutomatedGates: runProductionGates,
  installCertifiedSurface,
  buildExistingContentBaseline,
  writeContentBaseline,
  registerSite,
  writeLock: atomicWriteJson,
};

async function recordCertificationFailure({
  error,
  profile,
  profilePath,
  runId,
}) {
  const directory = runtimePath(profilePath, profile);
  await mkdir(directory, { recursive: true });
  const evidencePaths = [];
  if (error.result && error.command) {
    const command = String(error.command).replace(/[^A-Za-z0-9_-]/gu, "-");
    for (const stream of ["stdout", "stderr"]) {
      const evidencePath = path.join(
        directory,
        `${runId}-${command}.${stream}.log`,
      );
      await atomicWriteText(
        evidencePath,
        sanitizeDiagnostic(error.result[stream] ?? ""),
      );
      evidencePaths.push(evidencePath);
    }
  }
  const incident = createIncident({
    runId,
    stage: "certify",
    errorCode: error.code ?? "CERTIFICATION_GATES_FAILED",
    safeResume: error.safeResume ?? `oqc certify --profile "${profilePath}"`,
  });
  if (error.command) incident.command = error.command;
  if (Number.isInteger(error.result?.exitCode))
    incident.exitCode = error.result.exitCode;
  if (evidencePaths.length > 0) incident.evidencePaths = evidencePaths;
  await writeIncident({ runtimeDirectory: directory, incident });
}

export async function certifyCommand({
  profilePath,
  visualApprovalRef,
  oqcSourceRoot = installedSourceRoot,
  lockPath,
  registryPath,
  adapters = productionCertificationAdapters,
}) {
  const services = { ...productionCertificationAdapters, ...adapters };
  const profile = await readProfile(profilePath);
  const resolvedLockPath =
    lockPath ?? path.join(profile.siteProjectPath, "oqc.lock.json");
  const runId = `cert-${Date.now()}`;
  let gates;
  let surfaceTransaction = null;
  let baselinePath = null;
  let resolvedRegistryPath = registryPath ?? defaultRegistryPath();
  let snapshots = [];
  try {
    gates = await services.runAutomatedGates({
      profile,
      profilePath,
      oqcSourceRoot,
    });
    if (gates.technicalStatus !== "PASS")
      throw oqcError("CERTIFICATION_GATES_FAILED");
  } catch (error) {
    await recordCertificationFailure({ error, profile, profilePath, runId });
    throw error;
  }

  let fingerprint =
    gates.fingerprint ?? (await computeFingerprint(profile, { oqcSourceRoot }));
  const evidencePaths = gates.evidencePaths ?? [];
  const certificationId = canonicalSha256({
    fingerprint,
    evidencePaths,
    visualApprovalRef,
  });
  if (!visualApprovalRef) {
    return {
      status: "AWAITING_VISUAL_APPROVAL",
      certificationId,
      fingerprint,
      lockPath: resolvedLockPath,
      evidencePaths,
    };
  }

  baselinePath = path.join(
    runtimePath(profilePath, profile),
    "published-content.json",
  );
  snapshots = [];
  for (const targetPath of [
    baselinePath,
    resolvedRegistryPath,
    resolvedLockPath,
  ]) {
    try {
      snapshots.push({
        path: targetPath,
        existed: true,
        bytes: await readFile(targetPath),
      });
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      snapshots.push({ path: targetPath, existed: false, bytes: null });
    }
  }

  try {
    if (services.installCertifiedSurface) {
      surfaceTransaction = await services.installCertifiedSurface({
        profile,
        profilePath,
        oqcSourceRoot,
        gates,
      });
      const installedFingerprint = await computeFingerprint(profile, {
        oqcSourceRoot,
      });
      if (
        canonicalSha256(installedFingerprint) !== canonicalSha256(fingerprint)
      )
        throw oqcError("CERTIFIED_SURFACE_MISMATCH");
      fingerprint = installedFingerprint;
    }

    const lock = {
      schemaVersion: "oqc.site-lock.v1",
      ...fingerprint,
      certificationId,
      visualApprovalRef,
    };
    const adopted = await services.buildExistingContentBaseline({
      profile,
      initializedBy: "certification",
    });
    if (
      adopted.notPresent?.length > 0 ||
      adopted.orphanTargets?.length > 0 ||
      adopted.findings?.length > 0
    ) {
      throw oqcError("CONTENT_BASELINE_REVIEW_REQUIRED", {
        notPresent: adopted.notPresent ?? [],
        orphanTargets: adopted.orphanTargets ?? [],
        findings: adopted.findings ?? [],
      });
    }
    await services.writeContentBaseline({
      baselinePath,
      baseline: adopted.baseline,
    });
    await services.registerSite({
      registryPath: resolvedRegistryPath,
      siteId: profile.siteId,
      profilePath,
    });
    await services.writeLock(resolvedLockPath, lock);
    let cleanupFailure;
    if (surfaceTransaction?.commit) {
      try {
        await surfaceTransaction.commit();
      } catch (cleanupError) {
        cleanupFailure = {
          code: cleanupError.code ?? "SURFACE_CLEANUP_FAILED",
          message: cleanupError.message,
          ...(cleanupError.backupPath
            ? { backupPath: cleanupError.backupPath }
            : {}),
          ...(cleanupError.safeResume
            ? { safeResume: cleanupError.safeResume }
            : {}),
        };
      }
    }
    return {
      status: "CERTIFIED",
      certificationId,
      fingerprint,
      lockPath: resolvedLockPath,
      evidencePaths,
      baselinePath,
      baselineItems: adopted.baseline.items.length,
      siteAlias: profile.siteId,
      ...(cleanupFailure ? { cleanupFailure } : {}),
    };
  } catch (error) {
    const rollbackFailures = [];
    const targets = [baselinePath, resolvedRegistryPath, resolvedLockPath];
    // Metadata restoration is deliberately independent so one failure cannot stop the rest.
    for (const targetPath of [...targets].reverse()) {
      try {
        const snapshot = snapshots.find((item) => item.path === targetPath);
        if (!snapshot) continue;
        if (!snapshot.existed) await rm(snapshot.path, { force: true });
        else await atomicWriteBytes(snapshot.path, snapshot.bytes);
      } catch (rollbackError) {
        rollbackFailures.push({
          path: targetPath,
          code: rollbackError.code ?? "ROLLBACK_FAILED",
          message: rollbackError.message,
        });
      }
    }
    if (surfaceTransaction?.rollback) {
      try {
        rollbackFailures.push(...(await surfaceTransaction.rollback()));
      } catch (rollbackError) {
        rollbackFailures.push({
          path: "certified-surface",
          code: rollbackError.code ?? "ROLLBACK_FAILED",
          message: rollbackError.message,
        });
      }
    }
    if (rollbackFailures.length > 0)
      error.rollbackFailures = [
        ...(error.rollbackFailures ?? []),
        ...rollbackFailures,
      ];
    if (rollbackFailures.length > 0 && !error.safeResume) {
      const uniquePaths = [
        ...new Set(
          rollbackFailures
            .flatMap((failure) => [failure.path, failure.backupPath])
            .filter((failurePath) => typeof failurePath === "string"),
        ),
      ];
      error.safeResume = `MANUAL_RECOVERY_REQUIRED paths=${uniquePaths.join(";")}`;
    }
    await recordCertificationFailure({ error, profile, profilePath, runId });
    throw error;
  }
}

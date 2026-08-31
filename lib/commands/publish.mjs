import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { approveCandidate, createCandidate } from "../approval.mjs";
import {
  discoverContent,
  installPublicCopies,
  preparePublicCopies,
} from "../content.mjs";
import {
  buildExistingContentBaseline,
  compareContentBaseline,
  createContentBaseline,
  readContentBaseline,
  writeContentBaseline,
} from "../content-baseline.mjs";
import { oqcError } from "../errors.mjs";
import { renderExperienceReport } from "../experience.mjs";
import { compareLock, computeFingerprint } from "../fingerprint.mjs";
import {
  commitAndPush,
  prepareGitRelease,
  snapshotStagedFiles,
} from "../git.mjs";
import { verifyGitHubPublication } from "../github.mjs";
import { canonicalSha256, sha256 } from "../hashing.mjs";
import { createIncident, writeIncident } from "../incident.mjs";
import {
  atomicWriteJson,
  atomicWriteText,
  inventoryRegularFiles,
} from "../io.mjs";
import { validateProfile } from "../profile.mjs";
import { adaptPublicCopies } from "../public-copy.mjs";
import { verifyQuartz } from "../quartz.mjs";
import { defaultRegistryPath, registerSite } from "../site-registry.mjs";

const installedSourceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

const productionPublishAdapters = {
  verifyQuartz,
  prepareGitRelease,
  commitAndPush,
  verifyGitHubPublication,
  discoverContent,
  preparePublicCopies,
  adaptPublicCopies,
  installPublicCopies,
  removeIsolationRoot: rm,
  buildExistingContentBaseline,
  compareContentBaseline,
  readContentBaseline,
  writeContentBaseline,
  registerSite,
};

async function readJson(filePath) {
  return JSON.parse((await readFile(filePath, "utf8")).replace(/^\uFEFF/u, ""));
}

async function readOptionalJson(filePath, fallback) {
  try {
    return await readJson(filePath);
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

function runtimePath(profilePath, profile) {
  return path.isAbsolute(profile.runtimeDirectory)
    ? profile.runtimeDirectory
    : path.resolve(path.dirname(profilePath), profile.runtimeDirectory);
}

function publicUrl(profile, targetPath) {
  const relative = targetPath.replaceAll("\\", "/").replace(/\.md$/iu, "");
  return new URL(relative, profile.liveUrl).href;
}

function mergeBaseline(previous, items, siteId) {
  const byPath = new Map(previous.items.map((item) => [item.sourcePath, item]));
  for (const item of items) {
    byPath.set(item.sourcePath, {
      sourcePath: item.sourcePath,
      sourceSha256: item.sourceSha256,
      targetPath: item.targetPath,
      targetSha256: item.targetSha256,
    });
  }
  return createContentBaseline({
    siteId,
    initializedBy: "publish",
    items: [...byPath.values()],
  });
}

async function certificationSurfacePaths(oqcSourceRoot) {
  const overlayFiles = await inventoryRegularFiles(
    path.join(oqcSourceRoot, "overlay"),
  );
  return [
    "oqc.lock.json",
    "quartz.config.ts",
    "quartz.layout.ts",
    ...overlayFiles.map((item) => item.path),
  ];
}

async function certificationSurfaceItems({
  siteProjectPath,
  stagedPaths,
  surfacePaths,
}) {
  const surfaceSet = new Set(surfacePaths);
  const items = [];
  for (const stagedPath of stagedPaths) {
    const portablePath = stagedPath.replaceAll("\\", "/");
    if (!surfaceSet.has(portablePath)) continue;
    const digest = sha256(
      await readFile(path.join(siteProjectPath, ...portablePath.split("/"))),
    );
    items.push({
      kind: "certification-surface",
      sourcePath: `@certification/${portablePath}`,
      sourceSha256: digest,
      targetPath: portablePath,
      targetSha256: digest,
    });
  }
  return items;
}

export async function publishCommand({
  profilePath,
  oqcSourceRoot = installedSourceRoot,
  mode = "changed",
  manifestPath,
  push = false,
  confirm,
  approval,
  requestApproval,
  experienceReport = false,
  registryPath,
  adapters = {},
}) {
  const services = { ...productionPublishAdapters, ...adapters };
  const profile = validateProfile(await readJson(profilePath));
  const runtimeDirectory = runtimePath(profilePath, profile);
  await mkdir(runtimeDirectory, { recursive: true });
  let runId = `publish-${Date.now()}`;
  let candidateSha256 = null;
  let publishedCommitSha = null;
  let isolationRoot = null;
  let installation = null;
  let primaryError = null;
  let publicationResult = null;
  try {
    const lock = await readOptionalJson(
      path.join(profile.siteProjectPath, "oqc.lock.json"),
      null,
    );
    const fingerprint = await computeFingerprint(profile, { oqcSourceRoot });
    const comparison = lock
      ? compareLock(lock, fingerprint)
      : {
          valid: false,
          drift: [{ field: "certificationLock", actual: "missing" }],
        };
    if (!comparison.valid)
      throw oqcError("CERTIFICATION_DRIFT", { drift: comparison.drift });

    const baselinePath = path.join(runtimeDirectory, "published-content.json");
    if (mode === "adopt-existing") {
      const adopted = await services.buildExistingContentBaseline({ profile });
      if (
        adopted.notPresent?.length > 0 ||
        adopted.orphanTargets?.length > 0 ||
        adopted.findings?.length > 0
      ) {
        throw oqcError("CONTENT_ADOPTION_REVIEW_REQUIRED", {
          notPresent: adopted.notPresent ?? [],
          orphanTargets: adopted.orphanTargets ?? [],
          findings: adopted.findings ?? [],
        });
      }
      const resolvedRegistryPath = registryPath ?? defaultRegistryPath();
      await services.registerSite({
        registryPath: resolvedRegistryPath,
        siteId: profile.siteId,
        profilePath,
      });
      await services.writeContentBaseline({
        baselinePath,
        baseline: adopted.baseline,
      });
      return {
        status: "BASELINE_ADOPTED",
        mode,
        adopted: adopted.baseline.items.length,
        excluded: adopted.excluded.length,
        notPresent: adopted.notPresent.length,
        baselinePath,
      };
    }

    let baselineResult = null;
    let publicItems = [];
    let preparedCopies = [];
    let stagingContentPath = null;
    if (mode !== "surface-only") {
      if (!["changed", "manifest"].includes(mode))
        throw oqcError("PUBLISH_MODE_INVALID");
      baselineResult = await services.readContentBaseline({
        baselinePath,
        siteId: profile.siteId,
      });
      if (
        ["changed", "manifest"].includes(mode) &&
        baselineResult.status === "MISSING"
      )
        throw oqcError("CONTENT_BASELINE_MISSING");
      if (
        ["changed", "manifest"].includes(mode) &&
        services.compareContentBaseline
      ) {
        const reconciliation = await services.compareContentBaseline({
          profile,
          baseline: baselineResult.baseline,
        });
        if (
          reconciliation.sourceDeleted.length > 0 ||
          reconciliation.targetMissing.length > 0 ||
          reconciliation.targetDrift.length > 0
        ) {
          throw oqcError("CONTENT_RECONCILIATION_REQUIRED", {
            sourceDeleted: reconciliation.sourceDeleted,
            targetMissing: reconciliation.targetMissing,
            targetDrift: reconciliation.targetDrift,
          });
        }
      }
      const discovery = await services.discoverContent({
        vaultPath: profile.vaultPath,
        baseline: baselineResult.baseline?.items ?? [],
        mode,
        manifestPath,
        contentPolicy: profile.content,
      });
      isolationRoot = await mkdtemp(path.join(os.tmpdir(), "oqc-v11-luna-"));
      stagingContentPath = path.join(isolationRoot, profile.contentDirectory);
      const copies = await services.preparePublicCopies({
        items: discovery.items,
        vaultPath: profile.vaultPath,
        stagingContentPath,
      });
      preparedCopies = copies;
      publicItems = await services.adaptPublicCopies({
        copies,
        contentRoot: stagingContentPath,
        profile,
      });
    }
    const surfacePaths = await certificationSurfacePaths(oqcSourceRoot);
    if (stagingContentPath) {
      installation = await services.installPublicCopies({
        copies: preparedCopies,
        stagingContentPath,
        siteContentPath: path.join(
          profile.siteProjectPath,
          profile.contentDirectory,
        ),
      });
    }
    const quartz = await services.verifyQuartz({
      profile,
      candidate: { items: publicItems },
    });
    installation = null;
    const prepared = await services.prepareGitRelease({
      site: profile.siteProjectPath,
      allowedPaths: [
        ...publicItems.map((item) => item.siteRelativePath),
        ...surfacePaths,
      ],
      branch: profile.branch,
      repositoryUrl: profile.repositoryUrl,
    });
    const surfaceItems = await certificationSurfaceItems({
      siteProjectPath: profile.siteProjectPath,
      stagedPaths: prepared.stagedPaths,
      surfacePaths,
    });
    const candidateItems = [...publicItems, ...surfaceItems];
    if (candidateItems.length === 0) {
      return { status: "NO_CHANGES", mode: "fast", changedContent: [] };
    }
    const verification = {
      technicalStatus: "PASS",
      privacyStatus: "PASS",
      smokeStatus: quartz.smoke?.status ?? "PASS",
    };
    const stagedFiles = await snapshotStagedFiles({
      site: profile.siteProjectPath,
      stagedPaths: prepared.stagedPaths,
    });
    runId = `pub-${canonicalSha256({ items: candidateItems, remoteBase: prepared.remoteHead, verification }).slice(0, 16)}`;
    const candidate = createCandidate({
      runId,
      items: candidateItems,
      stagedFiles,
      remoteBase: prepared.remoteHead,
      verification,
    });
    candidateSha256 = candidate.sha256;
    const candidatePath = path.join(runtimeDirectory, "pending-candidate.json");
    await atomicWriteJson(candidatePath, candidate);
    if (!push) {
      return {
        status: "READY_FOR_APPROVAL",
        mode: "fast",
        candidate,
        requiredConfirmation: `PUBLISH ${candidate.sha256.slice(0, 12)}`,
        candidatePath,
      };
    }

    let typedConfirmation = confirm;
    if (approval) {
      if (approval !== candidate.sha256) throw oqcError("APPROVAL_STALE");
      typedConfirmation = `PUBLISH ${candidate.sha256.slice(0, 12)}`;
    }
    if (!typedConfirmation && requestApproval)
      typedConfirmation = await requestApproval(candidate);
    if (!typedConfirmation) {
      return {
        status: "AWAITING_APPROVAL",
        mode: "fast",
        candidate,
        requiredConfirmation: `PUBLISH ${candidate.sha256.slice(0, 12)}`,
        candidatePath,
      };
    }
    const approvalRecord = approveCandidate(candidate, typedConfirmation);
    const gitResult = await services.commitAndPush({
      site: profile.siteProjectPath,
      branch: profile.branch,
      candidate,
      approval: approvalRecord,
      repositoryUrl: profile.repositoryUrl,
    });
    publishedCommitSha = gitResult.commitSha;
    const remote = await services.verifyGitHubPublication({
      repository: profile.repositoryUrl,
      branch: profile.branch,
      commitSha: gitResult.commitSha,
      liveUrls: [
        profile.liveUrl,
        ...publicItems.map((item) => publicUrl(profile, item.targetPath)),
      ],
    });
    if (remote.status !== "PASS")
      throw oqcError(remote.errorCode ?? "LIVE_RESOURCE_FAILED");

    if (mode !== "surface-only") {
      const previousBaseline =
        baselineResult.baseline ??
        createContentBaseline({
          siteId: profile.siteId,
          initializedBy: "publish",
          items: [],
        });
      const nextBaseline = mergeBaseline(
        previousBaseline,
        publicItems,
        profile.siteId,
      );
      await services.writeContentBaseline({
        baselinePath,
        baseline: nextBaseline,
      });
    }
    const runResult = {
      schemaVersion: "oqc.publish-result.v1",
      runId,
      mode: "fast",
      status: "COMPLETE",
      candidateSha256: candidate.sha256,
      commitSha: gitResult.commitSha,
      pushStatus: gitResult.pushStatus,
      liveVerification: "PASS",
      changedContent: publicItems.map((item) => item.sourcePath),
    };
    const runResultPath = path.join(runtimeDirectory, `run-${runId}.json`);
    await atomicWriteJson(runResultPath, runResult);
    let experienceReportPath = null;
    if (
      experienceReport ||
      (mode !== "surface-only" &&
        (baselineResult.baseline?.items.length ?? 0) === 0)
    ) {
      experienceReportPath = path.join(
        runtimeDirectory,
        `experience-${runId}.md`,
      );
      await atomicWriteText(
        experienceReportPath,
        renderExperienceReport({
          ...runResult,
          command: "oqc publish --changed --push",
          elapsedMs: 0,
          difficulties: [],
        }),
      );
    }
    publicationResult = {
      status: "COMPLETE",
      mode: "fast",
      publicationCompleted: true,
      commitSha: gitResult.commitSha,
      pushStatus: gitResult.pushStatus,
      candidate,
      summary: `${publicItems.length} item(s) published`,
      runResultPath,
      experienceReportPath,
    };
    return publicationResult;
  } catch (error) {
    primaryError = error;
    if (installation) {
      const rollbackFailures = await installation.rollback();
      if (rollbackFailures.length > 0) {
        error.rollbackFailures = [
          ...(error.rollbackFailures ?? []),
          ...rollbackFailures,
        ];
      }
    }
    publishedCommitSha = error.commitSha ?? publishedCommitSha;
    const modeDetail =
      mode === "manifest" && manifestPath
        ? `manifest:${path.resolve(manifestPath)}`
        : mode;
    const resumeCommand =
      error.safeResume ??
      `oqc publish --profile "${profilePath}" --${mode} --push`;
    const resumeContext = [
      `profile=${path.resolve(profilePath)}`,
      `mode=${modeDetail}`,
      `candidate=${candidateSha256 ?? "not-created"}`,
      `branch=${profile.branch}`,
      `commit=${publishedCommitSha ?? "not-created"}`,
    ].join(" ");
    const incident = createIncident({
      runId,
      stage: "publish",
      errorCode: error.code ?? "PUBLISH_FAILED",
      safeResume: `${resumeCommand} | ${resumeContext}`,
    });
    await writeIncident({ runtimeDirectory, incident });
    throw error;
  } finally {
    if (isolationRoot) {
      const tempRoot = path.resolve(os.tmpdir());
      const resolved = path.resolve(isolationRoot);
      if (
        path.dirname(resolved) === tempRoot &&
        path.basename(resolved).startsWith("oqc-v11-luna-")
      ) {
        try {
          await services.removeIsolationRoot(resolved, {
            recursive: true,
            force: true,
          });
        } catch (cleanupError) {
          const cleanupFailure = {
            code: cleanupError.code ?? "ISOLATION_CLEANUP_FAILED",
            message: cleanupError.message,
          };
          if (primaryError) {
            primaryError.cleanupFailure = cleanupFailure;
          } else if (publicationResult) {
            publicationResult.status = "COMPLETE";
            publicationResult.publicationCompleted = true;
            publicationResult.cleanupFailure = cleanupFailure;
            const cleanupIncident = createIncident({
              runId: `cleanup-${runId}`,
              stage: "isolation-cleanup",
              errorCode: "ISOLATION_CLEANUP_FAILED",
              safeResume: `Remove-Item -LiteralPath "${resolved}" -Recurse -Force`,
            });
            await writeIncident({
              runtimeDirectory,
              incident: cleanupIncident,
            }).catch((incidentError) => {
              publicationResult.cleanupIncidentFailure = {
                code: incidentError.code ?? "INCIDENT_WRITE_FAILED",
                message: incidentError.message,
              };
            });
          } else {
            throw oqcError("ISOLATION_CLEANUP_FAILED", { cleanupFailure });
          }
        }
      }
    }
  }
}

import { buildQuartz } from "./build.mjs";
import { publishGit } from "./git-publish.mjs";
import { loadCoreProfile } from "./profile.mjs";
import { applyPresentation } from "./presentation.mjs";
import { syncContent } from "./sync.mjs";
const defaults = { applyPresentation, syncContent, buildQuartz, publishGit };
export async function publishCore({ profilePath, adapters = defaults }) {
  const profile = await loadCoreProfile(profilePath);
  const { vaultPath, siteProjectPath } = profile;
  const presentationResult = await adapters.applyPresentation({
    siteProjectPath,
    presentation: profile.presentation,
  });
  const sync = await adapters.syncContent({
    vaultPath,
    siteContentPath: path.join(siteProjectPath, profile.contentDirectory),
    content: profile.content,
  });
  const build = await adapters.buildQuartz({
    siteProjectPath,
    presentation: profile.presentation,
  });
  const git = await adapters.publishGit({
    siteProjectPath,
    branch: profile.branch ?? "main",
    repositoryUrl: profile.repositoryUrl,
    message: `OQC core publish ${new Date().toISOString()}`,
  });
  return {
    status: git.status,
    copied: sync.copied,
    deleted: sync.deleted,
    buildStatus: build.status,
    commitSha: git.commitSha,
    pushStatus: git.pushStatus,
    presentationStatus: presentationResult.status,
  };
}
import path from "node:path";

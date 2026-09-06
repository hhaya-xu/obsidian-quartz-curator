import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadCoreProfile } from "../source/lib/profile.mjs";

async function profileFile(value) {
  const root = await mkdtemp(path.join(os.tmpdir(), "oqc-core-profile-"));
  const file = path.join(root, "profile.json");
  await writeFile(file, `\uFEFF${JSON.stringify(value)}`);
  return { root, file };
}

test("loads a legacy Profile without presentation", async () => {
  const { root, file } = await profileFile({
    vaultPath: "vault",
    siteProjectPath: "site",
    repositoryUrl: "https://example.invalid/repo.git",
  });
  try {
    const profile = await loadCoreProfile(file);
    assert.equal(profile.profilePath, file);
    assert.equal(profile.vaultPath, path.join(path.dirname(file), "vault"));
    assert.equal(profile.contentDirectory, "content");
    assert.equal(profile.presentation, null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("normalizes a presentation Profile and relative hero video", async () => {
  const { root, file } = await profileFile({
    vaultPath: "vault",
    siteProjectPath: "site",
    presentation: {
      skin: "aisz-console",
      hero: {
        videoSource: "assets/hero.mp4",
        title: "Configured title",
        subtitle: "Configured subtitle",
        utilityLabels: ["a", "b", "c", "d"],
        lowerLabels: ["e", "f"],
        descriptionLines: ["line"],
      },
    },
  });
  try {
    const profile = await loadCoreProfile(file);
    assert.equal(profile.presentation.skin, "aisz-console");
    assert.equal(
      profile.presentation.hero.videoSource,
      path.join(path.dirname(file), "assets", "hero.mp4"),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects unsupported skins and incomplete heroes", async () => {
  for (const presentation of [
    { skin: "unknown" },
    {
      skin: "standard-design",
      hero: {
        videoSource: "hero.mp4",
        title: "x",
        subtitle: "x",
        utilityLabels: ["a"],
        lowerLabels: ["b", "c"],
        descriptionLines: ["d"],
      },
    },
  ]) {
    const { root, file } = await profileFile({
      vaultPath: "vault",
      siteProjectPath: "site",
      presentation,
    });
    try {
      await assert.rejects(loadCoreProfile(file), /CORE_PROFILE_INVALID/u);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
});

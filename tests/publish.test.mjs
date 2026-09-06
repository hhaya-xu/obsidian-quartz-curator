import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { publishCore } from "../source/lib/publish.mjs";

const temporaryRoots = [];
test.after(async () => {
  await Promise.all(
    temporaryRoots.map((root) => rm(root, { recursive: true, force: true })),
  );
});

test("core runs sync then build then git and returns the real result", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "oqc-core-publish-"));
  temporaryRoots.push(root);
  const profilePath = path.join(root, "profile.json");
  await writeFile(
    profilePath,
    JSON.stringify({
      vaultPath: "vault",
      siteProjectPath: "site",
      contentDirectory: "content",
      branch: "main",
      repositoryUrl: "git@github.com:o/r.git",
    }),
  );
  const order = [];
  const result = await publishCore({
    profilePath,
    adapters: {
      applyPresentation: async () => (
        order.push("presentation"),
        { status: "SKIPPED", changed: [] }
      ),
      syncContent: async () => (
        order.push("sync"),
        { copied: ["a.md"], deleted: [] }
      ),
      buildQuartz: async () => (order.push("build"), { status: "BUILT" }),
      publishGit: async () => (
        order.push("git"),
        { status: "PUSHED", commitSha: "ABC" }
      ),
    },
  });
  assert.deepEqual(order, ["presentation", "sync", "build", "git"]);
  assert.equal(result.commitSha, "ABC");
  assert.equal(result.presentationStatus, "SKIPPED");
  await rm(root, { recursive: true, force: true });
});

test("build failure never invokes git", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "oqc-core-publish-"));
  temporaryRoots.push(root);
  const profilePath = path.join(root, "profile.json");
  await writeFile(
    profilePath,
    JSON.stringify({
      vaultPath: "vault",
      siteProjectPath: "site",
      contentDirectory: "content",
      branch: "main",
      repositoryUrl: "git@github.com:o/r.git",
    }),
  );
  let gitCalls = 0;
  await assert.rejects(
    publishCore({
      profilePath,
      adapters: {
        applyPresentation: async () => ({ status: "SKIPPED", changed: [] }),
        syncContent: async () => ({ copied: [], deleted: [] }),
        buildQuartz: async () => {
          throw new Error("build failed");
        },
        publishGit: async () => {
          gitCalls += 1;
        },
      },
    }),
    /build failed/u,
  );
  assert.equal(gitCalls, 0);
  await rm(root, { recursive: true, force: true });
});

test("core passes normalized presentation to the presentation and build adapters", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "oqc-core-publish-"));
  temporaryRoots.push(root);
  const profilePath = path.join(root, "profile.json");
  await writeFile(
    profilePath,
    JSON.stringify({
      vaultPath: "vault",
      siteProjectPath: "site",
      presentation: {
        skin: "aisz-console",
        hero: {
          videoSource: "hero.mp4",
          title: "T",
          subtitle: "S",
          utilityLabels: ["1", "2", "3", "4"],
          lowerLabels: ["5", "6"],
          descriptionLines: ["D"],
        },
      },
    }),
  );
  let received;
  await publishCore({
    profilePath,
    adapters: {
      applyPresentation: async (value) => (
        (received = value),
        { status: "APPLIED", changed: [] }
      ),
      syncContent: async () => ({ copied: [], deleted: [] }),
      buildQuartz: async (value) => (
        assert.equal(value.presentation.skin, "aisz-console"),
        { status: "BUILT" }
      ),
      publishGit: async () => ({ status: "PUSHED", commitSha: "SHA" }),
    },
  });
  assert.equal(
    received.presentation.hero.videoSource,
    path.join(root, "hero.mp4"),
  );
  await rm(root, { recursive: true, force: true });
});

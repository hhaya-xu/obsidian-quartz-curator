import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildQuartz } from "../source/lib/build.mjs";

test("build reports success and propagates a nonzero command", async () => {
  assert.equal(
    (
      await buildQuartz({
        siteProjectPath: "site",
        run: async () => ({ exitCode: 0 }),
      })
    ).status,
    "BUILT",
  );
  await assert.rejects(
    buildQuartz({
      siteProjectPath: "site",
      run: async () => ({ exitCode: 2, stderr: "bad" }),
    }),
    /QUARTZ_BUILD_FAILED/u,
  );
});

test("build passes normalized presentation settings to Quartz", async () => {
  let options;
  await buildQuartz({
    siteProjectPath: "site",
    presentation: {
      skin: "aisz-console",
      hero: {
        title: "T",
        subtitle: "S",
        utilityLabels: ["1", "2", "3", "4"],
        lowerLabels: ["5", "6"],
        descriptionLines: ["D"],
        videoSource: "video.mp4",
      },
    },
    run: async (_command, _args, passed) => {
      options = passed;
      return { exitCode: 0 };
    },
  });
  assert.equal(options.cwd, "site");
  assert.equal(options.env.OQC_SKIN, "aisz-console");
  assert.equal(
    JSON.parse(options.env.OQC_HOME_HERO).videoUrl,
    "static/oqc-hero-video.mp4",
  );
});

test("build does not replace a packagePath presentation with standard-design", async () => {
  let options;
  await buildQuartz({
    siteProjectPath: "site",
    presentation: { packagePath: "packages/custom-package" },
    run: async (_command, _args, passed) => {
      options = passed;
      return { exitCode: 0 };
    },
  });
  assert.notEqual(options.env.OQC_SKIN, "standard-design");
});

test("build launches the real Quartz bootstrap entry on Windows", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "oqc-core-build-real-"));
  try {
    await mkdir(path.join(root, "quartz"));
    await writeFile(
      path.join(root, "quartz", "bootstrap-cli.mjs"),
      'process.exitCode = process.argv[2] === "build" ? 0 : 2;\n',
    );
    const result = await buildQuartz({ siteProjectPath: root });
    assert.equal(result.status, "BUILT");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

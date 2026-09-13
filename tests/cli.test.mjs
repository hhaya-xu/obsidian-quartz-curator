import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const cli = path.join(projectRoot, "source", "bin", "oqc-core.mjs");
const run = (args) =>
  spawnSync(process.execPath, [cli, ...args], {
    cwd: projectRoot,
    encoding: "utf8",
  });

test("core CLI exposes only the core publish path", () => {
  const version = run(["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.equal(version.stdout.trim(), "1.2.1");
  const help = run(["--help"]);
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /oqc core publish --profile <file>/u);
  assert.match(help.stdout, /oqc core publish --site <alias>/u);
  assert.doesNotMatch(help.stdout, /certify|reconcile|approval|incident/u);
});

test("default site alias reads the core profiles directory", async () => {
  const profileDirectory = path.join(projectRoot, "profiles");
  const profilePath = path.join(
    profileDirectory,
    "default-directory-check.json",
  );
  await mkdir(profileDirectory, { recursive: true });
  await writeFile(
    profilePath,
    JSON.stringify({
      vaultPath: path.join(os.tmpdir(), "oqc-no-vault"),
      siteProjectPath: path.join(os.tmpdir(), "oqc-no-site"),
    }),
  );
  try {
    const result = run([
      "core",
      "publish",
      "--site",
      "default-directory-check",
    ]);
    assert.notEqual(result.stderr, "CORE_PROFILE_INVALID\n");
    assert.match(result.stderr, /ENOENT/u);
  } finally {
    await rm(profilePath, { force: true });
  }
});

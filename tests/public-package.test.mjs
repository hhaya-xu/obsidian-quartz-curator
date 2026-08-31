import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";

import { validateProfile } from "../lib/profile.mjs";

const packageRoot = path.resolve(import.meta.dirname, "..");

test("package version matches VERSION", async () => {
  const pkg = JSON.parse(
    await readFile(path.join(packageRoot, "package.json"), "utf8"),
  );
  const version = (
    await readFile(path.join(packageRoot, "VERSION"), "utf8")
  ).trim();
  assert.equal(pkg.version, "1.1.0");
  assert.equal(version, "1.1.0");
});

test("CLI reports the package version", () => {
  const result = spawnSync(
    process.execPath,
    [path.join(packageRoot, "bin", "oqc.mjs"), "--version"],
    {
      cwd: packageRoot,
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /1\.1\.0/u);
});

test("public governance and contract files exist", async () => {
  for (const relativePath of [
    "README.md",
    "SKILL.md",
    "schemas/site-profile.schema.json",
    "site-profile.example.json",
    ".gitignore",
    "CHANGELOG.md",
    "RELEASE.md",
    "MIGRATION-v1.1.md",
  ]) {
    await readFile(path.join(packageRoot, relativePath));
  }
});

test("example profile matches schema fields and runtime normalization", async () => {
  const example = JSON.parse(
    await readFile(path.join(packageRoot, "site-profile.example.json"), "utf8"),
  );
  const schema = JSON.parse(
    await readFile(
      path.join(packageRoot, "schemas/site-profile.schema.json"),
      "utf8",
    ),
  );
  for (const key of Object.keys(example))
    assert.ok(Object.hasOwn(schema.properties, key), key);
  for (const key of Object.keys(example.content))
    assert.ok(Object.hasOwn(schema.properties.content.properties, key), key);
  assert.deepEqual(example.content, {
    homeSource: "HOME.md",
    homeTarget: "index.md",
    excludeDirectories: ["docs"],
  });
  const normalized = validateProfile(example);
  assert.equal(normalized.content.homeSource, "HOME.md");
  assert.equal(normalized.content.homeTarget, "index.md");
  assert.deepEqual(normalized.content.excludeDirectories, ["docs"]);
});

import { spawnSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const testRoot = path.join(packageRoot, "tests");

async function discoverTests(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(
    (error) => {
      if (error.code === "ENOENT") return [];
      throw error;
    },
  );
  const discovered = [];
  for (const entry of entries.sort((a, b) =>
    a.name.localeCompare(b.name, "en"),
  )) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory())
      discovered.push(...(await discoverTests(entryPath)));
    else if (entry.isFile() && entry.name.endsWith(".test.mjs"))
      discovered.push(entryPath);
  }
  return discovered;
}

const testFiles = await discoverTests(testRoot);
if (testFiles.length === 0) {
  throw new Error("OQC public package found zero public tests");
}

const result = spawnSync(process.execPath, ["--test", ...testFiles], {
  cwd: packageRoot,
  encoding: "utf8",
});
if (result.error) throw result.error;
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exitCode = result.status ?? 1;

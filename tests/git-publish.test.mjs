import assert from "node:assert/strict";
import test from "node:test";
import { publishGit } from "../source/lib/git-publish.mjs";

test("git publishes one commit and falls back from SSH to HTTPS", async () => {
  const calls = [];
  const run = async (_cwd, args) => {
    calls.push(args);
    if (args[0] === "status")
      return { exitCode: 0, stdout: " M content/a.md\n" };
    if (args[0] === "rev-parse") return { exitCode: 0, stdout: "ABCDEF\n" };
    if (args[0] === "push" && args[1].startsWith("git@"))
      return { exitCode: 1, stderr: "network" };
    return { exitCode: 0, stdout: "" };
  };
  const result = await publishGit({
    siteProjectPath: "site",
    branch: "main",
    repositoryUrl: "git@github.com:owner/repo.git",
    message: "publish",
    run,
  });
  assert.equal(result.commitSha, "ABCDEF");
  assert.equal(calls.filter((args) => args[0] === "commit").length, 1);
  assert.ok(
    calls.some(
      (args) =>
        args[0] === "push" && args[1] === "https://github.com/owner/repo.git",
    ),
  );
  assert.equal(calls.flat().includes("--force"), false);
});

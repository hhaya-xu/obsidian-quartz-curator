import { spawn } from "node:child_process";
async function gitProcess(cwd, args) {
  return new Promise((resolve) => {
    const child = spawn("git", args, { cwd, shell: false });
    let stdout = "",
      stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("close", (exitCode) => resolve({ exitCode, stdout, stderr }));
  });
}
const httpsRemote = (remote) =>
  /^git@github\.com:(.+)$/u.test(remote)
    ? `https://github.com/${remote.match(/^git@github\.com:(.+)$/u)[1]}`
    : remote;
export async function publishGit({
  siteProjectPath,
  branch = "main",
  repositoryUrl,
  message = "OQC core publish",
  run = gitProcess,
}) {
  const status = await run(siteProjectPath, ["status", "--porcelain"]);
  if (!status.stdout.trim())
    return {
      status: "NO_CHANGES",
      commitSha: (
        await run(siteProjectPath, ["rev-parse", "HEAD"])
      ).stdout.trim(),
      pushStatus: "NOT_NEEDED",
    };
  for (const args of [
    ["add", "-A"],
    ["commit", "-m", message],
  ]) {
    const result = await run(siteProjectPath, args);
    if (result.exitCode !== 0)
      throw new Error(
        `GIT_COMMAND_FAILED: git ${args.join(" ")}\n${result.stderr ?? ""}`,
      );
  }
  const commitSha = (
    await run(siteProjectPath, ["rev-parse", "HEAD"])
  ).stdout.trim();
  let pushed = await run(siteProjectPath, [
    "push",
    repositoryUrl,
    `${branch}:${branch}`,
  ]);
  const fallback = httpsRemote(repositoryUrl);
  if (pushed.exitCode !== 0 && fallback !== repositoryUrl)
    pushed = await run(siteProjectPath, [
      "push",
      fallback,
      `${branch}:${branch}`,
    ]);
  if (pushed.exitCode !== 0)
    throw new Error(`GIT_PUSH_FAILED\n${pushed.stderr ?? ""}`);
  return { status: "PUSHED", commitSha, pushStatus: "PUSHED" };
}

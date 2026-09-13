import { spawn } from "node:child_process";
import path from "node:path";
async function spawnProcess(command, args, options) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { ...options, shell: false });
    let stdout = "",
      stderr = "";
    child.stdout?.on("data", (chunk) => (stdout += chunk));
    child.stderr?.on("data", (chunk) => (stderr += chunk));
    child.on("close", (exitCode) => resolve({ exitCode, stdout, stderr }));
  });
}
export async function buildQuartz({
  siteProjectPath,
  presentation = null,
  run = spawnProcess,
}) {
  const buildEnv = {
    ...process.env,
    OQC_SKIN: presentation?.skin ?? "",
    OQC_HOME_HERO: presentation?.hero
      ? JSON.stringify({
          ...presentation.hero,
          videoUrl: "static/oqc-hero-video.mp4",
        })
      : "",
  };
  const result = await run(
    process.execPath,
    [path.join(siteProjectPath, "quartz", "bootstrap-cli.mjs"), "build"],
    { cwd: siteProjectPath, env: buildEnv },
  );
  if (result.exitCode !== 0)
    throw new Error(`QUARTZ_BUILD_FAILED\n${result.stderr ?? ""}`);
  return { status: "BUILT" };
}

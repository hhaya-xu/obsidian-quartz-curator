import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { validateApproval } from "./approval.mjs";
import { sha256 } from "./hashing.mjs";

const execFileAsync = promisify(execFile);

function gitError(code, details = {}) {
  const error = new Error(code);
  error.code = code;
  Object.assign(error, details);
  return error;
}

async function gitProcess(site, args) {
  const result = await execFileAsync("git", args, {
    cwd: site,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    timeout: 15_000,
    killSignal: "SIGTERM",
  });
  return { stdout: result.stdout, stderr: result.stderr, exitCode: 0 };
}

export function githubHttpsRemote(repositoryUrl) {
  const match = /^git@github\.com:([^/]+)\/(.+\.git)$/u.exec(repositoryUrl);
  return match ? `https://github.com/${match[1]}/${match[2]}` : repositoryUrl;
}

export function classifyGitFailure(error) {
  if (error.code === "ETIMEDOUT" || error.killed)
    return "GIT_SSH_NETWORK_FAILED";
  const text = `${error.stderr ?? ""}\n${error.message ?? ""}`;
  if (
    /Permission denied|Authentication failed|could not read Username/iu.test(
      text,
    )
  )
    return "GIT_AUTH_FAILED";
  if (/non-fast-forward|fetch first|rejected/iu.test(text))
    return "NON_FAST_FORWARD";
  if (
    /Connection closed|Connection refused|timed out|Could not resolve host|proxy/iu.test(
      text,
    )
  )
    return "GIT_SSH_NETWORK_FAILED";
  return "GIT_COMMAND_FAILED";
}

function stableGitError(code, error, details = {}) {
  return gitError(code, {
    stderr: error.stderr ?? null,
    exitCode: error.exitCode ?? error.code ?? null,
    cause: error,
    ...details,
  });
}

export async function queryRemoteHead({
  site,
  branch,
  repositoryUrl,
  runGit = gitProcess,
}) {
  const initialRemote = repositoryUrl ?? "origin";
  try {
    const result = await runGit(site, [
      "ls-remote",
      initialRemote,
      `refs/heads/${branch}`,
    ]);
    return {
      sha: result.stdout.split(/\s+/u)[0] || null,
      transport: {
        initialTransport: repositoryUrl?.startsWith("git@github.com:")
          ? "ssh"
          : "origin-or-https",
        fallbackAttempted: false,
        fallbackTransport: null,
      },
    };
  } catch (error) {
    const code = classifyGitFailure(error);
    if (
      code !== "GIT_SSH_NETWORK_FAILED" ||
      !repositoryUrl?.startsWith("git@github.com:")
    )
      throw stableGitError(code, error);
    const https = githubHttpsRemote(repositoryUrl);
    try {
      const result = await runGit(site, [
        "ls-remote",
        https,
        `refs/heads/${branch}`,
      ]);
      return {
        sha: result.stdout.split(/\s+/u)[0] || null,
        transport: {
          initialTransport: "ssh",
          initialErrorCode: code,
          fallbackAttempted: true,
          fallbackTransport: "https",
        },
      };
    } catch (fallbackError) {
      throw stableGitError(classifyGitFailure(fallbackError), fallbackError, {
        initialErrorCode: code,
        fallbackAttempted: true,
        fallbackTransport: "https",
      });
    }
  }
}

function portable(value) {
  return value.replaceAll("\\", "/");
}

export async function snapshotStagedFiles({ site, stagedPaths }) {
  const paths = [...new Set(stagedPaths.map(portable))].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
  const snapshot = [];
  for (const filePath of paths) {
    try {
      snapshot.push({
        path: filePath,
        state: "present",
        sha256: sha256(await readFile(path.join(site, ...filePath.split("/")))),
      });
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      snapshot.push({ path: filePath, state: "deleted", sha256: null });
    }
  }
  return snapshot;
}

function isAllowed(filePath, allowedPaths) {
  const candidate = portable(filePath);
  return allowedPaths.some((allowedPath) => {
    const allowed = portable(allowedPath).replace(/\/+$/u, "");
    return candidate === allowed || candidate.startsWith(`${allowed}/`);
  });
}

function parsePorcelain(output) {
  if (!output) return [];
  const records = output.split("\0").filter(Boolean);
  const paths = [];
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    const status = record.slice(0, 2);
    paths.push(portable(record.slice(3)));
    if (status.includes("R") || status.includes("C")) {
      index += 1;
      if (records[index]) paths.push(portable(records[index]));
    }
  }
  return [...new Set(paths)].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
}

async function remoteHead(site, branch, runGit, remote = "origin") {
  try {
    const result = await runGit(site, [
      "ls-remote",
      remote,
      `refs/heads/${branch}`,
    ]);
    return result.stdout.split(/\s+/u)[0] || null;
  } catch {
    return null;
  }
}

export async function prepareGitRelease({
  site,
  allowedPaths,
  expectedRemoteBase,
  branch,
  repositoryUrl,
  runGit = gitProcess,
}) {
  const currentBranch =
    branch ??
    (await runGit(site, ["rev-parse", "--abbrev-ref", "HEAD"])).stdout.trim();
  const status = await runGit(site, [
    "-c",
    "core.quotepath=false",
    "status",
    "--porcelain=v1",
    "-z",
  ]);
  const dirtyPaths = parsePorcelain(status.stdout);
  const unrelated = dirtyPaths.filter(
    (filePath) => !isAllowed(filePath, allowedPaths),
  );
  if (unrelated.length > 0)
    throw gitError("UNRELATED_DIRTY_WORKTREE", { paths: unrelated });
  const head = (await runGit(site, ["rev-parse", "HEAD"])).stdout.trim();
  const currentRemoteHead = repositoryUrl
    ? (
        await queryRemoteHead({
          site,
          branch: currentBranch,
          repositoryUrl,
          runGit,
        })
      ).sha
    : ((await remoteHead(site, currentBranch, runGit)) ?? head);
  if (expectedRemoteBase && expectedRemoteBase !== currentRemoteHead) {
    throw gitError("REMOTE_BASE_DRIFT", {
      expected: expectedRemoteBase,
      actual: currentRemoteHead,
    });
  }
  return {
    head,
    remoteHead: currentRemoteHead,
    stagedPaths: dirtyPaths,
    commitMessage: `OQC publish ${dirtyPaths.length} item(s)`,
  };
}

export async function pushCandidate({ candidate, currentRemote }) {
  if (candidate.remoteBase !== currentRemote) {
    throw gitError("REMOTE_BASE_DRIFT", {
      expected: candidate.remoteBase,
      actual: currentRemote,
    });
  }
  return { status: "READY" };
}

export async function commitAndPush({
  site,
  branch,
  candidate,
  approval,
  repositoryUrl,
  runGit = gitProcess,
}) {
  validateApproval(candidate, approval);
  const currentRemote = repositoryUrl
    ? (await queryRemoteHead({ site, branch, repositoryUrl, runGit })).sha
    : ((await remoteHead(site, branch, runGit)) ?? candidate.remoteBase);
  await pushCandidate({ candidate, currentRemote });
  const stagedFiles = candidate.stagedFiles;
  if (!Array.isArray(stagedFiles)) throw gitError("CANDIDATE_MUTATED");
  const stagedPaths = stagedFiles.map((item) => item.path);
  if (
    stagedPaths.some(
      (filePath) =>
        !filePath || filePath === ".." || filePath.startsWith("../"),
    )
  ) {
    throw gitError("INVALID_STAGED_PATH");
  }
  const status = await runGit(site, [
    "-c",
    "core.quotepath=false",
    "status",
    "--porcelain=v1",
    "-z",
  ]);
  const actualDirtyPaths = parsePorcelain(status.stdout);
  const expectedStagedPaths = [...new Set(stagedPaths)].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
  if (JSON.stringify(actualDirtyPaths) !== JSON.stringify(expectedStagedPaths))
    throw gitError("CANDIDATE_MUTATED", {
      expected: expectedStagedPaths,
      actual: actualDirtyPaths,
    });
  const currentStagedFiles = await snapshotStagedFiles({ site, stagedPaths });
  if (JSON.stringify(currentStagedFiles) !== JSON.stringify(stagedFiles))
    throw gitError("CANDIDATE_MUTATED");
  const gitArguments = [];
  const addArguments = ["add", "--", ...stagedPaths];
  gitArguments.push(addArguments.join(" "));
  await runGit(site, addArguments);
  const commitArguments = [
    "commit",
    "-m",
    `OQC publish ${candidate.sha256.slice(0, 12)}`,
  ];
  gitArguments.push(commitArguments.join(" "));
  await runGit(site, commitArguments);
  const commitSha = (await runGit(site, ["rev-parse", "HEAD"])).stdout.trim();
  const primaryRemote = repositoryUrl ?? "origin";
  const pushArguments = ["push", primaryRemote, `HEAD:${branch}`];
  gitArguments.push(pushArguments.join(" "));
  try {
    await runGit(site, pushArguments);
  } catch (error) {
    const code = classifyGitFailure(error);
    if (
      code !== "GIT_SSH_NETWORK_FAILED" ||
      !repositoryUrl?.startsWith("git@github.com:")
    ) {
      throw stableGitError(code, error, {
        safeResume: `git -C "${site}" push "${primaryRemote}" ${commitSha}:refs/heads/${branch}`,
        commitSha,
      });
    }
    const https = githubHttpsRemote(repositoryUrl);
    const fallbackArguments = [
      "push",
      https,
      `${commitSha}:refs/heads/${branch}`,
    ];
    gitArguments.push(fallbackArguments.join(" "));
    try {
      await runGit(site, fallbackArguments);
    } catch (fallbackError) {
      throw stableGitError(classifyGitFailure(fallbackError), fallbackError, {
        initialErrorCode: code,
        fallbackAttempted: true,
        fallbackTransport: "https",
        safeResume: `git -C "${site}" push "${https}" ${commitSha}:refs/heads/${branch}`,
        commitSha,
      });
    }
    return {
      commitSha,
      pushStatus: "PUSHED",
      initialTransport: "ssh",
      initialErrorCode: code,
      fallbackTransport: "https",
      fallbackAttempted: true,
      safeResume: null,
      gitArguments,
    };
  }
  return {
    commitSha,
    pushStatus: "PUSHED",
    safeResume: null,
    gitArguments,
  };
}

export async function resumePush({
  site,
  branch,
  candidate,
  approval,
  commitSha,
  repositoryUrl,
  runGit = gitProcess,
}) {
  validateApproval(candidate, approval);
  const localHead = (await runGit(site, ["rev-parse", "HEAD"])).stdout.trim();
  if (localHead !== commitSha) {
    throw gitError("LOCAL_COMMIT_DRIFT", {
      expected: commitSha,
      actual: localHead,
    });
  }
  const primaryRemote = repositoryUrl ?? "origin";
  const currentRemote = repositoryUrl
    ? (await queryRemoteHead({ site, branch, repositoryUrl, runGit })).sha
    : await remoteHead(site, branch, runGit, primaryRemote);
  if (currentRemote === commitSha) {
    return { commitSha, pushStatus: "ALREADY_PUSHED", safeResume: null };
  }
  if (currentRemote !== candidate.remoteBase) {
    throw gitError("REMOTE_BASE_DRIFT", {
      expected: candidate.remoteBase,
      actual: currentRemote,
    });
  }
  const pushArguments = [
    "push",
    primaryRemote,
    `${commitSha}:refs/heads/${branch}`,
  ];
  try {
    await runGit(site, pushArguments);
  } catch (error) {
    const code = classifyGitFailure(error);
    if (
      code !== "GIT_SSH_NETWORK_FAILED" ||
      !repositoryUrl?.startsWith("git@github.com:")
    ) {
      throw stableGitError(code, error, {
        safeResume: `git -C "${site}" push "${primaryRemote}" ${commitSha}:refs/heads/${branch}`,
        commitSha,
      });
    }
    const https = githubHttpsRemote(repositoryUrl);
    try {
      await runGit(site, ["push", https, `${commitSha}:refs/heads/${branch}`]);
    } catch (fallbackError) {
      throw stableGitError(classifyGitFailure(fallbackError), fallbackError, {
        initialErrorCode: code,
        fallbackAttempted: true,
        fallbackTransport: "https",
        safeResume: `git -C "${site}" push "${https}" ${commitSha}:refs/heads/${branch}`,
        commitSha,
      });
    }
    return {
      commitSha,
      pushStatus: "PUSHED",
      fallbackTransport: "https",
      safeResume: null,
    };
  }
  const verifiedRemote = repositoryUrl
    ? (await queryRemoteHead({ site, branch, repositoryUrl, runGit })).sha
    : await remoteHead(site, branch, runGit, primaryRemote);
  if (verifiedRemote !== commitSha) throw gitError("PUSH_VERIFICATION_FAILED");
  return { commitSha, pushStatus: "PUSHED", safeResume: null };
}

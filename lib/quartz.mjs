import { spawn } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import path from "node:path";

function commandError(command, result) {
  const error = new Error(
    `QUARTZ_COMMAND_FAILED: ${command.id} exited ${result.exitCode}`,
  );
  error.code = "QUARTZ_COMMAND_FAILED";
  error.command = command.id;
  error.result = result;
  return error;
}

export function runProcess({ id, file, args, cwd }) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, { cwd, shell: false, windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("error", reject);
    child.once("close", (exitCode) =>
      resolve({ id, exitCode, stdout, stderr }),
    );
  });
}

function basePathFromBaseUrl(baseUrl) {
  const pathname = new URL(`https://${baseUrl}`).pathname;
  return pathname === "/" ? "/" : `/${pathname.replace(/^\/+|\/+$/gu, "")}/`;
}

function candidateHtmlPath(targetPath) {
  const portable = targetPath.replaceAll("\\", "/");
  return portable.replace(/\.md$/iu, ".html");
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveOutputReference(
  publicPath,
  value,
  basePath,
  htmlRelativePath,
) {
  const clean = value.split(/[?#]/u, 1)[0];
  let relativePath;
  if (clean.startsWith("/")) {
    relativePath = clean.slice(basePath.length);
  } else {
    relativePath = path.posix.normalize(
      path.posix.join(path.posix.dirname(htmlRelativePath), clean),
    );
  }
  relativePath = relativePath.replace(/^\.\//u, "");
  if (relativePath === ".." || relativePath.startsWith("../")) return false;
  const candidates = [];
  if (!relativePath || relativePath === "." || relativePath.endsWith("/"))
    candidates.push(path.join(relativePath, "index.html"));
  else if (path.posix.extname(relativePath)) candidates.push(relativePath);
  else
    candidates.push(
      `${relativePath}.html`,
      path.join(relativePath, "index.html"),
    );
  for (const candidate of candidates)
    if (await exists(path.join(publicPath, ...candidate.split("/"))))
      return true;
  return false;
}

export async function smokePublicOutput({
  publicPath,
  basePath,
  siteOrigin,
  candidate,
}) {
  const findings = [];
  const checkedHtml = [];
  for (const item of candidate.items ?? []) {
    if (!item.targetPath?.toLowerCase().endsWith(".md")) continue;
    const htmlRelativePath = candidateHtmlPath(item.targetPath);
    const htmlPath = path.join(publicPath, ...htmlRelativePath.split("/"));
    let html;
    try {
      html = await readFile(htmlPath, "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      findings.push({ code: "PUBLIC_HTML_MISSING", path: htmlRelativePath });
      continue;
    }
    checkedHtml.push(htmlRelativePath);
    const referencePattern = /(?:src|href)=["']([^"']+)["']/giu;
    for (const match of html.matchAll(referencePattern)) {
      const value = match[1];
      if (/^(?:https?:|mailto:|tel:|data:|#)/iu.test(value)) {
        if (/^https?:/iu.test(value)) {
          const url = new URL(value);
          if (
            siteOrigin &&
            url.origin === siteOrigin &&
            url.pathname.startsWith("/") &&
            basePath !== "/" &&
            !url.pathname.startsWith(basePath)
          ) {
            findings.push({
              code: "PAGES_BASE_PATH_ESCAPE",
              path: htmlRelativePath,
            });
          }
        }
        continue;
      }
      if (
        value.startsWith("/") &&
        basePath !== "/" &&
        !value.startsWith(basePath)
      ) {
        findings.push({
          code: "PAGES_BASE_PATH_ESCAPE",
          path: htmlRelativePath,
        });
        continue;
      }
      if (
        !(await resolveOutputReference(
          publicPath,
          value,
          basePath,
          htmlRelativePath,
        ))
      ) {
        findings.push({ code: "LIVE_RESOURCE_FAILED", path: htmlRelativePath });
      }
    }
  }
  return {
    status: findings.length === 0 ? "PASS" : "FAIL",
    checkedHtml,
    findings,
  };
}

export async function verifyQuartz({
  profile,
  candidate,
  run = runProcess,
  onCommand = () => {},
}) {
  const cwd = profile.siteProjectPath;
  const commands = [
    {
      id: "typecheck",
      file: process.execPath,
      args: [
        path.join(cwd, "node_modules", "typescript", "bin", "tsc"),
        "--noEmit",
      ],
      cwd,
    },
    {
      id: "site-tests",
      file: process.execPath,
      args: [
        path.join(cwd, "node_modules", "tsx", "dist", "cli.mjs"),
        "--test",
      ],
      cwd,
    },
    {
      id: "quartz-build",
      file: process.execPath,
      args: [path.join(cwd, "quartz", "bootstrap-cli.mjs"), "build"],
      cwd,
    },
  ];
  const results = {};
  for (const command of commands) {
    onCommand(command);
    const result = await run(command);
    if (result.exitCode !== 0) throw commandError(command, result);
    results[command.id] = result;
  }
  const smoke = await smokePublicOutput({
    publicPath: path.join(cwd, "public"),
    basePath: basePathFromBaseUrl(profile.baseUrl),
    siteOrigin: new URL(`https://${profile.baseUrl}`).origin,
    candidate,
  });
  if (smoke.status !== "PASS") {
    const error = new Error(
      `QUARTZ_SMOKE_FAILED: ${smoke.findings[0]?.code ?? "UNKNOWN"}`,
    );
    error.code = "QUARTZ_SMOKE_FAILED";
    error.smoke = smoke;
    throw error;
  }
  return {
    typecheck: results.typecheck,
    siteTests: results["site-tests"],
    build: results["quartz-build"],
    smoke,
  };
}

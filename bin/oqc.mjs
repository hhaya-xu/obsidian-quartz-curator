#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

import { certifyCommand } from "../lib/commands/certify.mjs";
import { publishCommand } from "../lib/commands/publish.mjs";
import { formatStatus, statusCommand } from "../lib/commands/status.mjs";
import { oqcError } from "../lib/errors.mjs";
import {
  defaultRegistryPath,
  resolveSiteProfile,
} from "../lib/site-registry.mjs";

const sourceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const help = `OQC v1.1

Usage:
  oqc status  [--profile <private-profile> | --site <alias>]
  oqc certify [--profile <private-profile> | --site <alias>] [--prepare | --visual-approval-ref <reference>]
  oqc publish [--profile <private-profile> | --site <alias>] [--changed | --manifest <file>] [--push]

Options:
  --approval <candidate-sha256>  Non-interactive candidate-bound approval
  --experience-report            Force an experience-report draft
  --surface-only                 Publish certified surface without Vault content
  --adopt-existing               Adopt an existing site's current content
  --help                         Show this help
  --version                      Show the OQC version
`;

function valueAfter(args, flag) {
  const index = args.indexOf(flag);
  if (index < 0) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("--"))
    throw new Error(`${flag} requires a value`);
  return value;
}

async function resolveProfileSelector(args) {
  const profilePath = valueAfter(args, "--profile");
  const siteId = valueAfter(args, "--site");
  if (profilePath && siteId) throw oqcError("SITE_SELECTOR_CONFLICT");
  if (profilePath) return profilePath;
  if (siteId)
    return resolveSiteProfile({
      registryPath: defaultRegistryPath(),
      siteId,
    });
  throw oqcError("SITE_SELECTOR_REQUIRED");
}

function publishMode(args) {
  const selected = [
    ["changed", args.includes("--changed")],
    ["manifest", args.includes("--manifest")],
    ["surface-only", args.includes("--surface-only")],
    ["adopt-existing", args.includes("--adopt-existing")],
  ].filter(([, enabled]) => enabled);
  if (selected.length > 1) throw oqcError("PUBLISH_MODE_CONFLICT");
  return selected[0]?.[0] ?? "changed";
}

async function main(args) {
  if (args.length === 0 || args.includes("--help")) {
    process.stdout.write(help);
    return;
  }
  if (args.includes("--version")) {
    process.stdout.write(
      (await readFile(path.join(sourceRoot, "VERSION"), "utf8")).trim() + "\n",
    );
    return;
  }
  const command = args[0];
  const profilePath = await resolveProfileSelector(args);
  if (command === "status") {
    process.stdout.write(
      `${formatStatus(await statusCommand({ profilePath }))}\n`,
    );
    return;
  }
  if (command === "certify") {
    const result = await certifyCommand({
      profilePath,
      visualApprovalRef: valueAfter(args, "--visual-approval-ref") ?? null,
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  if (command === "publish") {
    const mode = publishMode(args);
    const manifestPath = valueAfter(args, "--manifest");
    const push = args.includes("--push");
    const approval = valueAfter(args, "--approval");
    const requestApproval =
      push && !approval
        ? async (candidate) => {
            const terminal = readline.createInterface({
              input: process.stdin,
              output: process.stdout,
            });
            try {
              return await terminal.question(
                `Type PUBLISH ${candidate.sha256.slice(0, 12)} to continue: `,
              );
            } finally {
              terminal.close();
            }
          }
        : undefined;
    const result = await publishCommand({
      profilePath,
      mode,
      manifestPath,
      push,
      approval,
      requestApproval,
      experienceReport: args.includes("--experience-report"),
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  throw new Error(`unknown command: ${command}`);
}

main(process.argv.slice(2)).catch((error) => {
  process.stderr.write(`${error.code ?? "OQC_ERROR"}: ${error.message}\n`);
  process.exitCode = 1;
});

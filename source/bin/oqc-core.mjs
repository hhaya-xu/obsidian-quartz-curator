#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { publishCore } from "../lib/publish.mjs";
import { resolveProfilePath } from "../lib/profile-path.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const help =
  "Usage:\n  oqc core publish --profile <file>\n  oqc core publish --site <alias>\n";
const args = process.argv.slice(2);
try {
  if (args.includes("--version"))
    process.stdout.write(
      (await readFile(path.join(root, "VERSION"), "utf8")).trim() + "\n",
    );
  else if (args.length === 0 || args.includes("--help"))
    process.stdout.write(help);
  else if (args[0] === "core" && args[1] === "publish") {
    const explicitProfile = args[2] === "--profile" ? args[3] : undefined;
    const site = args[2] === "--site" ? args[3] : undefined;
    if ((!explicitProfile && !site) || args.length !== 4)
      throw new Error("CORE_ARGUMENT_INVALID");
    const profilePath = resolveProfilePath({
      explicitProfile,
      site,
      profileDirectory:
        process.env.OQC_PROFILE_DIR ?? path.resolve(root, "..", "profiles"),
    });
    process.stdout.write(
      JSON.stringify(await publishCore({ profilePath }), null, 2) + "\n",
    );
  } else throw new Error("CORE_ARGUMENT_INVALID");
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}

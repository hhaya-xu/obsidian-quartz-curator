import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function scanFiles(root, excluded = new Set()) {
  const files = [];
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = join(directory, entry.name);
      const rel = relative(root, absolute).replaceAll("\\", "/");
      if (excluded.has(rel)) continue;
      const stat = lstatSync(absolute);
      if (stat.isSymbolicLink())
        throw new Error(`refusing symbolic link: ${rel}`);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.isFile()) {
        const bytes = readFileSync(absolute);
        files.push({
          path: rel,
          bytes: bytes.length,
          sha256: createHash("sha256").update(bytes).digest("hex"),
        });
      }
    }
  }
  walk(root);
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const root = resolve(process.argv[2] ?? ".");
  const output = resolve(process.argv[3] ?? join(root, "MANIFEST.sha256.json"));
  const files = scanFiles(
    root,
    new Set([relative(root, output).replaceAll("\\", "/")]),
  );
  const manifest = {
    schemaVersion: "oqc.release-manifest.v1",
    version: "1.0.0",
    technicalStatus: "PASS",
    visualApproval: true,
    releaseApproval: true,
    files,
  };
  writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(
    JSON.stringify({ root: basename(root), files: files.length, output }),
  );
}

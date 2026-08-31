import { createHash } from "node:crypto";
import {
  lstatSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function scanFiles(root, excluded = new Set()) {
  const files = [];
  function walk(directory) {
    const entries = readdirSync(directory, { withFileTypes: true }).sort(
      (left, right) => left.name.localeCompare(right.name, "en"),
    );
    for (const entry of entries) {
      const absolute = join(directory, entry.name);
      const relativePath = relative(root, absolute).replaceAll("\\", "/");
      if (excluded.has(relativePath)) continue;
      const metadata = lstatSync(absolute);
      if (metadata.isSymbolicLink())
        throw new Error(`refusing symbolic link: ${relativePath}`);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.isFile()) {
        const bytes = readFileSync(absolute);
        files.push({
          path: relativePath,
          bytes: bytes.length,
          sha256: createHash("sha256")
            .update(bytes)
            .digest("hex")
            .toUpperCase(),
        });
      }
    }
  }
  walk(root);
  return files.sort((left, right) => left.path.localeCompare(right.path, "en"));
}

export function buildManifest(root, excluded = new Set()) {
  const version = readFileSync(join(root, "VERSION"), "utf8").trim();
  return {
    schemaVersion: "oqc.release-manifest.v1",
    version,
    files: scanFiles(root, excluded),
  };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const root = resolve(process.argv[2] ?? ".");
  const output = resolve(process.argv[3] ?? join(root, "MANIFEST.sha256.json"));
  const excluded = new Set([relative(root, output).replaceAll("\\", "/")]);
  const manifest = buildManifest(root, excluded);
  const temporary = join(
    dirname(output),
    `.${basename(output)}.${process.pid}.tmp`,
  );
  writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  renameSync(temporary, output);
  console.log(
    JSON.stringify({
      root: basename(root),
      files: manifest.files.length,
      output,
    }),
  );
}

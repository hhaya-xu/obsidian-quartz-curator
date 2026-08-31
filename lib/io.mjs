import { randomUUID } from "node:crypto";
import { lstat, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { canonicalJson, sha256 } from "./hashing.mjs";

export async function atomicWriteText(targetPath, text) {
  const temporaryPath = path.join(
    path.dirname(targetPath),
    `.${path.basename(targetPath)}.${process.pid}.${randomUUID()}.tmp`,
  );
  await writeFile(temporaryPath, text, "utf8");
  await rename(temporaryPath, targetPath);
}

export async function atomicWriteBytes(targetPath, bytes) {
  const temporaryPath = path.join(
    path.dirname(targetPath),
    `.${path.basename(targetPath)}.${process.pid}.${randomUUID()}.tmp`,
  );
  await writeFile(temporaryPath, bytes);
  await rename(temporaryPath, targetPath);
}

export async function atomicWriteJson(targetPath, value) {
  await atomicWriteText(targetPath, `${canonicalJson(value)}\n`);
}

export async function inventoryRegularFiles(root) {
  const files = [];

  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);
      const metadata = await lstat(absolutePath);
      if (entry.isSymbolicLink() || metadata.isSymbolicLink()) {
        throw new Error(
          `symbolic link or reparse point is not allowed: ${absolutePath}`,
        );
      }
      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }
      if (!entry.isFile())
        throw new Error(`unsupported public entry: ${absolutePath}`);
      const bytes = await readFile(absolutePath);
      files.push({
        path: path.relative(root, absolutePath).split(path.sep).join("/"),
        bytes: metadata.size,
        sha256: sha256(bytes),
      });
    }
  }

  await walk(root);
  return files.sort((left, right) => left.path.localeCompare(right.path, "en"));
}

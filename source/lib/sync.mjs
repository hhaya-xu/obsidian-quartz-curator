import {
  lstat,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
const ignored = new Set([".obsidian", "private", "templates"]);
const extensions = new Set([
  ".md",
  ".canvas",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".pdf",
  ".mp3",
  ".mp4",
]);
const portable = (value) => value.replaceAll("\\", "/");
async function files(
  root,
  publicOnly = false,
  excludedDirectories = new Set(),
) {
  const result = [];
  async function walk(directory, relative = "") {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      const metadata = await lstat(absolute);
      if (metadata.isSymbolicLink())
        throw new Error(`symbolic links are unsupported: ${absolute}`);
      const next = portable(path.join(relative, entry.name));
      if (
        publicOnly &&
        entry.isDirectory() &&
        (ignored.has(entry.name) ||
          (relative === "" && excludedDirectories.has(entry.name)))
      )
        continue;
      if (entry.isDirectory()) await walk(absolute, next);
      else if (
        entry.isFile() &&
        (!publicOnly || extensions.has(path.extname(entry.name).toLowerCase()))
      )
        result.push({ absolute, relative: next });
    }
  }
  await walk(root);
  return result;
}
export async function syncContent({
  vaultPath,
  siteContentPath,
  content = {},
}) {
  await mkdir(siteContentPath, { recursive: true });
  const desired = new Map();
  const excludedDirectories = new Set(content.excludeDirectories ?? []);
  for (const source of await files(vaultPath, true, excludedDirectories)) {
    const target =
      source.relative === content.homeSource
        ? content.homeTarget
        : source.relative;
    desired.set(target ?? source.relative, source);
  }
  const copied = [];
  for (const [relative, source] of desired) {
    const target = path.join(siteContentPath, ...relative.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    let bytes = await readFile(source.absolute);
    if (
      relative === content.homeTarget &&
      content.homeHeading !== undefined &&
      source.relative === content.homeSource
    ) {
      const text = bytes.toString("utf8");
      if (!/^# (?!#)\S.*$/mu.test(text))
        throw new Error("CORE_HOME_HEADING_NOT_FOUND");
      bytes = Buffer.from(
        text.replace(/^# (?!#)\S.*$/mu, `# ${content.homeHeading}`),
        "utf8",
      );
    }
    await writeFile(target, bytes);
    copied.push(relative);
  }
  const deleted = [];
  for (const target of await files(siteContentPath))
    if (!desired.has(target.relative)) {
      await rm(target.absolute);
      deleted.push(target.relative);
    }
  return { copied: copied.sort(), deleted: deleted.sort() };
}

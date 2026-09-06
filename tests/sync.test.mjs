import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { syncContent } from "../source/lib/sync.mjs";

const temporaryRoots = [];
test.after(async () => {
  await Promise.all(
    temporaryRoots.map((root) => rm(root, { recursive: true, force: true })),
  );
});

async function inventory(root) {
  const result = [];
  async function walk(dir) {
    for (const entry of await import("node:fs/promises").then((fs) =>
      fs.readdir(dir, { withFileTypes: true }),
    )) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else
        result.push([
          path.relative(root, absolute).replaceAll("\\", "/"),
          (await readFile(absolute)).toString("hex"),
        ]);
    }
  }
  await walk(root);
  return result.sort();
}

test("sync mirrors public Vault content without changing the Vault", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "oqc-core-sync-"));
  temporaryRoots.push(root);
  const vault = path.join(root, "vault");
  const site = path.join(root, "site-content");
  await mkdir(path.join(vault, "images"), { recursive: true });
  await mkdir(path.join(vault, ".obsidian"));
  await mkdir(site);
  await writeFile(path.join(vault, "HOME.md"), "# Home");
  await writeFile(path.join(vault, "article.md"), "article");
  await writeFile(
    path.join(vault, "images", "tea.png"),
    Buffer.from([1, 2, 3]),
  );
  await writeFile(path.join(vault, ".obsidian", "secret.md"), "private");
  await writeFile(path.join(site, "old.md"), "old");
  const before = await inventory(vault);
  const result = await syncContent({
    vaultPath: vault,
    siteContentPath: site,
    content: { homeSource: "HOME.md", homeTarget: "index.md" },
  });
  assert.deepEqual(await inventory(vault), before);
  assert.equal(await readFile(path.join(site, "index.md"), "utf8"), "# Home");
  assert.equal(
    await readFile(path.join(site, "article.md"), "utf8"),
    "article",
  );
  await assert.rejects(
    readFile(path.join(site, "old.md")),
    (error) => error.code === "ENOENT",
  );
  assert.ok(result.deleted.includes("old.md"));
});

test("sync excludes profile directories from the public copy", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "oqc-core-sync-exclude-"));
  temporaryRoots.push(root);
  const vault = path.join(root, "vault");
  const site = path.join(root, "site-content");
  await mkdir(path.join(vault, "docs"), { recursive: true });
  await mkdir(path.join(vault, "public"), { recursive: true });
  await mkdir(path.join(site, "docs"), { recursive: true });
  await writeFile(path.join(vault, "docs", "private.md"), "private");
  await writeFile(path.join(vault, "public", "article.md"), "public");
  await writeFile(path.join(site, "docs", "stale.md"), "stale");

  const result = await syncContent({
    vaultPath: vault,
    siteContentPath: site,
    content: { excludeDirectories: ["docs"] },
  });

  assert.equal(
    await readFile(path.join(site, "public", "article.md"), "utf8"),
    "public",
  );
  await assert.rejects(
    readFile(path.join(site, "docs", "private.md")),
    (error) => error.code === "ENOENT",
  );
  await assert.rejects(
    readFile(path.join(site, "docs", "stale.md")),
    (error) => error.code === "ENOENT",
  );
  assert.ok(result.deleted.includes("docs/stale.md"));
});

test("sync preserves Obsidian Canvas files as public knowledge content", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "oqc-core-sync-canvas-"));
  temporaryRoots.push(root);
  const vault = path.join(root, "vault");
  const site = path.join(root, "site-content");
  await mkdir(vault);
  await mkdir(site);
  await writeFile(path.join(vault, "map.canvas"), '{"nodes":[],"edges":[]}');

  await syncContent({ vaultPath: vault, siteContentPath: site });

  assert.equal(
    await readFile(path.join(site, "map.canvas"), "utf8"),
    '{"nodes":[],"edges":[]}',
  );
});

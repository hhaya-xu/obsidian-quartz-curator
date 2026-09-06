import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("core presentation source keeps image bounds and HomeHero contracts", async () => {
  const scss = await readFile(
    path.join(
      root,
      "source",
      "presentation",
      "quartz",
      "styles",
      "oqc-core-features.scss",
    ),
    "utf8",
  );
  const hero = await readFile(
    path.join(
      root,
      "source",
      "presentation",
      "quartz",
      "components",
      "oqc",
      "HomeHero.tsx",
    ),
    "utf8",
  );
  assert.match(scss, /display: block/u);
  assert.match(scss, /margin-left: auto/u);
  assert.match(scss, /max-width: 100%/u);
  assert.match(hero, /aspect-ratio: 16 \/ 9/u);
  assert.match(hero, /object-fit: contain/u);
  assert.match(hero, /max-width: 1024px/u);
  assert.match(hero, /@media \(max-width: 600px\)/u);
  assert.match(hero, /@media \(prefers-reduced-motion: reduce\)/u);
  assert.match(hero, /container-type: inline-size/u);
  assert.match(
    hero,
    /@media \(min-width: 601px\)[\s\S]*@container \(max-width: 760px\)[\s\S]*html\[data-oqc-skin="standard-design"\][\s\S]*\.oqc-home-hero__title-block/u,
  );
});

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

test("visual packages expose the generic manifest and skin contract", async () => {
  for (const id of ["aisz-console", "iruwangsu-archive"]) {
    const packageRoot = path.join(
      root,
      "source",
      "presentation",
      "packages",
      id,
    );
    const manifest = JSON.parse(
      await readFile(path.join(packageRoot, "manifest.json"), "utf8"),
    );
    assert.equal(manifest.schemaVersion, 1);
    assert.equal(manifest.id, id);
    assert.match(
      await readFile(path.join(packageRoot, "skin.scss"), "utf8"),
      /@mixin emit/u,
    );
    assert.equal(
      manifest.compatibility.fingerprint.startsWith("sha256:"),
      true,
    );
  }
});

test("site-specific visual sources exist only inside their packages", async () => {
  assert.equal(
    await import("node:fs/promises").then(({ access }) =>
      access(
        path.join(
          root,
          "source/presentation/skins/aisz-console/oqc-aisz-visual.scss",
        ),
      ).then(
        () => true,
        () => false,
      ),
    ),
    false,
  );
  assert.equal(
    await import("node:fs/promises").then(({ access }) =>
      access(
        path.join(
          root,
          "source/presentation/quartz/components/oqc/IruwangsuHero.tsx",
        ),
      ).then(
        () => true,
        () => false,
      ),
    ),
    false,
  );
  assert.equal(
    await import("node:fs/promises").then(({ access }) =>
      access(
        path.join(
          root,
          "source/presentation/packages/iruwangsu-archive/components/IruwangsuHero.tsx",
        ),
      ).then(
        () => true,
        () => false,
      ),
    ),
    true,
  );
});

test("iruwangsu visual source is scoped and contains responsive contracts", async () => {
  const scss = await readFile(
    path.join(
      root,
      "source",
      "presentation",
      "packages",
      "iruwangsu-archive",
      "skin.scss",
    ),
    "utf8",
  );
  const tokens = scss;
  const hero = await readFile(
    path.join(
      root,
      "source",
      "presentation",
      "packages",
      "iruwangsu-archive",
      "components",
      "IruwangsuHero.tsx",
    ),
    "utf8",
  );
  assert.match(scss, /html\[data-oqc-skin="iruwangsu-archive"\]/u);
  assert.match(scss, /max-width: 800px/u);
  assert.match(scss, /prefers-reduced-motion/u);
  assert.match(tokens, /--irw-blue: #0846d9/u);
  assert.match(hero, /fileData\.slug !== "index"/u);
  assert.doesNotMatch(hero, /video|https?:/iu);
  assert.match(scss, /> \.sidebar\.right/u);
  assert.match(scss, /> \.center > \.page-header/u);
  assert.match(scss, /grid-template-columns:\s*64% 24% 12%/u);
  assert.match(
    scss,
    /grid-template-areas:[\s\S]*"grid-sidebar-left"[\s\S]*"grid-header"/u,
  );
  assert.match(scss, /\.irw-orbit--field/u);
  assert.match(scss, /\.irw-orbit--ring/u);
  assert.match(scss, /\.irw-orbit--mark/u);
  assert.match(scss, /\.folder-container/u);
  assert.match(scss, /\.folder-button/u);
  assert.match(scss, /\.center > article h2::before/u);
  assert.match(scss, /outline:\s*2px solid var\(--irw-blue-deep\)/u);
  assert.match(hero, /irw-orbit--field/u);
  assert.match(hero, /irw-orbit--ring/u);
  assert.match(hero, /irw-orbit--mark/u);
  assert.doesNotMatch(hero, /irw-hero__circles/u);
});

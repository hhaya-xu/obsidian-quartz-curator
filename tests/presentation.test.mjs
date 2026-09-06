import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { applyPresentation } from "../source/lib/presentation.mjs";

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "oqc-core-presentation-"));
  await mkdir(path.join(root, "quartz", "styles"), { recursive: true });
  await mkdir(path.join(root, "quartz", "components"), { recursive: true });
  await writeFile(
    path.join(root, "quartz", "styles", "custom.scss"),
    '@use "./oqc-aisz-tokens.scss" as oqcAiszTokens;\n',
  );
  await writeFile(
    path.join(root, "quartz", "components", "renderPage.tsx"),
    '<html data-oqc-skin="aisz-console">',
  );
  await writeFile(
    path.join(root, "quartz.layout.ts"),
    "export default {\n  beforeBody: [\n  ],\n};\n",
  );
  return root;
}

test("presentation is skipped without a profile presentation", async () => {
  const root = await fixture();
  try {
    const result = await applyPresentation({
      siteProjectPath: root,
      presentation: null,
    });
    assert.deepEqual(result, { status: "SKIPPED", changed: [] });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("presentation installs the selected skin idempotently", async () => {
  const root = await fixture();
  try {
    const presentation = { skin: "aisz-console", hero: null };
    await applyPresentation({ siteProjectPath: root, presentation });
    const first = await readFile(
      path.join(root, "quartz", "styles", "custom.scss"),
      "utf8",
    );
    await applyPresentation({ siteProjectPath: root, presentation });
    const second = await readFile(
      path.join(root, "quartz", "styles", "custom.scss"),
      "utf8",
    );
    assert.equal(second, first);
    assert.match(first, /oqc-core-features\.scss/u);
    assert.match(first, /oqc-aisz-visual\.scss/u);
    assert.match(
      await readFile(
        path.join(root, "quartz", "components", "renderPage.tsx"),
        "utf8",
      ),
      /data-oqc-skin="aisz-console"/u,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("standard renderPage root receives the persistent skin attribute", async () => {
  const root = await fixture();
  try {
    await writeFile(
      path.join(root, "quartz", "components", "renderPage.tsx"),
      "<html lang={lang} dir={direction}>",
    );
    await applyPresentation({
      siteProjectPath: root,
      presentation: { skin: "standard-design", hero: null },
    });
    assert.match(
      await readFile(
        path.join(root, "quartz", "components", "renderPage.tsx"),
        "utf8",
      ),
      /<html lang=\{lang\} dir=\{direction\} data-oqc-skin="standard-design"/u,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("custom style injection keeps Sass use directives before existing CSS", async () => {
  const root = await fixture();
  try {
    await writeFile(
      path.join(root, "quartz", "styles", "custom.scss"),
      ".existing { color: red; }\n",
    );
    await applyPresentation({
      siteProjectPath: root,
      presentation: { skin: "standard-design", hero: null },
    });
    const custom = path.join(root, "quartz", "styles", "custom.scss");
    const installed = await readFile(custom, "utf8");
    assert.match(installed, /\.existing/u);
    assert.ok(installed.indexOf("@use") < installed.indexOf(".existing"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("home hero is profile-driven and preserves the visual contract", async () => {
  const component = await readFile(
    new URL(
      "../source/presentation/quartz/components/oqc/HomeHero.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  assert.doesNotMatch(component, /两口问茶|ONEvONE Tea-Brewing|Tea Scoop/u);
  assert.match(component, /HomeHeroConfig/u);
  assert.doesNotMatch(component, /process\.env/u);
  assert.match(component, /utilityLabels\.map/u);
  assert.match(component, /aspect-ratio: 16 \/ 9/u);
  assert.match(component, /object-fit: contain/u);
  assert.match(component, /prefers-reduced-motion/u);
});

test("hero installation copies its component and video with one marked layout entry", async () => {
  const root = await fixture();
  const video = path.join(root, "input.mp4");
  await writeFile(video, "video");
  const presentation = {
    skin: "standard-design",
    hero: {
      videoSource: video,
      title: "T",
      subtitle: "S",
      utilityLabels: ["1", "2", "3", "4"],
      lowerLabels: ["5", "6"],
      descriptionLines: ["D"],
    },
  };
  try {
    await applyPresentation({ siteProjectPath: root, presentation });
    await applyPresentation({ siteProjectPath: root, presentation });
    assert.equal(
      await readFile(
        path.join(root, "quartz", "static", "oqc-hero-video.mp4"),
        "utf8",
      ),
      "video",
    );
    const layout = await readFile(path.join(root, "quartz.layout.ts"), "utf8");
    assert.equal((layout.match(/OQC CORE HOME HERO START/gu) ?? []).length, 1);
    assert.equal((layout.match(/OqcHomeHero\(\)/gu) ?? []).length, 1);
    const config = await readFile(
      path.join(root, "quartz", "components", "oqc", "HomeHeroConfig.ts"),
      "utf8",
    );
    assert.match(config, /"title": "T"/u);
    assert.match(config, /"videoUrl": "static\/oqc-hero-video\.mp4"/u);
    assert.doesNotMatch(config, /videoSource/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("hero installation adopts an unmarked v1.1.x hero without duplicating it", async () => {
  const root = await fixture();
  const video = path.join(root, "input.mp4");
  await writeFile(video, "video");
  await writeFile(
    path.join(root, "quartz.layout.ts"),
    [
      'import OqcHomeHero from "./quartz/components/oqc/HomeHero";',
      'import * as Component from "./quartz/components";',
      "export default {",
      "  beforeBody: [",
      "    OqcHomeHero(),",
      "    Component.Breadcrumbs(),",
      "  ],",
      "};",
      "",
    ].join("\n"),
  );
  const presentation = {
    skin: "standard-design",
    hero: {
      videoSource: video,
      title: "T",
      subtitle: "S",
      utilityLabels: ["1", "2", "3", "4"],
      lowerLabels: ["5", "6"],
      descriptionLines: ["D"],
    },
  };
  try {
    await applyPresentation({ siteProjectPath: root, presentation });
    const layout = await readFile(path.join(root, "quartz.layout.ts"), "utf8");
    assert.equal((layout.match(/import OqcHomeHero/gu) ?? []).length, 1);
    assert.equal((layout.match(/OqcHomeHero\(\)/gu) ?? []).length, 1);
    assert.equal((layout.match(/OQC CORE HOME HERO ENTRY/gu) ?? []).length, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

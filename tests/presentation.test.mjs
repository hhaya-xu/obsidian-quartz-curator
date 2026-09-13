import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { applyPresentation } from "../source/lib/presentation.mjs";
import {
  computeCompatibilityFingerprint,
  installVisualPackage,
} from "../source/lib/visual-package.mjs";

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
  const { root, site, packagePath } = await packageFixture();
  try {
    const presentation = { packagePath, hero: null };
    await applyPresentation({ siteProjectPath: site, presentation });
    const first = await readFile(
      path.join(site, "quartz", "styles", "custom.scss"),
      "utf8",
    );
    await applyPresentation({ siteProjectPath: site, presentation });
    const second = await readFile(
      path.join(site, "quartz", "styles", "custom.scss"),
      "utf8",
    );
    assert.equal(second, first);
    assert.match(first, /oqc-visual-package\.scss/u);
    assert.match(
      await readFile(
        path.join(site, "quartz", "components", "renderPage.tsx"),
        "utf8",
      ),
      /data-oqc-skin="custom-package"/u,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("standard renderPage root receives the persistent skin attribute", async () => {
  const { root, site, packagePath } = await packageFixture();
  try {
    await applyPresentation({
      siteProjectPath: site,
      presentation: { packagePath, hero: null },
    });
    assert.match(
      await readFile(
        path.join(site, "quartz", "components", "renderPage.tsx"),
        "utf8",
      ),
      /<html lang=\{lang\} dir=\{direction\} data-oqc-skin="custom-package"/u,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("custom style injection keeps Sass use directives before existing CSS", async () => {
  const { root, site, packagePath } = await packageFixture();
  try {
    await writeFile(
      path.join(site, "quartz", "styles", "custom.scss"),
      ".existing { color: red; }\n",
    );
    await applyPresentation({
      siteProjectPath: site,
      presentation: { packagePath, hero: null },
    });
    const custom = path.join(site, "quartz", "styles", "custom.scss");
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

test("presentation installs iruwangsu assets and hero once", async () => {
  const { root, site, packagePath } = await packageFixture();
  try {
    await applyPresentation({
      siteProjectPath: site,
      presentation: { packagePath, hero: null },
    });
    await applyPresentation({
      siteProjectPath: site,
      presentation: { packagePath, hero: null },
    });
    const custom = await readFile(
      path.join(site, "quartz", "styles", "custom.scss"),
      "utf8",
    );
    assert.equal((custom.match(/oqc-visual-package/gu) ?? []).length, 1);
    const layout = await readFile(path.join(site, "quartz.layout.ts"), "utf8");
    assert.equal((layout.match(/Card\(\)/gu) ?? []).length, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

async function packageFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "oqc-core-package-"));
  const site = path.join(root, "site");
  const packagePath = path.join(root, "package");
  await mkdir(path.join(site, "quartz", "styles"), { recursive: true });
  await mkdir(path.join(site, "quartz", "components"), { recursive: true });
  await mkdir(path.join(site, "quartz", "static"), { recursive: true });
  await mkdir(path.join(packagePath, "components"), { recursive: true });
  await mkdir(path.join(packagePath, "assets"), { recursive: true });
  await writeFile(
    path.join(site, "quartz", "styles", "custom.scss"),
    ".existing { color: red; }\n",
  );
  await writeFile(
    path.join(site, "quartz", "components", "renderPage.tsx"),
    "<html lang={lang} dir={direction}>\n",
  );
  await writeFile(
    path.join(site, "quartz.layout.ts"),
    "export default {\n  beforeBody: [\n  ],\n};\n",
  );
  await writeFile(
    path.join(packagePath, "skin.scss"),
    "@mixin emit { .custom { color: blue; } }\n",
  );
  await writeFile(
    path.join(packagePath, "components", "Card.tsx"),
    "export default function Card() {}\n",
  );
  await writeFile(path.join(packagePath, "assets", "mark.svg"), "<svg />\n");
  const files = [
    "quartz.layout.ts",
    "quartz/components/renderPage.tsx",
    "quartz/styles/custom.scss",
  ];
  const fingerprint = await computeCompatibilityFingerprint({
    siteProjectPath: site,
    files,
  });
  await writeFile(
    path.join(packagePath, "manifest.json"),
    JSON.stringify({
      schemaVersion: 1,
      id: "custom-package",
      revision: "1",
      quartzVersion: "4.5.2",
      frozen: false,
      compatibility: { fingerprint, files },
      files: [
        {
          source: "components/Card.tsx",
          target: "quartz/components/oqc/Card.tsx",
        },
        { source: "assets/mark.svg", target: "quartz/static/mark.svg" },
      ],
      layout: {
        beforeBody: [
          { identifier: "Card", importPath: "./quartz/components/oqc/Card" },
        ],
      },
    }),
  );
  return { root, site, packagePath };
}

test("installs an arbitrary visual package and remains byte-idempotent", async () => {
  const fixture = await packageFixture();
  try {
    const compatibility = {
      files: [
        "quartz.layout.ts",
        "quartz/components/renderPage.tsx",
        "quartz/styles/custom.scss",
      ],
    };
    const fingerprint = await computeCompatibilityFingerprint({
      siteProjectPath: fixture.site,
      files: compatibility.files,
    });
    await writeFile(
      path.join(fixture.packagePath, "manifest.json"),
      JSON.stringify({
        schemaVersion: 1,
        id: "custom-package",
        revision: "1",
        quartzVersion: "4.5.2",
        frozen: false,
        compatibility: { fingerprint, files: compatibility.files },
        files: [
          {
            source: "components/Card.tsx",
            target: "quartz/components/oqc/Card.tsx",
          },
          { source: "assets/mark.svg", target: "quartz/static/mark.svg" },
        ],
        layout: {
          beforeBody: [
            { identifier: "Card", importPath: "./quartz/components/oqc/Card" },
          ],
        },
      }),
    );
    const first = await installVisualPackage({
      siteProjectPath: fixture.site,
      packagePath: fixture.packagePath,
    });
    const custom = path.join(fixture.site, "quartz", "styles", "custom.scss");
    const firstBytes = await readFile(custom);
    const second = await installVisualPackage({
      siteProjectPath: fixture.site,
      packagePath: fixture.packagePath,
    });
    assert.ok(first.changed.length > 0);
    assert.equal(second.changed.length, 0);
    assert.deepEqual(await readFile(custom), firstBytes);
    assert.equal(
      await readFile(
        path.join(fixture.site, "quartz", "styles", "oqc-visual-package.scss"),
        "utf8",
      ),
      "@mixin emit { .custom { color: blue; } }\n",
    );
    assert.equal(
      await readFile(
        path.join(fixture.site, "quartz", "components", "oqc", "Card.tsx"),
        "utf8",
      ),
      "export default function Card() {}\n",
    );
    assert.equal(
      await readFile(
        path.join(fixture.site, "quartz", "static", "mark.svg"),
        "utf8",
      ),
      "<svg />\n",
    );
    assert.equal(
      (
        await readFile(path.join(fixture.site, "quartz.layout.ts"), "utf8")
      ).match(/Card\(\)/gu).length,
      1,
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("rejects a mismatched package before changing installation targets", async () => {
  const fixture = await packageFixture();
  try {
    await writeFile(
      path.join(fixture.packagePath, "manifest.json"),
      JSON.stringify({
        schemaVersion: 1,
        id: "mismatch",
        revision: "1",
        quartzVersion: "4.5.2",
        frozen: false,
        compatibility: {
          fingerprint: `sha256:${"0".repeat(64)}`,
          files: ["quartz.layout.ts"],
        },
      }),
    );
    const custom = path.join(fixture.site, "quartz", "styles", "custom.scss");
    const before = await readFile(custom);
    await assert.rejects(
      installVisualPackage({
        siteProjectPath: fixture.site,
        packagePath: fixture.packagePath,
      }),
      /VISUAL_PACKAGE_FINGERPRINT_MISMATCH/u,
    );
    assert.deepEqual(await readFile(custom), before);
    await assert.rejects(
      readFile(
        path.join(fixture.site, "quartz", "styles", "oqc-visual-package.scss"),
      ),
      /ENOENT/u,
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

async function snapshotCompatibilityTargets(site) {
  const files = [
    "quartz/styles/custom.scss",
    "quartz/components/renderPage.tsx",
    "quartz.layout.ts",
  ];
  return Promise.all(
    files.map(async (file) => [file, await readFile(path.join(site, file))]),
  );
}

test("rejects invalid manifest structures before any target write", async () => {
  for (const mutate of [
    (manifest) => {
      manifest.layout.beforeBody = "bad";
    },
    (manifest) => {
      manifest.layout.beforeBody = [
        { identifier: "bad-name", importPath: "./not-local" },
      ];
    },
    (manifest) => {
      manifest.layout.beforeBody = [
        { identifier: "Card", importPath: "./quartz/components/other/Card" },
      ];
    },
    (manifest) => {
      manifest.files = [
        {
          source: "components/Card.tsx",
          target: "quartz/components/oqc/Card.tsx",
        },
        { source: "assets/mark.svg", target: "quartz/components/oqc/Card.tsx" },
      ];
    },
  ]) {
    const fixture = await packageFixture();
    try {
      const manifestPath = path.join(fixture.packagePath, "manifest.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
      mutate(manifest);
      await writeFile(manifestPath, JSON.stringify(manifest));
      const before = await snapshotCompatibilityTargets(fixture.site);
      await assert.rejects(
        installVisualPackage({
          siteProjectPath: fixture.site,
          packagePath: fixture.packagePath,
        }),
        /VISUAL_PACKAGE_INVALID/u,
      );
      assert.deepEqual(
        await snapshotCompatibilityTargets(fixture.site),
        before,
      );
    } finally {
      await rm(fixture.root, { recursive: true, force: true });
    }
  }
});

test("rejects a missing layout anchor before any target write", async () => {
  const fixture = await packageFixture();
  try {
    await writeFile(
      path.join(fixture.site, "quartz.layout.ts"),
      "export default {};",
    );
    const before = await snapshotCompatibilityTargets(fixture.site);
    await assert.rejects(
      installVisualPackage({
        siteProjectPath: fixture.site,
        packagePath: fixture.packagePath,
      }),
      /VISUAL_PACKAGE_INVALID/u,
    );
    assert.deepEqual(await snapshotCompatibilityTargets(fixture.site), before);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("preserves non-managed OQC layout changes in the compatibility fingerprint", async () => {
  const fixture = await packageFixture();
  try {
    const files = [
      "quartz.layout.ts",
      "quartz/components/renderPage.tsx",
      "quartz/styles/custom.scss",
    ];
    const before = await computeCompatibilityFingerprint({
      siteProjectPath: fixture.site,
      files,
    });
    await writeFile(
      path.join(fixture.site, "quartz.layout.ts"),
      'import OqcOther from "./quartz/components/oqc/Other";\nexport default { beforeBody: [OqcOther()] };\n',
    );
    const after = await computeCompatibilityFingerprint({
      siteProjectPath: fixture.site,
      files,
    });
    assert.notEqual(after, before);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { installVisualPackage } from "./visual-package.mjs";

async function installHero(siteProjectPath, hero, sourceRoot) {
  if (!hero) return [];
  const component = path.join(siteProjectPath, "quartz", "components", "oqc");
  await mkdir(component, { recursive: true });
  await mkdir(path.join(siteProjectPath, "quartz", "static"), {
    recursive: true,
  });
  await copyFile(
    path.join(
      sourceRoot,
      "presentation",
      "quartz",
      "components",
      "oqc",
      "HomeHero.tsx",
    ),
    path.join(component, "HomeHero.tsx"),
  );
  const { videoSource: _videoSource, ...publicHero } = hero;
  await writeFile(
    path.join(component, "HomeHeroConfig.ts"),
    `export default ${JSON.stringify({ ...publicHero, videoUrl: "static/oqc-hero-video.mp4" }, null, 2)} as const;\n`,
  );
  await copyFile(
    hero.videoSource,
    path.join(siteProjectPath, "quartz", "static", "oqc-hero-video.mp4"),
  );
  const layoutPath = path.join(siteProjectPath, "quartz.layout.ts");
  let layout = await readFile(layoutPath, "utf8");
  const importBlock =
    '// OQC CORE HOME HERO START\nimport OqcHomeHero from "./quartz/components/oqc/HomeHero";\n// OQC CORE HOME HERO END';
  if (!layout.includes("OQC CORE HOME HERO START")) {
    const legacyImport =
      /^\s*import\s+OqcHomeHero\s+from\s+["']\.\/quartz\/components\/oqc\/HomeHero["'];\s*$/mu;
    layout = legacyImport.test(layout)
      ? layout.replace(legacyImport, importBlock)
      : `${importBlock}\n${layout}`;
  }
  const entry = "// OQC CORE HOME HERO ENTRY\n    OqcHomeHero(),";
  if (!layout.includes("OQC CORE HOME HERO ENTRY")) {
    const legacyEntry = /^(\s*)OqcHomeHero\(\),\s*$/mu;
    if (legacyEntry.test(layout))
      layout = layout.replace(
        legacyEntry,
        "$1// OQC CORE HOME HERO ENTRY\n$1OqcHomeHero(),",
      );
    else {
      const index = layout.indexOf("beforeBody:");
      const arrayStart = layout.indexOf("[", index);
      if (index < 0 || arrayStart < 0)
        throw new Error("PRESENTATION_LAYOUT_TARGET_NOT_FOUND");
      layout = `${layout.slice(0, arrayStart + 1)}\n${entry}${layout.slice(arrayStart + 1)}`;
    }
  }
  await writeFile(layoutPath, layout);
  return [
    "quartz/components/oqc/HomeHero.tsx",
    "quartz/components/oqc/HomeHeroConfig.ts",
    "quartz/static/oqc-hero-video.mp4",
    "quartz.layout.ts",
  ];
}

export async function applyPresentation({
  siteProjectPath,
  presentation,
  sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
}) {
  if (!presentation) return { status: "SKIPPED", changed: [] };
  const changed = [];
  const packagePath =
    presentation.packagePath ??
    (presentation.skin
      ? path.join(sourceRoot, "presentation", "packages", presentation.skin)
      : null);
  if (packagePath) {
    const result = await installVisualPackage({ siteProjectPath, packagePath });
    changed.push(...result.changed);
  }
  changed.push(
    ...(await installHero(siteProjectPath, presentation.hero, sourceRoot)),
  );
  return { status: "APPLIED", changed };
}

import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const start = "// OQC CORE PRESENTATION USES START";
const end = "// OQC CORE PRESENTATION USES END";

function useBlock(skin) {
  const lines = [start, '@use "./oqc-core-features.scss" as oqcCoreFeatures;'];
  if (skin === "aisz-console") {
    lines.push(
      '@use "./oqc-aisz-tokens.scss" as oqcAiszTokens;',
      '@use "./oqc-aisz-visual.scss" as oqcAiszVisual;',
    );
  }
  lines.push(end);
  return lines.join("\n");
}

function includeBlock(skin) {
  const lines = ["@include oqcCoreFeatures.emit;"];
  if (skin === "aisz-console")
    lines.push("@include oqcAiszTokens.emit;", "@include oqcAiszVisual.emit;");
  return lines.join("\n");
}

async function installStyles(siteProjectPath, skin, sourceRoot) {
  const styles = path.join(siteProjectPath, "quartz", "styles");
  await mkdir(styles, { recursive: true });
  await copyFile(
    path.join(
      sourceRoot,
      "presentation",
      "quartz",
      "styles",
      "oqc-core-features.scss",
    ),
    path.join(styles, "oqc-core-features.scss"),
  );
  if (skin === "aisz-console") {
    for (const name of ["oqc-aisz-tokens.scss", "oqc-aisz-visual.scss"])
      await copyFile(
        path.join(sourceRoot, "presentation", "skins", "aisz-console", name),
        path.join(styles, name),
      );
  }
  const customPath = path.join(styles, "custom.scss");
  let custom = "";
  try {
    custom = await readFile(customPath, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  custom = custom
    .replace(/@use "\.\/oqc-aisz-tokens\.scss" as oqcAiszTokens;\r?\n?/gu, "")
    .replace(/@use "\.\/oqc-aisz-visual\.scss" as oqcAiszVisual;\r?\n?/gu, "")
    .replace(/@include oqcAiszTokens\.emit;\r?\n?/gu, "")
    .replace(/@include oqcAiszVisual\.emit;\r?\n?/gu, "")
    .replace(/@include oqcCoreFeatures\.emit;\r?\n?/gu, "")
    .replace(
      /\/\/ OQC CORE PRESENTATION USES START[\s\S]*?\/\/ OQC CORE PRESENTATION USES END\r?\n?/u,
      "",
    )
    .trimEnd();
  const lines = custom ? custom.split("\n") : [];
  const lastUse = lines.reduce(
    (last, line, index) => (/^\s*@use\s/u.test(line) ? index : last),
    -1,
  );
  lines.splice(lastUse + 1, 0, useBlock(skin));
  custom = `${lines.join("\n").trimEnd()}\n\n${includeBlock(skin)}\n`;
  await writeFile(customPath, custom);
}

async function installRenderSkin(siteProjectPath, skin) {
  const renderPath = path.join(
    siteProjectPath,
    "quartz",
    "components",
    "renderPage.tsx",
  );
  let text = await readFile(renderPath, "utf8");
  const expression = `data-oqc-skin="${skin}"`;
  if (text.includes("data-oqc-skin={process.env.OQC_SKIN")) {
    text = text.replace(
      /data-oqc-skin=\{process\.env\.OQC_SKIN[^}]*\}/u,
      expression,
    );
  } else if (/data-oqc-skin="[^"]*"/u.test(text)) {
    text = text.replace(/data-oqc-skin="[^"]*"/u, expression);
  } else if (text.includes("<html lang={lang} dir={direction}")) {
    text = text.replace(
      "<html lang={lang} dir={direction}",
      `${"<html lang={lang} dir={direction}"} ${expression}`,
    );
  } else throw new Error("PRESENTATION_RENDER_TARGET_NOT_FOUND");
  await writeFile(renderPath, text);
}

async function installHero(siteProjectPath, hero, sourceRoot) {
  if (!hero) return;
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
    `export default ${JSON.stringify(
      { ...publicHero, videoUrl: "static/oqc-hero-video.mp4" },
      null,
      2,
    )} as const;\n`,
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
  const entry = "// OQC CORE HOME HERO ENTRY\nOqcHomeHero(),";
  if (!layout.includes("OQC CORE HOME HERO ENTRY")) {
    const legacyEntry = /^(\s*)OqcHomeHero\(\),\s*$/mu;
    if (legacyEntry.test(layout)) {
      layout = layout.replace(
        legacyEntry,
        "$1// OQC CORE HOME HERO ENTRY\n$1OqcHomeHero(),",
      );
    } else {
      const index = layout.indexOf("beforeBody:");
      if (index < 0) throw new Error("PRESENTATION_LAYOUT_TARGET_NOT_FOUND");
      const arrayEnd = layout.indexOf("[", index);
      layout = `${layout.slice(0, arrayEnd + 1)}\n    ${entry}${layout.slice(arrayEnd + 1)}`;
    }
  }
  await writeFile(layoutPath, layout);
}

export async function applyPresentation({
  siteProjectPath,
  presentation,
  sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
}) {
  if (!presentation) return { status: "SKIPPED", changed: [] };
  await installStyles(siteProjectPath, presentation.skin, sourceRoot);
  await installRenderSkin(siteProjectPath, presentation.skin);
  await installHero(siteProjectPath, presentation.hero, sourceRoot);
  return { status: "APPLIED", changed: ["quartz/styles/custom.scss"] };
}

import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const useStart = "// OQC VISUAL PACKAGE USES START";
const useEnd = "// OQC VISUAL PACKAGE USES END";
const includeStart = "// OQC VISUAL PACKAGE INCLUDES START";
const includeEnd = "// OQC VISUAL PACKAGE INCLUDES END";
const layoutStart = "// OQC VISUAL PACKAGE LAYOUT START";
const layoutEnd = "// OQC VISUAL PACKAGE LAYOUT END";

function safeRelative(value, code) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    path.isAbsolute(value) ||
    value.split(/[\\/]/u).includes("..")
  )
    throw new Error(code);
  return value;
}

function inside(root, candidate) {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return (
    relative === "" ||
    (relative && !relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

function normalizeInterface(relative, value) {
  if (relative.endsWith("renderPage.tsx")) {
    const normalized = value
      .replace(
        /data-oqc-skin=(?:"[^"]*"|\{[^}]*\})/gu,
        "data-oqc-skin={OQC_SKIN}",
      )
      .replace(
        "<html lang={lang} dir={direction}>",
        "<html lang={lang} dir={direction} data-oqc-skin={OQC_SKIN}>",
      );
    return normalized.includes("data-oqc-skin={OQC_SKIN}")
      ? normalized
      : normalized.replace(
          "<html lang={lang} dir={direction}",
          "<html lang={lang} dir={direction} data-oqc-skin={OQC_SKIN}",
        );
  }
  if (relative.endsWith("custom.scss"))
    return value
      .replace(
        /\/\/ OQC CORE PRESENTATION USES START[\s\S]*?@include [^;]+;\r?\n?/u,
        "",
      )
      .replace(
        /^\s*@include oqc(?:CoreFeatures|AiszTokens|AiszVisual|IrwTokens|IrwVisual)\.emit;\r?\n?/gmu,
        "",
      )
      .replace(
        /\/\/ OQC VISUAL PACKAGE USES START[\s\S]*?\/\/ OQC VISUAL PACKAGE USES END\r?\n?/u,
        "",
      )
      .replace(
        /\/\/ OQC VISUAL PACKAGE INCLUDES START[\s\S]*?\/\/ OQC VISUAL PACKAGE INCLUDES END\r?\n?/u,
        "",
      );
  if (relative.endsWith("quartz.layout.ts")) {
    return value
      .replace(
        /\/\/ OQC VISUAL PACKAGE LAYOUT START[\s\S]*?\/\/ OQC VISUAL PACKAGE LAYOUT END\r?\n?/u,
        "",
      )
      .replace(
        /\/\/ OQC VISUAL PACKAGE ENTRY[\s\S]*?[A-Za-z_$][\w$]*\(\),\r?\n?/gu,
        "",
      )
      .replace(
        /\/\/ OQC CORE HOME HERO START[\s\S]*?\/\/ OQC CORE HOME HERO END\r?\n?/u,
        "",
      )
      .replace(
        /\/\/ OQC CORE HOME HERO ENTRY\r?\n?\s*OqcHomeHero\(\),\r?\n?/u,
        "",
      )
      .replace(
        /^\s*import OqcHomeHero from "\.\/quartz\/components\/oqc\/HomeHero";\r?\n?/gmu,
        "",
      );
  }
  return value;
}

export async function computeCompatibilityFingerprint({
  siteProjectPath,
  files,
}) {
  const hash = createHash("sha256");
  for (const relative of files) {
    const safe = safeRelative(relative, "VISUAL_PACKAGE_INVALID");
    const absolute = path.join(siteProjectPath, safe);
    if (!inside(siteProjectPath, absolute))
      throw new Error("VISUAL_PACKAGE_INVALID");
    hash.update(safe);
    hash.update("\0");
    hash.update(
      normalizeInterface(safe, await readFile(absolute, "utf8"))
        .replaceAll("\r\n", "\n")
        .replace(/^\s*$/gmu, "")
        .replace(/\s+/gu, " ")
        .trim(),
    );
    hash.update("\0");
  }
  return `sha256:${hash.digest("hex")}`;
}

async function readManifest(packagePath) {
  try {
    const manifest = JSON.parse(
      await readFile(path.join(packagePath, "manifest.json"), "utf8"),
    );
    if (
      manifest.schemaVersion !== 1 ||
      typeof manifest.id !== "string" ||
      !/^[A-Za-z0-9._-]+$/u.test(manifest.id) ||
      typeof manifest.revision !== "string" ||
      typeof manifest.quartzVersion !== "string" ||
      typeof manifest.frozen !== "boolean" ||
      !manifest.compatibility ||
      !Array.isArray(manifest.compatibility.files) ||
      (manifest.files !== undefined && !Array.isArray(manifest.files))
    )
      throw new Error("VISUAL_PACKAGE_INVALID");
    return manifest;
  } catch (error) {
    if (error.message === "VISUAL_PACKAGE_INVALID") throw error;
    throw new Error(`VISUAL_PACKAGE_INVALID\n${error.message}`);
  }
}

function validateManifest(manifest) {
  if (
    !manifest ||
    manifest.schemaVersion !== 1 ||
    typeof manifest.id !== "string" ||
    !/^[A-Za-z0-9._-]+$/u.test(manifest.id) ||
    typeof manifest.revision !== "string" ||
    typeof manifest.quartzVersion !== "string" ||
    typeof manifest.frozen !== "boolean" ||
    !manifest.compatibility ||
    !/^sha256:[0-9a-f]{64}$/u.test(manifest.compatibility.fingerprint) ||
    !Array.isArray(manifest.compatibility.files) ||
    (manifest.files !== undefined && !Array.isArray(manifest.files)) ||
    (manifest.layout !== undefined &&
      (!manifest.layout || !Array.isArray(manifest.layout.beforeBody)))
  )
    throw new Error("VISUAL_PACKAGE_INVALID");
  const compatibilityFiles = manifest.compatibility.files.map((file) =>
    safeRelative(file, "VISUAL_PACKAGE_INVALID"),
  );
  const mappings = [
    { source: "skin.scss", target: "quartz/styles/oqc-visual-package.scss" },
  ];
  for (const file of manifest.files ?? []) {
    if (!file || typeof file !== "object")
      throw new Error("VISUAL_PACKAGE_INVALID");
    mappings.push({
      source: safeRelative(file.source, "VISUAL_PACKAGE_INVALID"),
      target: safeRelative(file.target, "VISUAL_PACKAGE_INVALID"),
    });
  }
  const targets = new Set();
  for (const mapping of mappings) {
    if (targets.has(mapping.target)) throw new Error("VISUAL_PACKAGE_INVALID");
    targets.add(mapping.target);
  }
  const entries = manifest.layout?.beforeBody ?? [];
  const identifiers = new Set();
  for (const entry of entries) {
    if (
      !entry ||
      !/^[A-Za-z_$][\w$]*$/u.test(entry.identifier) ||
      typeof entry.importPath !== "string" ||
      !entry.importPath.startsWith("./quartz/components/oqc/") ||
      entry.importPath.split(/[\\/]/u).includes("..") ||
      identifiers.has(entry.identifier)
    )
      throw new Error("VISUAL_PACKAGE_INVALID");
    identifiers.add(entry.identifier);
  }
  return { compatibilityFiles, mappings, entries };
}

async function layoutBlock(siteProjectPath, manifest) {
  const layoutPath = path.join(siteProjectPath, "quartz.layout.ts");
  let layout = await readFile(layoutPath, "utf8");
  layout = layout.replace(
    /\/\/ OQC VISUAL PACKAGE LAYOUT START[\s\S]*?\/\/ OQC VISUAL PACKAGE LAYOUT END\r?\n?/u,
    "",
  );
  layout = layout.replace(
    /\/\/ OQC VISUAL PACKAGE ENTRY[\s\S]*?[A-Za-z_$][\w$]*\(\),\r?\n?/gu,
    "",
  );
  const packageEntries = manifest.layout?.beforeBody ?? [];
  if (packageEntries.length === 0) return layout;
  for (const entry of packageEntries) {
    const escapedPath = entry.importPath.replace(
      /[.*+?^${}()|[\]\\]/gu,
      "\\$&",
    );
    const escapedIdentifier = entry.identifier.replace(
      /[.*+?^${}()|[\]\\]/gu,
      "\\$&",
    );
    layout = layout
      .replace(
        new RegExp(
          `^\\s*import\\s+${escapedIdentifier}\\s+from\\s+['\"]${escapedPath}['\"];\\r?\\n?`,
          "gmu",
        ),
        "",
      )
      .replace(
        new RegExp(`^\\s*${escapedIdentifier}\\(\\),\\s*\\r?\\n?`, "gmu"),
        "",
      );
  }
  const imports = packageEntries.map(
    (entry) => `import ${entry.identifier} from "${entry.importPath}";`,
  );
  if (imports.length)
    layout = `${layoutStart}\n${imports.join("\n")}\n${layoutEnd}\n${layout}`;
  const entries = packageEntries.map(
    (entry) =>
      `// OQC VISUAL PACKAGE ENTRY ${entry.identifier}\n    ${entry.identifier}(),`,
  );
  if (entries.length) {
    const index = layout.indexOf("beforeBody:");
    const arrayStart = layout.indexOf("[", index);
    if (index < 0 || arrayStart < 0) throw new Error("VISUAL_PACKAGE_INVALID");
    layout = `${layout.slice(0, arrayStart + 1)}\n${entries.join("\n")}${layout.slice(arrayStart + 1)}`;
  }
  return layout;
}

async function installSkinAttribute(siteProjectPath, packageId) {
  const renderPath = path.join(
    siteProjectPath,
    "quartz",
    "components",
    "renderPage.tsx",
  );
  let text = await readFile(renderPath, "utf8");
  const expression = `data-oqc-skin="${packageId}"`;
  if (/data-oqc-skin=(?:"[^"]*"|\{[^}]*\})/u.test(text))
    text = text.replace(/data-oqc-skin=(?:"[^"]*"|\{[^}]*\})/u, expression);
  else if (text.includes("<html lang={lang} dir={direction}"))
    text = text.replace(
      "<html lang={lang} dir={direction}",
      `<html lang={lang} dir={direction} ${expression}`,
    );
  else throw new Error("VISUAL_PACKAGE_INVALID");
  return text;
}

function managedStyleContent(existing) {
  const custom = existing
    .replace(
      /\/\/ OQC CORE PRESENTATION USES START[\s\S]*?@include [^;]+;\r?\n?/u,
      "",
    )
    .replace(
      /^\s*@include oqc(?:CoreFeatures|AiszTokens|AiszVisual|IrwTokens|IrwVisual)\.emit;\r?\n?/gmu,
      "",
    )
    .replace(
      /\/\/ OQC VISUAL PACKAGE USES START[\s\S]*?\/\/ OQC VISUAL PACKAGE USES END\r?\n?/u,
      "",
    )
    .replace(
      /\/\/ OQC VISUAL PACKAGE INCLUDES START[\s\S]*?\/\/ OQC VISUAL PACKAGE INCLUDES END\r?\n?/u,
      "",
    )
    .trim();
  const lines = custom ? custom.split("\n") : [];
  const lastUse = lines.reduce(
    (last, line, index) => (/^\s*@use\s/u.test(line) ? index : last),
    -1,
  );
  lines.splice(
    lastUse + 1,
    0,
    `${useStart}\n@use "./oqc-visual-package.scss" as oqcVisualPackage;\n${useEnd}`,
  );
  return `${lines.join("\n").trimEnd()}\n\n${includeStart}\n@include oqcVisualPackage.emit;\n${includeEnd}\n`;
}

export async function installVisualPackage({ siteProjectPath, packagePath }) {
  const packageRoot = path.resolve(packagePath);
  const siteRoot = path.resolve(siteProjectPath);
  const manifest = await readManifest(packageRoot);
  const validated = validateManifest(manifest);
  const mappings = validated.mappings;
  for (const mapping of mappings) {
    const source = path.resolve(packageRoot, mapping.source);
    const target = path.resolve(siteRoot, mapping.target);
    if (!inside(packageRoot, source) || !inside(siteRoot, target))
      throw new Error("VISUAL_PACKAGE_INVALID");
    try {
      if (!(await stat(source)).isFile())
        throw new Error("VISUAL_PACKAGE_INVALID");
    } catch (error) {
      if (error.message === "VISUAL_PACKAGE_INVALID") throw error;
      throw new Error(`VISUAL_PACKAGE_INVALID\n${error.message}`);
    }
  }
  const renderPath = path.join(
    siteRoot,
    "quartz",
    "components",
    "renderPage.tsx",
  );
  const layoutPath = path.join(siteRoot, "quartz.layout.ts");
  const customPath = path.join(siteRoot, "quartz", "styles", "custom.scss");
  const render = await readFile(renderPath, "utf8");
  const layout = await readFile(layoutPath, "utf8");
  if (!render.includes("<html lang={lang} dir={direction}"))
    throw new Error("VISUAL_PACKAGE_INVALID");
  const custom = await readFile(customPath, "utf8").catch((error) => {
    if (error.code === "ENOENT") return "";
    throw error;
  });
  const nextRender = await installSkinAttribute(siteRoot, manifest.id);
  const nextLayout = await layoutBlock(siteRoot, manifest);
  const actual = await computeCompatibilityFingerprint({
    siteProjectPath: siteRoot,
    files: validated.compatibilityFiles,
  });
  if (actual !== manifest.compatibility.fingerprint)
    throw new Error("VISUAL_PACKAGE_FINGERPRINT_MISMATCH");
  const planned = [
    ...(await Promise.all(
      mappings.map(async (mapping) => ({
        relative: mapping.target,
        target: path.join(siteRoot, mapping.target),
        content: await readFile(path.join(packageRoot, mapping.source)),
      })),
    )),
    {
      relative: "quartz/styles/custom.scss",
      target: customPath,
      content: Buffer.from(managedStyleContent(custom)),
    },
    {
      relative: "quartz/components/renderPage.tsx",
      target: renderPath,
      content: Buffer.from(nextRender),
    },
    {
      relative: "quartz.layout.ts",
      target: layoutPath,
      content: Buffer.from(nextLayout),
    },
  ];
  const changed = [];
  for (const item of planned) {
    let current;
    try {
      current = await readFile(item.target);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (!current || !current.equals(item.content)) changed.push(item);
  }
  for (const item of changed) {
    await mkdir(path.dirname(item.target), { recursive: true });
    await writeFile(item.target, item.content);
  }
  return { status: "APPLIED", changed: changed.map((item) => item.relative) };
}

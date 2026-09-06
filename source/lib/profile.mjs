import { readFile } from "node:fs/promises";
import path from "node:path";

const skins = new Set(["standard-design", "aisz-console"]);

function text(value) {
  return typeof value === "string" && value.trim() !== "";
}

function normalizeHero(hero, base) {
  if (!hero || typeof hero !== "object")
    throw new Error("CORE_PROFILE_INVALID");
  if (
    !text(hero.videoSource) ||
    !text(hero.title) ||
    !text(hero.subtitle) ||
    !Array.isArray(hero.utilityLabels) ||
    hero.utilityLabels.length !== 4 ||
    !hero.utilityLabels.every(text) ||
    !Array.isArray(hero.lowerLabels) ||
    hero.lowerLabels.length !== 2 ||
    !hero.lowerLabels.every(text) ||
    !Array.isArray(hero.descriptionLines) ||
    hero.descriptionLines.length < 1 ||
    !hero.descriptionLines.every(text)
  )
    throw new Error("CORE_PROFILE_INVALID");
  return {
    ...hero,
    videoSource: path.resolve(base, hero.videoSource),
  };
}

export async function loadCoreProfile(profilePath) {
  try {
    const absolutePath = path.resolve(profilePath);
    const value = JSON.parse(
      (await readFile(absolutePath, "utf8")).replace(/^\uFEFF/u, ""),
    );
    const base = path.dirname(absolutePath);
    if (!text(value.vaultPath) || !text(value.siteProjectPath))
      throw new Error("CORE_PROFILE_INVALID");
    const presentation = value.presentation
      ? {
          ...value.presentation,
          skin: value.presentation.skin ?? "standard-design",
          hero: value.presentation.hero
            ? normalizeHero(value.presentation.hero, base)
            : null,
        }
      : null;
    if (presentation && !skins.has(presentation.skin))
      throw new Error("CORE_PROFILE_INVALID");
    return {
      ...value,
      profilePath: absolutePath,
      vaultPath: path.resolve(base, value.vaultPath),
      siteProjectPath: path.resolve(base, value.siteProjectPath),
      contentDirectory: value.contentDirectory ?? "content",
      branch: value.branch ?? "main",
      presentation,
    };
  } catch (error) {
    if (error.message === "CORE_PROFILE_INVALID") throw error;
    throw new Error(`CORE_PROFILE_INVALID\n${error.message}`);
  }
}

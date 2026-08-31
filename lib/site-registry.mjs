import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import { oqcError } from "./errors.mjs";
import { atomicWriteJson } from "./io.mjs";

const schemaVersion = "oqc.site-registry.v1";

export function defaultRegistryPath(env = process.env) {
  if (!env.LOCALAPPDATA) throw oqcError("LOCALAPPDATA_REQUIRED");
  return path.join(env.LOCALAPPDATA, "OQC", "sites.json");
}

function emptyRegistry() {
  return { schemaVersion, sites: {} };
}

function validateRegistry(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).sort().join(",") !== "schemaVersion,sites" ||
    value.schemaVersion !== schemaVersion ||
    !value.sites ||
    typeof value.sites !== "object" ||
    Array.isArray(value.sites)
  ) {
    throw oqcError("SITE_REGISTRY_INVALID");
  }
  for (const [siteId, entry] of Object.entries(value.sites)) {
    if (
      !/^[a-z0-9][a-z0-9-]{0,63}$/u.test(siteId) ||
      !entry ||
      typeof entry !== "object" ||
      Array.isArray(entry) ||
      Object.keys(entry).join(",") !== "profilePath" ||
      typeof entry.profilePath !== "string" ||
      !entry.profilePath
    ) {
      throw oqcError("SITE_REGISTRY_INVALID");
    }
  }
  return value;
}

async function readRegistry(registryPath, { missingAllowed = false } = {}) {
  try {
    const value = JSON.parse(
      (await readFile(registryPath, "utf8")).replace(/^\uFEFF/u, ""),
    );
    return validateRegistry(value);
  } catch (error) {
    if (error.code === "ENOENT" && missingAllowed) return emptyRegistry();
    if (error.code === "ENOENT") return emptyRegistry();
    if (error.code === "SITE_REGISTRY_INVALID") throw error;
    throw oqcError("SITE_REGISTRY_INVALID");
  }
}

export async function registerSite({ registryPath, siteId, profilePath }) {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/u.test(siteId))
    throw oqcError("SITE_ALIAS_INVALID");
  const registry = await readRegistry(registryPath, { missingAllowed: true });
  const resolved = path.resolve(profilePath);
  const existing = registry.sites[siteId]?.profilePath;
  if (existing && path.resolve(existing) !== resolved)
    throw oqcError("SITE_ALIAS_CONFLICT");
  registry.sites[siteId] = { profilePath: resolved };
  await mkdir(path.dirname(registryPath), { recursive: true });
  await atomicWriteJson(registryPath, registry);
  return resolved;
}

export async function resolveSiteProfile({ registryPath, siteId }) {
  const registry = await readRegistry(registryPath);
  const value = registry.sites[siteId]?.profilePath;
  if (!value) throw oqcError("SITE_ALIAS_NOT_FOUND");
  return path.resolve(value);
}

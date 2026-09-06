import path from "node:path";

export function resolveProfilePath({
  explicitProfile,
  site,
  profileDirectory,
}) {
  if (Boolean(explicitProfile) === Boolean(site))
    throw new Error("CORE_PROFILE_SELECTOR_INVALID");
  if (explicitProfile) return path.resolve(explicitProfile);
  if (!/^[A-Za-z0-9._-]+$/u.test(site))
    throw new Error("CORE_SITE_ALIAS_INVALID");
  return path.join(profileDirectory, `${site}.json`);
}

import assert from "node:assert/strict";
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const allowed = new Set([
  "siteTitle",
  "siteSubtitle",
  "vaultPath",
  "siteProjectPath",
  "baseUrl",
  "repositoryUrl",
  "locale",
  "themeAuthority",
]);

export function validateProfile(profile) {
  assert.ok(
    profile && typeof profile === "object" && !Array.isArray(profile),
    "profile must be an object",
  );
  for (const key of [
    "siteTitle",
    "vaultPath",
    "siteProjectPath",
    "baseUrl",
    "repositoryUrl",
  ])
    assert.ok(
      typeof profile[key] === "string" && profile[key].trim(),
      `${key} is required`,
    );
  for (const key of Object.keys(profile))
    assert.ok(allowed.has(key), `unknown profile field: ${key}`);
  assert.ok(
    !/^https?:\/\//u.test(profile.baseUrl),
    "baseUrl must not include a protocol",
  );
  assert.ok(
    /^https:\/\/github\.com\//u.test(profile.repositoryUrl),
    "repositoryUrl must be a GitHub HTTPS URL",
  );
  if (profile.siteSubtitle !== undefined && profile.siteSubtitle !== null)
    assert.equal(
      typeof profile.siteSubtitle,
      "string",
      "siteSubtitle must be a string or null",
    );
  const theme = profile.themeAuthority ?? {
    light: "standard-design",
    dark: "night-ink",
  };
  assert.deepEqual(theme, { light: "standard-design", dark: "night-ink" });
  return {
    ...profile,
    locale: profile.locale ?? "zh-CN",
    siteSubtitle: profile.siteSubtitle ?? null,
    themeAuthority: theme,
  };
}

export function renderTemplate(template, values) {
  const rendered = template.replace(
    /\{\{([A-Za-z][A-Za-z0-9]*)\}\}/gu,
    (_, key) => {
      assert.ok(Object.hasOwn(values, key), `missing template value: ${key}`);
      return JSON.stringify(values[key]).slice(1, -1);
    },
  );
  assert.doesNotMatch(rendered, /\{\{[^}]+\}\}/u);
  return rendered;
}

export function renderProfile(input) {
  const profile = validateProfile(input);
  return {
    config: renderTemplate(
      readFileSync(
        join(sourceRoot, "templates", "quartz.config.ts.template"),
        "utf8",
      ),
      profile,
    ),
    layout: renderTemplate(
      readFileSync(
        join(sourceRoot, "templates", "quartz.layout.ts.template"),
        "utf8",
      ),
      profile,
    ),
    profile,
  };
}

function atomicWrite(path, text) {
  const temporary = `${path}.oqc-tmp-${process.pid}`;
  writeFileSync(temporary, text, "utf8");
  renameSync(temporary, path);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const profileIndex = process.argv.indexOf("--profile");
  const targetIndex = process.argv.indexOf("--target");
  assert.ok(
    profileIndex >= 0 && targetIndex >= 0,
    "usage: --profile <json> --target <quartz-project>",
  );
  const profilePath = resolve(process.argv[profileIndex + 1]);
  const target = resolve(process.argv[targetIndex + 1]);
  assert.ok(
    existsSync(join(target, "quartz")),
    "target must be a Quartz project",
  );
  const output = renderProfile(
    JSON.parse(readFileSync(profilePath, "utf8").replace(/^\uFEFF/u, "")),
  );
  atomicWrite(join(target, "quartz.config.ts"), output.config);
  atomicWrite(join(target, "quartz.layout.ts"), output.layout);
  console.log(
    JSON.stringify({
      status: "PASS",
      target,
      siteTitle: output.profile.siteTitle,
    }),
  );
}

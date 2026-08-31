import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const allowedFields = new Set([
  "siteId",
  "siteTitle",
  "siteSubtitle",
  "vaultPath",
  "siteProjectPath",
  "baseUrl",
  "liveUrl",
  "repositoryUrl",
  "branch",
  "fontOrigin",
  "contentDirectory",
  "runtimeDirectory",
  "locale",
  "privacy",
  "themeAuthority",
  "content",
]);
const requiredStrings = [
  "siteId",
  "siteTitle",
  "vaultPath",
  "siteProjectPath",
  "baseUrl",
  "liveUrl",
  "repositoryUrl",
];

function normalizedRelative(value) {
  return value.replaceAll("\\", "/").replace(/^\.\//u, "").replace(/\/+$/u, "");
}

function normalizeContentPath(value, label) {
  assert.ok(typeof value === "string", `${label} must be a string`);
  const normalized = normalizedRelative(value);
  assert.ok(
    normalized &&
      normalized !== "." &&
      !path.isAbsolute(value) &&
      !/^[A-Za-z]:/u.test(normalized) &&
      !normalized.split("/").includes("..") &&
      !/[*?[\]]/u.test(normalized),
    `${label} is invalid`,
  );
  return normalized;
}

function normalizeContentPolicy(input = {}) {
  assert.ok(
    input && typeof input === "object" && !Array.isArray(input),
    "content must be an object",
  );
  const allowedContentFields = new Set([
    "excludeDirectories",
    "homeSource",
    "homeTarget",
  ]);
  for (const key of Object.keys(input))
    assert.ok(allowedContentFields.has(key), `unknown content field: ${key}`);

  const hasSource = input.homeSource !== null && input.homeSource !== undefined;
  const hasTarget = input.homeTarget !== null && input.homeTarget !== undefined;
  assert.equal(
    hasSource,
    hasTarget,
    "content.homeSource and content.homeTarget must appear together",
  );
  const rawExcludes = input.excludeDirectories ?? [];
  assert.ok(
    Array.isArray(rawExcludes),
    "content.excludeDirectories must be an array",
  );
  const excludeDirectories = [
    ...new Set(
      rawExcludes.map((value) =>
        normalizeContentPath(value, "content.excludeDirectories"),
      ),
    ),
  ].sort((left, right) => left.localeCompare(right, "en"));

  return {
    homeSource: hasSource
      ? normalizeContentPath(input.homeSource, "content.homeSource")
      : null,
    homeTarget: hasTarget
      ? normalizeContentPath(input.homeTarget, "content.homeTarget")
      : null,
    excludeDirectories,
  };
}

function repositoryWebUrl(repositoryUrl) {
  if (repositoryUrl.startsWith("git@github.com:")) {
    return `https://github.com/${repositoryUrl
      .slice("git@github.com:".length)
      .replace(/\.git$/u, "")}`;
  }
  return repositoryUrl.replace(/\.git$/u, "");
}

export function validateProfile(input) {
  assert.ok(
    input && typeof input === "object" && !Array.isArray(input),
    "profile must be an object",
  );
  for (const key of Object.keys(input))
    assert.ok(allowedFields.has(key), `unknown profile field: ${key}`);
  for (const key of requiredStrings) {
    assert.ok(
      typeof input[key] === "string" && input[key].trim(),
      `${key} is required`,
    );
  }

  assert.doesNotMatch(
    input.baseUrl,
    /^https?:\/\//u,
    "baseUrl must not include a protocol",
  );
  assert.match(
    input.liveUrl,
    /^https:\/\/[^\s]+$/u,
    "liveUrl must be an HTTPS URL",
  );
  assert.match(
    input.repositoryUrl,
    /^(?:https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?|git@github\.com:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\.git)$/u,
    "repositoryUrl must be a GitHub HTTPS or SSH URL",
  );

  const fontOrigin = input.fontOrigin ?? "local";
  assert.ok(
    ["local", "googleFonts"].includes(fontOrigin),
    "fontOrigin is unsupported",
  );
  const privacy = input.privacy ?? { phoneMode: "redact-public-copy" };
  assert.deepEqual(
    Object.keys(privacy).sort(),
    ["phoneMode"],
    "privacy contains unknown fields",
  );
  assert.equal(
    privacy.phoneMode,
    "redact-public-copy",
    "privacy.phoneMode is unsupported",
  );

  const contentDirectory = normalizeContentPath(
    input.contentDirectory ?? "content",
    "contentDirectory",
  );
  const runtimeDirectory = normalizedRelative(
    input.runtimeDirectory ?? ".oqc-runtime",
  );
  assert.ok(runtimeDirectory, "runtimeDirectory must not be empty");
  assert.ok(
    runtimeDirectory !== contentDirectory &&
      !runtimeDirectory.startsWith(`${contentDirectory}/`),
    "runtimeDirectory must remain outside the public content directory",
  );

  const themeAuthority = input.themeAuthority ?? {
    light: "standard-design",
    dark: "night-ink",
  };
  assert.deepEqual(themeAuthority, {
    light: "standard-design",
    dark: "night-ink",
  });

  return {
    ...input,
    siteSubtitle: input.siteSubtitle ?? null,
    branch: input.branch ?? "main",
    fontOrigin,
    contentDirectory,
    runtimeDirectory,
    locale: input.locale ?? "zh-CN",
    privacy,
    themeAuthority,
    content: normalizeContentPolicy(input.content),
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
  const templateValues = {
    ...profile,
    repositoryWebUrl: repositoryWebUrl(profile.repositoryUrl),
  };
  return {
    profile,
    config: renderTemplate(
      readFileSync(
        path.join(sourceRoot, "templates", "quartz.config.ts.template"),
        "utf8",
      ),
      templateValues,
    ),
    layout: renderTemplate(
      readFileSync(
        path.join(sourceRoot, "templates", "quartz.layout.ts.template"),
        "utf8",
      ),
      templateValues,
    ),
  };
}

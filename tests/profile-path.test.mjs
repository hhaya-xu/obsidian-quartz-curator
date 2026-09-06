import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { resolveProfilePath } from "../source/lib/profile-path.mjs";

test("resolves an explicit Profile deterministically", () => {
  assert.equal(
    resolveProfilePath({
      explicitProfile: "profiles/private.json",
      profileDirectory: path.join(os.tmpdir(), "profiles"),
    }),
    path.resolve("profiles/private.json"),
  );
});

test("resolves a site alias inside the configured directory", () => {
  assert.equal(
    resolveProfilePath({
      site: "example-site",
      profileDirectory: "C:/profiles",
    }),
    path.join("C:/profiles", "example-site.json"),
  );
});

test("rejects both or neither Profile selector", () => {
  assert.throws(
    () => resolveProfilePath({ profileDirectory: "profiles" }),
    /CORE_PROFILE_SELECTOR_INVALID/u,
  );
  assert.throws(
    () =>
      resolveProfilePath({
        explicitProfile: "a.json",
        site: "b",
        profileDirectory: "profiles",
      }),
    /CORE_PROFILE_SELECTOR_INVALID/u,
  );
});

test("rejects separators and traversal in a site alias", () => {
  for (const site of ["a/b", "a\\b", "../a", "a b"]) {
    assert.throws(
      () => resolveProfilePath({ site, profileDirectory: "profiles" }),
      /CORE_SITE_ALIAS_INVALID/u,
    );
  }
});

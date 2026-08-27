import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("public package declares v1", () => {
  assert.equal(
    readFileSync(new URL("../VERSION", import.meta.url), "utf8").trim(),
    "1.0.0",
  );
  assert.equal(existsSync(new URL("../SKILL.md", import.meta.url)), true);
});

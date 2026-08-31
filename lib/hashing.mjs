import { createHash } from "node:crypto";

function normalize(value, seen) {
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      throw new TypeError("canonical JSON rejects non-finite numbers");
    return value;
  }
  if (typeof value !== "object" || ArrayBuffer.isView(value)) {
    throw new TypeError(`canonical JSON rejects ${typeof value}`);
  }
  if (seen.has(value))
    throw new TypeError("canonical JSON rejects cyclic values");
  seen.add(value);

  let normalized;
  if (Array.isArray(value)) {
    normalized = value.map((item) => normalize(item, seen));
  } else {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError("canonical JSON accepts only plain objects");
    }
    normalized = {};
    for (const key of Object.keys(value).sort())
      normalized[key] = normalize(value[key], seen);
  }

  seen.delete(value);
  return normalized;
}

export function canonicalJson(value) {
  return JSON.stringify(normalize(value, new Set()));
}

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex").toUpperCase();
}

export function canonicalSha256(value) {
  return sha256(canonicalJson(value));
}

import path from "node:path";

function protectedRanges(text) {
  const ranges = [];
  let fence = null;
  let fenceStart = 0;
  const linePattern = /.*(?:\r?\n|$)/gu;
  for (const match of text.matchAll(linePattern)) {
    if (!match[0]) continue;
    const marker = match[0].match(/^\s*(`{3,}|~{3,})/u)?.[1];
    if (!fence && marker) {
      fence = marker[0];
      fenceStart = match.index;
    } else if (fence && marker?.[0] === fence) {
      ranges.push([fenceStart, match.index + match[0].length]);
      fence = null;
    }
  }
  if (fence) ranges.push([fenceStart, text.length]);

  for (const match of text.matchAll(/`+[^`\n]*`+/gu)) {
    if (
      !ranges.some(([start, end]) => match.index >= start && match.index < end)
    ) {
      ranges.push([match.index, match.index + match[0].length]);
    }
  }
  return ranges;
}

function isProtected(index, ranges) {
  return ranges.some(([start, end]) => index >= start && index < end);
}

function applyReplacements(text, replacements) {
  let output = text;
  for (const replacement of [...replacements].sort(
    (left, right) => right.start - left.start,
  )) {
    output = `${output.slice(0, replacement.start)}${replacement.value}${output.slice(replacement.end)}`;
  }
  return output;
}

export function adaptMarkdown(text, { sourcePath }) {
  const ranges = protectedRanges(text);
  const replacements = [];
  const changes = [];
  const findings = [];
  const sourceDirectory = path.posix.dirname(sourcePath.replaceAll("\\", "/"));
  const linkPattern = /!?\[[^\]\n]*\]\(([^)\s]+)(?:\s+["'][^)]*["'])?\)/gu;

  for (const match of text.matchAll(linkPattern)) {
    if (isProtected(match.index, ranges)) continue;
    const target = match[1];
    const targetOffset = match[0].indexOf(target);
    const targetStart = match.index + targetOffset;
    if (
      target.startsWith("/") ||
      target.startsWith("#") ||
      target.startsWith("?") ||
      /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(target)
    ) {
      continue;
    }

    const targetMatch = target.match(/^([^?#]*)([?#].*)?$/u);
    const localPath = targetMatch[1].replaceAll("\\", "/");
    const suffix = targetMatch[2] ?? "";
    const resolved = path.posix.normalize(
      path.posix.join(sourceDirectory, localPath),
    );
    if (
      resolved === ".." ||
      resolved.startsWith("../") ||
      path.posix.isAbsolute(resolved)
    ) {
      findings.push({
        code: "LINK_TARGET_OUTSIDE_VAULT",
        severity: "P1",
        index: targetStart,
      });
      continue;
    }
    const adapted = `${resolved}${suffix}`;
    replacements.push({
      start: targetStart,
      end: targetStart + target.length,
      value: adapted,
    });
    changes.push({ type: "markdown-target", from: target, to: adapted });
  }

  return { text: applyReplacements(text, replacements), changes, findings };
}

import { readFile } from "node:fs/promises";
import path from "node:path";

import { adaptMarkdown } from "./adapt-markdown.mjs";
import { oqcError } from "./errors.mjs";
import { sha256 } from "./hashing.mjs";
import { atomicWriteText } from "./io.mjs";
import { redactPublicCopy } from "./privacy.mjs";

export async function adaptPublicCopies({ copies, contentRoot, profile }) {
  if (!contentRoot) throw new Error("contentRoot is required");
  const root = contentRoot;
  const adapted = [];
  for (const copy of copies) {
    const targetPath = path.join(root, ...copy.targetPath.split("/"));
    if (!copy.targetPath.toLowerCase().endsWith(".md")) {
      adapted.push({
        ...copy,
        siteRelativePath: `${profile.contentDirectory}/${copy.targetPath}`,
      });
      continue;
    }
    const original = await readFile(targetPath, "utf8");
    const links = adaptMarkdown(original, { sourcePath: copy.sourcePath });
    if (links.findings.length > 0) throw oqcError(links.findings[0].code);
    const privacy = redactPublicCopy(links.text);
    if (privacy.findings.length > 0) throw oqcError(privacy.findings[0].code);
    await atomicWriteText(targetPath, privacy.text);
    adapted.push({
      ...copy,
      targetSha256: sha256(privacy.text),
      siteRelativePath: `${profile.contentDirectory}/${copy.targetPath}`,
      linkChanges: links.changes.length,
      redactions: privacy.redactions,
    });
  }
  return adapted;
}

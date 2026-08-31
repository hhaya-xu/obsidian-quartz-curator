import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { sanitizeDiagnostic } from "./errors.mjs";

const templatePath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "templates",
  "experience-report.md.template",
);

function renderTemplate(template, values) {
  return template.replace(
    /\{\{([A-Za-z][A-Za-z0-9]*)\}\}/gu,
    (_, key) => values[key] ?? "",
  );
}

export function renderExperienceReport(runResult) {
  const difficulties = runResult.difficulties?.length
    ? runResult.difficulties
        .map((item) => `- ${sanitizeDiagnostic(item)}`)
        .join("\n")
    : "- 无";
  return renderTemplate(readFileSync(templatePath, "utf8"), {
    runId: sanitizeDiagnostic(runResult.runId),
    elapsed: `${Math.round((runResult.elapsedMs ?? 0) / 100) / 10} 秒`,
    command: sanitizeDiagnostic(runResult.command),
    difficulties,
    result: sanitizeDiagnostic(runResult.status),
    experience: sanitizeDiagnostic(
      runResult.subjectiveExperience ?? "请由知识库管理者填写",
    ),
  });
}

export function shouldCreateExperienceReport({
  firstCertification = false,
  firstFastPublish = false,
  status,
  elapsedMs = 0,
  budgetMs = Number.POSITIVE_INFINITY,
  explicit = false,
}) {
  return (
    firstCertification ||
    firstFastPublish ||
    status === "FAILED" ||
    elapsedMs > budgetMs ||
    explicit
  );
}

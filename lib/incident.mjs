import path from "node:path";

import { classifyIncident, sanitizeDiagnostic } from "./errors.mjs";
import { atomicWriteJson, atomicWriteText } from "./io.mjs";

export function createIncident({ runId, stage, errorCode, safeResume }) {
  const route = classifyIncident(errorCode);
  return {
    schemaVersion: "oqc.incident.v1",
    runId,
    stage,
    errorCode,
    status: "OPEN",
    ...route,
    safeResume: sanitizeDiagnostic(safeResume),
  };
}

export async function writeIncident({ runtimeDirectory, incident }) {
  const baseName = `incident-${incident.runId}`;
  const jsonPath = path.join(runtimeDirectory, `${baseName}.json`);
  const markdownPath = path.join(runtimeDirectory, `${baseName}.md`);
  await atomicWriteJson(jsonPath, incident);
  await atomicWriteText(
    markdownPath,
    [
      `# OQC Incident ${incident.runId}`,
      "",
      `- 阶段：${incident.stage}`,
      `- 错误代码：${incident.errorCode}`,
      `- 责任人：${incident.owner}`,
      `- 下一动作：${incident.action}`,
      `- 安全恢复：${incident.safeResume}`,
      "",
    ].join("\n"),
  );
  return { jsonPath, markdownPath };
}

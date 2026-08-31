export function createRunResult({ runId, mode }) {
  if (typeof runId !== "string" || !runId.trim())
    throw new TypeError("runId is required");
  if (!["strict", "fast"].includes(mode))
    throw new TypeError("mode must be strict or fast");
  return {
    schemaVersion: "oqc.run-result.v1",
    runId,
    mode,
    technicalStatus: "NOT_RUN",
    privacyStatus: "NOT_RUN",
    releaseApproval: false,
    pushStatus: "NOT_STARTED",
    liveVerification: "NOT_STARTED",
    incidentStatus: "NONE",
  };
}

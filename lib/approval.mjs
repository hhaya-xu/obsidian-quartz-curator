import { canonicalSha256 } from "./hashing.mjs";

function approvalError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function candidatePayload(candidate) {
  return {
    schemaVersion: candidate.schemaVersion,
    runId: candidate.runId,
    items: candidate.items,
    stagedFiles: candidate.stagedFiles,
    remoteBase: candidate.remoteBase,
    verification: candidate.verification,
  };
}

function validateCandidate(candidate) {
  if (canonicalSha256(candidatePayload(candidate)) !== candidate.sha256) {
    throw approvalError("CANDIDATE_MUTATED");
  }
}

export function createCandidate({
  runId,
  items,
  stagedFiles,
  remoteBase,
  verification,
}) {
  if (!Array.isArray(stagedFiles)) throw new Error("stagedFiles is required");
  const payload = {
    schemaVersion: "oqc.candidate.v1",
    runId,
    items: [...items].sort((left, right) =>
      left.sourcePath.localeCompare(right.sourcePath, "en"),
    ),
    stagedFiles: [...stagedFiles].sort((left, right) =>
      left.path.localeCompare(right.path, "en"),
    ),
    remoteBase,
    verification,
  };
  return { ...payload, sha256: canonicalSha256(payload) };
}

export function approveCandidate(
  candidate,
  typedConfirmation,
  { now = new Date().toISOString() } = {},
) {
  validateCandidate(candidate);
  const required = `PUBLISH ${candidate.sha256.slice(0, 12)}`;
  if (typedConfirmation !== required) throw approvalError("APPROVAL_REQUIRED");
  return {
    schemaVersion: "oqc.approval.v1",
    candidateSha256: candidate.sha256,
    approvedAt: now,
  };
}

export function validateApproval(candidate, approval) {
  if (approval?.candidateSha256 !== candidate.sha256)
    throw approvalError("APPROVAL_STALE");
  validateCandidate(candidate);
  return true;
}

const routes = new Map([
  [
    "MISSING_ATTACHMENT",
    { owner: "知识库管理者", action: "修复 Vault 内容后重试" },
  ],
  [
    "PRIVACY_REVIEW_REQUIRED",
    { owner: "知识库管理者", action: "确认公开副本内容" },
  ],
  [
    "PROFILE_POLICY_INVALID",
    { owner: "馆长", action: "修订站点 Profile 或政策" },
  ],
  [
    "CERTIFICATION_DRIFT",
    { owner: "馆长", action: "判断是否发起 oqc certify" },
  ],
  ["PAGES_BASE_PATH_ESCAPE", { owner: "伯喈", action: "修复 OQC 路径合同" }],
  [
    "QUARTZ_COMMAND_FAILED",
    { owner: "伯喈", action: "诊断 OQC 或 Quartz 集成" },
  ],
  ["LIVE_RESOURCE_FAILED", { owner: "伯喈", action: "诊断构建或线上验证" }],
  ["GIT_AUTH_FAILED", { owner: "馆长", action: "修复 GitHub 身份认证" }],
  ["NON_FAST_FORWARD", { owner: "馆长", action: "核对远端新增提交" }],
  ["GIT_SSH_NETWORK_FAILED", { owner: "伯喈", action: "诊断 SSH 网络" }],
]);

export function classifyIncident(errorCode) {
  return (
    routes.get(errorCode) ?? { owner: "伯喈", action: "诊断未分类 OQC 故障" }
  );
}

export function oqcError(code, details = {}) {
  const error = new Error(code);
  error.code = code;
  Object.assign(error, details);
  return error;
}

export function sanitizeDiagnostic(value) {
  return String(value ?? "")
    .replace(/(?<!\d)1[3-9]\d{9}(?!\d)/gu, "[电话号码已隐去]")
    .replace(
      /\b(token|password|secret|authorization)\s*=\s*[^\s]+/giu,
      "$1=[敏感值已隐去]",
    )
    .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/giu, "Bearer [敏感值已隐去]");
}

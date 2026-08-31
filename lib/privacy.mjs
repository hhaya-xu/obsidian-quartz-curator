export function redactPublicCopy(source) {
  let phoneCount = 0;
  let text = source.replace(/\[[^\]\n]*\]\(tel:[^)\n]+\)/giu, () => {
    phoneCount += 1;
    return "[电话号码已隐去]";
  });
  text = text.replace(/(?<!\d)1[3-9]\d{9}(?!\d)/gu, () => {
    phoneCount += 1;
    return "[电话号码已隐去]";
  });

  const ambiguousIdentifiers =
    source.match(/(?<!\d)\d{15,19}[0-9Xx]?(?!\d)/gu) ?? [];
  return {
    text,
    redactions: phoneCount > 0 ? [{ type: "phone", count: phoneCount }] : [],
    findings:
      ambiguousIdentifiers.length > 0
        ? [
            {
              code: "PRIVACY_REVIEW_REQUIRED",
              severity: "P1",
              type: "long-numeric-identifier",
              count: ambiguousIdentifiers.length,
            },
          ]
        : [],
  };
}

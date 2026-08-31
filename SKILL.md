---
name: obsidian-quartz-curator
description: Certify Quartz sites strictly, then publish Obsidian Vault changes through a short site-alias workflow.
---

## Bootstrap and daily boundaries

For a new or unregistered site, the curator uses a private Profile:

```powershell
oqc certify --profile <私有Profile路径>
oqc certify --profile <私有Profile路径> --visual-approval-ref <批准记录>
```

For a legacy site with a valid certification lock but no content baseline:

```powershell
oqc publish --profile <私有Profile路径> --adopt-existing
```

After registration, the manager's daily commands are alias-only:

```powershell
oqc status --site <站点别名>
oqc publish --site <站点别名> --changed --push
```

The private Profile is a curator bootstrap input and is never part of the public package. Stop on any incident and submit an experience report; technical validation is not visual approval, site release approval, or OQC product release approval.

# OQC v1.1

### Approval sequencing

The first certification performs technical verification and waits for visual approval. The second certification only references the existing approval record supplied by 主公. Technical verification, visual approval, site publication approval, and product release approval remain separate; this skill never grants product release approval.

For a registered site, begin with the read-only status command:

```powershell
oqc status --site <站点别名>
```

Continue only when it reports `READY`:

```powershell
oqc publish --site <站点别名> --changed --push
```

Stop on `BASELINE_REQUIRED`, `BLOCKED_CERTIFICATION`, or any incident. Preserve the generated evidence and route it to the curator or OQC developer. Never auto-certify, force push, overwrite a damaged registry, bypass Profile content exclusions, or turn technical validation into visual or release approval.

Use `--manifest`, `--surface-only`, and `--adopt-existing` only for their documented mutually exclusive workflows. Treat the Vault as source authority and the site as a publication replica.

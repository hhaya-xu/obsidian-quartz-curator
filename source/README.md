# OQC v1.2.0 Core

OQC Core is the small, directly usable publish path: private Profile → presentation → Vault content mirror → Quartz build → Git commit and non-force push. Certification, reconciliation, approval, incident, and evidence workflows are intentionally outside this package.

Save a private profile as `profiles/<alias>.json`. Run the daily publish with:

```powershell
node .\source\bin\oqc-core.mjs core publish --site <alias>
```

Use `--profile <file>` for an explicit private profile.

Omitting `presentation` makes no visual changes. `standard-design` is the default skin; `aisz-console` installs the AISZ skin. A profile hero supplies its video and labels for the optional 16:9 HomeHero.

The `v1.1.0` tag remains available as the previous governance-heavy release.

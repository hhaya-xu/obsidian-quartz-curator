# OQC v1.2.1 Core

OQC Core is the small, directly usable publish path: private Profile → presentation → Vault content mirror → Quartz build → Git commit and non-force push. Certification, reconciliation, approval, incident, and evidence workflows are intentionally outside this package.

Save a private profile as `profiles/<alias>.json`. Run the daily publish with:

```powershell
node .\source\bin\oqc-core.mjs core publish --site <alias>
```

Use `--profile <file>` for an explicit private profile.

Omitting `presentation` makes no visual changes. A Profile may select any local visual package with `presentation.packagePath`; legacy `skin` values resolve through the generic package directory. A profile hero supplies its video and labels for the optional 16:9 HomeHero. The package input is `manifest.json` plus `skin.scss`; screenshots and acceptance files are optional.

The core command reads an existing private Profile, installs its presentation package, mirrors content, builds Quartz, and reports the result. It does not create approvals or perform visual review; technical verification, visual approval, site publication approval, and product-release approval remain separate responsibilities.

The `v1.1.0` tag remains available as the previous governance-heavy release.

# OQC v1.2.1 Core

Read an existing private Profile, run the requested publish command, and report the result. Core only describes this direct path: Profile → presentation package → content mirror → Quartz build → Git result. Technical verification, visual approval, site publication approval, and product-release approval are separate concerns and are not created by this package.

```powershell
node .\source\bin\oqc-core.mjs core publish --site <alias>
```

Use `--profile <file>` when an explicit Profile path is provided. Do not create or redesign a Profile during this workflow.

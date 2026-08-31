# Migrating to OQC v1.1

## Entrypoints

The legacy `scripts/render-site-profile.mjs` rendering script is replaced by the CLI commands `oqc certify`, `oqc publish`, and `oqc status`.

## Schema path

The schema moves from the root `site-profile.schema.json` to `schemas/site-profile.schema.json`.

## Profile and roles

Private Profiles are curator bootstrap inputs only. Managers use site aliases after registration and private Profiles are not included in the public package.

## Future mirroring rules

The source tree is authoritative for future mirrors. After separate approval, a mirror may delete the legacy `scripts/render-site-profile.mjs` and the root-level `site-profile.schema.json`, then copy only the reviewed source payload. It must never delete or copy the `.git` directory, and it must not modify v1.0. This task does not synchronize the result or release repository. A future mirror must preserve governance files, public tests, and the source-to-artifact inventory, and must stop on byte drift until Sol review and explicit synchronization authorization.

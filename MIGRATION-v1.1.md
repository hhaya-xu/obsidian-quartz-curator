# Migrating to OQC v1.2.0 Core

Keep private Profiles outside the public package and use `--site <alias>` for daily publishing. A missing `presentation` leaves visual files unchanged; a configured package or hero is applied during the core chain. Existing legacy `skin` values resolve through `source/presentation/packages/<skin>`; new Profiles should use `presentation.packagePath`.

In a future approved mirror, the old `scripts/render-site-profile.mjs` and root-level `site-profile.schema.json` may be deleted as obsolete. This cleanup must never touch `.git`, and no migration step may remove, rewrite, or reinitialize Git metadata.

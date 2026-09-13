# OQC v1.2.1 Core release notes

This patch release replaces skin-specific presentation branches with a generic manifest-driven visual package installer. It rejects incompatible Quartz interfaces before writing, preserves existing page layouts unless a package declares an insertion, and keeps repeated installation byte-stable.

It publishes the smallest complete chain: Profile → presentation → content mirror → Quartz build → Git commit and non-force push. The previous certification, reconciliation, approval, incident, and evidence layers are not included.

Visual package inputs are `manifest.json` and `skin.scss`, plus declared components or assets. The built-in AISZ package also persists the homepage hierarchy fix: the mirrored homepage uses one `H1` (`知识库导览`), while ordinary article and tag pages retain their title and metadata behavior. Preview screenshots and acceptance files remain optional under the W1 policy.

SHELL_WEIGHT: W1-LIGHT

# Changelog

## 0.1.0 — 2026-10-16 (initialization)

Imported source backlog with 231 stable requirements and established 36-phase target roadmap. Added design/art/architecture/test specifications, deterministic primitives, dual-engine isometric observatory, QA scripts and CI/Pages configuration. No gameplay systems or production assets implemented. G0 approval pending.

Verification: 4 unit tests (including interrupted import recovery), 4 Chromium checks, local screenshot review, all project checks and zero npm audit findings. SSH origin access verified; authenticated GitHub API issue import remains pending. Phaser 4.2.1 proposed for G0 approval against a working Phaser 3.90.0 comparison. Deployment status is tracked in STATUS.md.

G0 publication: c2b51cc and predecessors pushed with explicit user approval. Actions run 38968458568 verified and deployed successfully; hosted Chromium checks passed for both engines. DBL-010 completed. API backlog import remains blocked by unavailable GitHub CLI/token authentication. Further phase work awaits approval.

## Unreleased — G1 visual candidate (2026-10-17)

G0 approved; documentation commit 4e63a8e published. Added the original Veiled Cloister environment, eight-direction wanderer, deterministic click/keyboard traversal, foot-depth occlusion, smooth bounded camera and zoom, atmospheric layers, normalized sprite/prop atlases, provenance and reproducible asset tooling, animation atelier, visual/locomotion regressions and sustained workload measurements. Phaser 4.2.1 retained. Full/balanced detail preserves world/input alignment; software or persistently slow graphics selects balanced detail unless manually overridden.

Verified 40 unit tests, 10 Chromium E2E checks, Firefox/WebKit smoke checks, all project checks and byte-identical runtime asset regeneration. Median balanced software-rendered workload is near 60 FPS; p95 frame and full-detail performance budgets remain open. Broader source issue scopes remain partial. New commits are local because publication approval review restricted pushes to named G0 commits; remote CI verification and live backlog import require approval/authentication respectively. Stop at G1 for review.

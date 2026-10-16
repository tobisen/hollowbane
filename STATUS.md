# Status

- G0: approved and complete. Documentation 4e63a8e pushed as explicitly authorized. Phaser 4.2.1 preserved.
- Current scope: Phase 1 – Visual Prototype candidate prepared; **STOPPED at G1 for user visual/playability review**. No later gameplay authorized.
- Completed this phase: DBL-014, DBL-016–017, DBL-020–022, DBL-024–026, DBL-032, DBL-035 and scoped DBL-232–239. Foundation DBL-001–013 remains complete.
- Partial parents: DBL-015/018/019/023/028/029/031/034 retain broader bridge, material/shadow, streaming, export and dynamic-obstacle and later interaction/action scope. Their G1 components are delivered; do not close the full original requirements. Audio 027, stamina 030 and crowd steering 033 deferred.
- Candidate: original Veiled Cloister, eight-direction idle/walk, click/WASD navigation, foot sorting/occlusion, smooth camera/zoom, lighting/shadows/mist, atlas tools and animation atelier. No combat/loot/progression.
- Review: docs/g1-review.md; screenshots: docs/review; prompts/provenance: docs/art/prompts.md; runtime assets: public/assets.
- Checks: npm run check, format:check, 40 unit tests, 10 Chromium E2E tests, Firefox 157/WebKit 27.2 smoke checks and reproducible asset export pass. Screenshots inspected.
- Final 1920×1080 Apple M4 Chromium SwiftShader balanced workload: 60 seconds after 10-second warmup, continuous movement/effects; 59.9 FPS median, 33.4 ms p95, input p95 35.1 ms, 14.3 MB JS heap, 12 submissions, 1.75 s local readiness, zero exceptions. Raw evidence: docs/performance.
- Performance limits: p95 frame budget remains above 20 ms; full-detail Firefox reference ~30.5 FPS / 34.1 ms p95. Automatic balanced fallback and manual detail choice are implemented. No full performance/native-browser certification claimed.
- Remote state: main/Pages remains the G0 foundation plus approved documentation. Documentation run 38969123901 failed its browser step; local harness fix 590711c passed repeated checks but cannot be remotely verified yet. Auto-review rejected publishing new commits because push approval named G0 commits; new Phase 1 commits are local and await push approval.
- GitHub CLI: installed through Homebrew. `gh auth status` reports no logged-in GitHub hosts. No API token available; idempotent importer dry-run/recovery tests pass, but live 239-record import (231 original plus eight G1 slices) remains blocked and was not attempted.
- Head checkpoint: `git log -1`; local history records independently verified increments.
- Next: request G1 review and approval to publish local commits for CI/Pages verification. Do not begin another phase automatically.

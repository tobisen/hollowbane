# Status

- G0: approved and complete. Documentation 4e63a8e pushed as explicitly authorized. Phaser 4.2.1 preserved.
- Current scope: Phase 1 – Visual Prototype and publication approved by user; CI and hosted verification complete. No later gameplay authorized.
- Completed this phase: DBL-014, DBL-016–017, DBL-020–022, DBL-024–026, DBL-032, DBL-035 and scoped DBL-232–239. Foundation DBL-001–013 remains complete.
- Partial parents: DBL-015/018/019/023/028/029/031/034 retain broader bridge, material/shadow, streaming, export and dynamic-obstacle and later interaction/action scope. Their G1 components are delivered; do not close the full original requirements. Audio 027, stamina 030 and crowd steering 033 deferred.
- Candidate: original Veiled Cloister, eight-direction idle/walk, click/WASD navigation, foot sorting/occlusion, smooth camera/zoom, lighting/shadows/mist, atlas tools and animation atelier. No combat/loot/progression.
- Review: docs/g1-review.md; screenshots: docs/review; prompts/provenance: docs/art/prompts.md; runtime assets: public/assets.
- Checks: npm run check, format:check, 41 unit tests, 10 Chromium E2E tests, Firefox 157/WebKit 27.2 smoke checks and reproducible asset export pass. Screenshots inspected.
- Final 1920×1080 Apple M4 Chromium SwiftShader balanced workload: 60 seconds after 10-second warmup, continuous movement/effects; 59.9 FPS median, 33.4 ms p95, input p95 35.1 ms, 14.3 MB JS heap, 12 submissions, 1.75 s local readiness, zero exceptions. Raw evidence: docs/performance.
- Performance limits: p95 frame budget remains above 20 ms; full-detail Firefox reference ~30.5 FPS / 34.1 ms p95. Automatic balanced fallback and manual detail choice are implemented. No full performance/native-browser certification claimed.
- Remote state: all 18 approved commits through 2e3bf19 pushed to main. Run 39006653964 failed two Linux visual checks: platform-dependent gallery line-height and camera stabilization before the occlusion snapshot. Fix 7f06f65 preserves image tolerances. CI run 39006960568 passed verification and deployment; https://tobisen.github.io/hollowbane/ passed all 10 hosted Chromium E2E tests.
- GitHub CLI: installed through Homebrew. `gh auth status` reports no logged-in GitHub hosts. No API token available; idempotent importer dry-run/recovery tests pass, but live 239-record import (231 original plus eight G1 slices) remains blocked and was not attempted.
- Head checkpoint: `git log -1`; local history records independently verified increments.
- Next: G1 approved, published and verified; stop here. No next-phase implementation authorized.

- Final review follow-up: hosted Firefox/WebKit and Chromium movement/atelier rechecked; 41 unit and 10 Chromium regressions pass. Diagnostic percentile sorting reduced to HUD cadence (DBL-020). Fresh isolated balanced Chromium 59.9 FPS / 33.4 ms p95; full Chromium SwiftShader 20 FPS / 66.6 ms; Firefox balanced/full ~30 FPS / 33.7–34 ms. Short-sample caveats, layer-exclusion evidence and inspected new captures are in docs/g1-review.md. No proven GPU cost ranking or p95-budget compliance claimed.
- Publication follow-up checkpoint: optimization/review commit `7317c4c` pushed; verification/deployment run https://github.com/tobisen/hollowbane/actions/runs/39007828439. Final hosted outcome is reported in the session. Firefox visible-canvas pacing investigation is documented in the review. No Phase 2 authorization.

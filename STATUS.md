# Status

- G0 and G1: approved. Phaser 4.2.1 and original visual foundation preserved. Historical evidence: docs/g1-review.md.
- Current scope: Phase 2 Character Movement implementation is complete for user movement-quality review. Stop at this gate. No combat, monster AI, loot or later-phase implementation is authorized.
- Completed scoped issues: DBL-240–244; publication baseline follow-up DBL-252. Original DBL-036 is partial: idle/move foundation only; combat states remain unimplemented. Broader original parents remain partial where their later requirements are unmet.
- Movement: exact click targets, direct/smoothed routes, swept wall/prop collision and clearance, deterministic walk/run acceleration/deceleration, distance-driven eight-direction frames, immediate reversals, stop/facing/queue intents, held steering, persistent remappable inputs/speeds, CSS/camera projection and smooth following.
- Checks: 61 unit tests; 15 Chromium E2E cases; five movement cases each in Chromium/Firefox/WebKit; Firefox/WebKit smoke; check/format/build and asset/backlog validation pass. Screenshots inspected; Phase 2 scene baselines refreshed in DBL-252, original 1% tolerances preserved.
- Balanced matched comparison: median FPS 59.9 → 59.9; frame p95 33.4 → 33.4 ms; event-to-movement input p95 36.6 → 38.8 ms. Software-rendering and full-detail/Firefox limits remain documented.
- Follow-ups: DBL-245–251 separately track seven requested performance/art limitations; run artwork provisionally reuses walk frames. No new assets added.
- Review, detailed logs, measurements and reproduction: docs/movement/phase2.md. Head: `git log -1`.
- Public demo: https://tobisen.github.io/hollowbane/ . Phase 2 publication/hosted verification outcome is recorded in the final session report.
- GitHub CLI remains unauthenticated; local backlog contains 252 stable records. Issue import does not block movement or publication.

- Publication baseline follow-up DBL-252: initial CI run 39010274698 failed two old G1 expectations (10,423/11,357 pixels) and skipped deployment. Reviewed Phase 2 baselines now pass 61 unit tests and 15 local Chromium cases with unchanged 1% tolerance. Subsequent Linux/Pages/hosted outcome is recorded in the final session report.

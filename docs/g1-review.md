# G1 review candidate — The Veiled Cloister

G0 was approved by the user. The currently authorized delivery phase is **Phase 1 – Visual Prototype**, spanning the visual/traversal requirements in source phases 02–04. Stable original DBL IDs and the historical roadmap are preserved. This is an original exploratory environment, not a combat prototype.

Review checkpoint date: 2026-10-17 (Europe/Stockholm).

## Review the candidate

Run `npm ci`, `npm run dev`, then open http://localhost:5173/hollowbane/ . The root route runs Phaser 4.2.1. `?gallery=1` opens the eight-direction animation atelier; `?engine=3` and `?engine=4` retain the G0 observatory. The user approved G1 and publication; the 18 commits through 2e3bf19 are on main. The hosted prototype is verified at https://tobisen.github.io/hollowbane/.

- Click reachable flagstones to walk. A second click immediately replaces the route.
- Click the world or focus it with Tab, then use WASD/arrows. Keyboard input overrides a click route.
- Walk around the sarcophagus and cenotaph; traversal uses independent authored geometry, not image pixels.
- Walk behind and in front of the cenotaph. Foot anchors determine draw order and foreground alpha preserves readability.
- Select Full/Balanced detail to choose sharpness versus software-rendering fill cost. Native GPUs begin at full viewport resolution; detected software graphics use a capped 960×600 buffer with matching aspect ratio. Sustained slow presentation after warmup also selects balanced mode, unless the player explicitly selected Full detail. Camera composition/input coordinates remain consistent when switching.
- Scroll or use +/- to zoom. The camera follows smoothly and the zoom floor covers the world at wider/taller desktop viewports.
- Use Still/Wake the mist for decorative motion; reduced-motion preference starts decoration paused. Locomotion animation remains functional.
- Inspect all eight idle/walk directions in the atelier. No weapon, attack, combat, loot or progression exists.

## Art and pipeline

Original built-in imagegen reference kit: detailed cloister background, eight-direction cloaked wanderer, and four independent props. Prompt set: docs/art/prompts.md. Sources: assets/source. Runtime assets: public/assets. `npm run assets:export` reproducibly generates WebP atlases; `npm run validate:assets` checks source/provenance, dimensions, all 64 character frames, four props, alpha borders, foot pivots and budgets. The original geometric scene remains only in the optional G0 observatory.

## Acceptance limits

The environment is a single illustrated orthographic-style background plate with authored traversal. It does not provide procedural tile geometry, arbitrary bridges/elevation, streamed regions or general building occlusion. Its perspective and baked lighting are visually authored rather than physically reconstructed. Runtime effects add mist, lantern glow, selective actor lighting and contact shadows; production normal maps and physically cast dynamic shadows remain deferred. Only idle and walk animation are provided; generated frame consistency remains an asset-production limitation. AI provenance/rights review remains a release requirement.

Keyboard controls are fixed for this prototype; remapping, audio, stamina/run modes, crowd steering, monsters and later gameplay are deferred. Chromium has the complete regression suite; Firefox 157 and WebKit 27.2 also passed WebGL, movement and zoom smoke tests. Real Safari/other hardware certification is not inferred from WebKit automation. Native/full and software/balanced performance samples are recorded separately.

## Checks and gate

The candidate must pass `npm run check`, `npm run format:check`, full Playwright regression, inspected screenshots and recorded production performance samples before review. The G0 documentation-only push 4e63a8e failed its Linux browser step; its exact original failure could not be read without authenticated log access. The local harness fix selects explicit software WebGL, uses a single worker and emits GitHub annotations; all local regression checks pass. Subsequent publication verification succeeded; see the publication records below.

G1 visual quality/playability and publication were approved by the user. Publication verification is complete; stop here; no later phase implementation is authorized.

Some source issues are broader than this approved prototype. DBL-015 (bridges/general layer rules), DBL-018 (production normals/physical shadows), DBL-019 (general streaming), DBL-023 (normal-map/full action export), and DBL-029 (moving-obstacle replanning) remain partial rather than falsely closed. Their G1 components are implemented and tested. Audio DBL-027, stamina DBL-030, crowd steering DBL-033 and later gameplay are deferred.

## Measured performance and open budgets

On this Apple M4 / macOS arm64 production preview at 1920×1080, the 60-second Chromium SwiftShader balanced sample measured median 59.9 FPS, p95 33.4 ms, input feedback p95 35.1 ms, 14.3 MB reported JS heap, 12 GL submissions and 1.75 s scene readiness. Full-detail Firefox measured median 30.5 FPS, p95 34.1 ms and input feedback p95 33 ms over 60 seconds. Both used ten-second warmups. The final Chromium run includes continuous keyboard traversal; the earlier Firefox full-detail reference used idle/decorative presentation. A short post-optimization Firefox full-detail sample remained near 31 FPS. Raw evidence: docs/performance. The final interactive balanced sample meets the median-FPS and input-response targets, but p95 frame time and full-detail performance remain outside the provisional 20 ms / 60 FPS budgets. Auto fallback responds to persistent slow frames, while Full detail remains an explicit quality/performance choice. This is a G1 visual/playability review candidate, not a certified performance release.

## Review artifacts

- Full detail: [cloister-full-detail.png](review/cloister-full-detail.png).
- Balanced detail: [cloister-balanced-detail.png](review/cloister-balanced-detail.png).
- Eight directions: [wanderer-directions.png](review/wanderer-directions.png).
- Final sustained interactive Chromium evidence: [g1-chromium-balanced.json](performance/g1-chromium-balanced.json).
- Firefox full-detail reference: [g1-firefox-full.json](performance/g1-firefox-full.json).
- Browser compatibility checks: [g1-browser-smoke.json](performance/g1-browser-smoke.json).

Final checks: 40 unit tests and 10 Chromium E2E checks pass, plus Firefox/WebKit smoke checks. Runtime assets regenerate byte-for-byte; source/provenance/alpha/pivot/budget validation, typecheck, lint, format and production build pass. GitHub CLI was installed via Homebrew but has no authenticated hosts; live import remains blocked. G1 and publication were approved by the user. The initial main push failed two Linux visual tests; the narrow cross-platform line-height and explicit camera-settle fixes retain the existing image tolerances. CI and hosted verification passed.

## Granular completion records

Eight scoped issues DBL-232–239 separate delivered G1 sorting/atmosphere/packaging/export/traversal/router/input/cursor increments from broad original parents. Original DBL-015/018/019/023/028/029/031/034 remain partial for their unimplemented later requirements. All 231 source requirements are retained unchanged; the import now contains 239 unique records and still has 36 milestones.

## Approved publication follow-up — 2026-10-17

User approved the G1 visual candidate and publishing its 18 commits. CI run 39006653964 passed static checks and most browser cases, but exposed platform-default caption line-height and a snapshot taken before player/camera settlement. Gallery captions now use explicit 14px line-height. The occlusion test waits for idle locomotion and correct clamped camera position before comparing, with sufficient capture time for software rendering. Image tolerances remain 1%; no product movement or camera behavior is weakened.

Publication evidence: commit `7f06f65`, [successful CI and Pages deployment](https://github.com/tobisen/hollowbane/actions/runs/39006960568). All ten Chromium E2E tests passed against https://tobisen.github.io/hollowbane/ on 2026-10-17, covering runtime requests/errors, visual baselines, eight-direction animation, click/WASD movement, collision, camera/zoom, occlusion, viewport/focus and detail controls. G1 is approved, published and verified. No later phase is authorized or started.

## Final publication audit — 2026-10-17

Remote main was independently confirmed at `f2994d6`; successful CI/Pages run [39007269771](https://github.com/tobisen/hollowbane/actions/runs/39007269771) includes all 18 approved commits and publication fixes. The tree was clean before this audit. Credential-pattern scans across all 20 post-G0 commits found no private keys or recognizable GitHub/AWS credentials; this is a pattern audit, not proof against arbitrary secrets. `gh auth status` remains unauthenticated. Required login: `gh auth login --hostname github.com --git-protocol ssh --web`. Issue import is independent of publication and was not attempted.

Hosted Firefox 157 and WebKit 27.2 passed HTTP/WebGL/movement/zoom/error smoke checks again; see [hosted evidence](performance/g1-hosted-browser-smoke.json). Chromium regression remains 10/10; unit tests now pass 41/41 (including diagnostic-cadence coverage). Phaser stays 4.2.1. No Phase 2 work was started.

Interactive review: [public game](https://tobisen.github.io/hollowbane/?quality=full) demonstrates illumination, contact shadows, mist and occlusion while walking; [animation atelier](https://tobisen.github.io/hollowbane/?gallery=1) has a **Play walk cycle** control for all eight directions. Use Still/Wake the mist to compare decorative motion. The full-detail screenshot above demonstrates warm lantern pools, cool ambient illumination and actor/prop contact shadows. No physical moving cast-shadow system is claimed.

Safe optimization (DBL-020): compute diagnostic p95 once every 30 samples instead of sorting 300 values every frame. The HUD already refreshes every 30 frames. This removes 29 of 30 diagnostic sorts without changing simulation, rendering assets, lighting or input. All static, unit and Chromium regression checks pass after the change. Presentation p95 values near 33.4 ms are consistent with missed 16.7 ms presentation intervals; they do not identify a JavaScript pause or prove a particular GPU bottleneck. Firefox full detail remains constrained; balanced mode and explicit detail choice remain the supported mitigation.

The three principal rendering cost candidates from scene inspection are (1) full-viewport background texture fill/resolution, (2) twelve overlapping translucent mist quads plus additive lantern glow, and (3) the actor's dynamic-lighting pipeline and associated pipeline changes. These are **cost candidates, not a proven GPU-time ranking**: submission count is 12, not twelve equally expensive operations. Controlled layer-exclusion presentation samples are recorded separately; GPU timestamp attribution is still a limitation. The 300-value diagnostic sort was avoidable CPU overhead, not demonstrated to be the main rendering cost.

Remaining provisional/reference assets: one generated background plate, one generated 64-frame wanderer atlas and four generated prop frames (six provenance records in total). Contact-shadow ellipses and procedural glow/mist textures are intentional prototype effects. Production normal maps, physically cast shadows, sprite consistency cleanup, authored geometry beyond this plate and final art/rights review remain outstanding. Existing source prompts and provenance remain in docs/art/prompts.md and the asset manifest.

Fresh profile audit (1920×1080 Apple M4, short 15-second samples after 5-second warmup):

| Browser/profile                     | Median FPS | Frame p95 |
| ----------------------------------- | ---------: | --------: |
| Chromium balanced, isolated browser |       59.9 |   33.4 ms |
| Chromium full, SwiftShader          |       20.0 |   66.6 ms |
| Firefox balanced                    |       30.0 |   33.7 ms |
| Firefox full                        |       30.0 |   34.0 ms |

[Profile evidence](performance/g1-final-profiles.json), [isolated balanced repeat](performance/g1-isolated-balanced.json). The first balanced sample overlapped browser regressions and measured 30 FPS; it is retained honestly rather than presented as an optimization win. The isolated repeat confirms the previous balanced reference. The final Firefox full sample overlapped attribution setup. Short samples and default Firefox backend prevent native-hardware or causal GPU claims. Holding D eventually reaches an obstacle; these short samples are less representative than the original sustained traversal benchmark. No exceptions occurred.

New inspected review captures: [full-detail environment, lighting and shadows](review/g1-final-full-detail.png), [eight directions](review/g1-final-directions.png). The live atelier supplies the interactive animation demonstration instead of a video.

[Layer-exclusion evidence](performance/g1-render-ablation.json): full-scene median 50.0 ms / p95 66.7 ms; excluding mist 33.3 / 50.0 ms; excluding background 33.3 / 50.0 ms; disabling actor lighting 33.4 / 50.0 ms. Each exclusion restores the other layers, using 1-second warmup and 4-second idle presentation samples. These three operations materially affect full-detail presentation, but quantized timings, short samples and non-additive pipeline changes cannot establish their precise order or individual GPU milliseconds. Background and mist tie at this resolution. No visual feature was removed to improve the score.

Firefox pacing investigation: [raw evidence](performance/g1-firefox-pacing.json) compares a blank page (16.66 ms median / 18.26 ms p95), visible game (33.22 / 33.46 ms), and the same running scene with canvas visibility hidden (16.66 / 18.38 ms). Each uses 1-second warmup and 5-second sampling. Visible canvas presentation/compositing is implicated rather than a fixed headless 30 Hz ceiling. Browsers may skip hidden-canvas work, so this does not isolate compositor time from WebGL time or establish a driver bug. Firefox certification remains limited to this automated environment.

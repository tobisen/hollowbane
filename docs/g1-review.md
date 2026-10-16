# G1 review candidate — The Veiled Cloister

G0 was approved by the user. The currently authorized delivery phase is **Phase 1 – Visual Prototype**, spanning the visual/traversal requirements in source phases 02–04. Stable original DBL IDs and the historical roadmap are preserved. This is an original exploratory environment, not a combat prototype.

Review checkpoint date: 2026-10-17 (Europe/Stockholm).

## Review the candidate

Run `npm ci`, `npm run dev`, then open http://localhost:5173/hollowbane/ . The root route runs Phaser 4.2.1. `?gallery=1` opens the eight-direction animation atelier; `?engine=3` and `?engine=4` retain the G0 observatory. The new prototype has not been published: automatic approval review restricted pushes to the explicitly named G0 commits.

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

The environment is a single illustrated orthographic-style background plate with authored traversal. It does not provide procedural tile geometry, arbitrary bridges/elevation, streamed regions or general building occlusion. Its perspective and baked lighting are visually authored rather than physically reconstructed. Runtime effects add mist, lantern glow, selective actor lighting and contact shadows; production normal maps and physically cast dynamic shadows remain deferred. Only idle and walk animation are provided; generated frame consistency still needs human G1 review. AI provenance/rights review remains a release requirement.

Keyboard controls are fixed for this prototype; remapping, audio, stamina/run modes, crowd steering, monsters and later gameplay are deferred. Chromium has the complete regression suite; Firefox 157 and WebKit 27.2 also passed WebGL, movement and zoom smoke tests. Real Safari/other hardware certification is not inferred from WebKit automation. Native/full and software/balanced performance samples are recorded separately.

## Checks and gate

The candidate must pass `npm run check`, `npm run format:check`, full Playwright regression, inspected screenshots and recorded production performance samples before review. The G0 documentation-only push 4e63a8e failed its Linux browser step; its exact original failure could not be read without authenticated log access. The local harness fix selects explicit software WebGL, uses a single worker and emits GitHub annotations; all local regression checks pass. Remote verification of subsequent commits is blocked until push approval.

Stop at G1. User approval of visual quality/playability and publication is required before continuing; no later phase work is authorized by this candidate.

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

Final checks: 40 unit tests and 10 Chromium E2E checks pass, plus Firefox/WebKit smoke checks. Runtime assets regenerate byte-for-byte; source/provenance/alpha/pivot/budget validation, typecheck, lint, format and production build pass. GitHub CLI was installed via Homebrew but has no authenticated hosts; live import remains blocked. This candidate has not been published, and remote CI for the local harness/prototype commits remains unverified because approval review restricted main pushes to the named G0 commits.

## Granular completion records

Eight scoped issues DBL-232–239 separate delivered G1 sorting/atmosphere/packaging/export/traversal/router/input/cursor increments from broad original parents. Original DBL-015/018/019/023/028/029/031/034 remain partial for their unimplemented later requirements. All 231 source requirements are retained unchanged; the import now contains 239 unique records and still has 36 milestones.

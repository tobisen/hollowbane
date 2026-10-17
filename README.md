# Hollowbane

Original browser-first, singleplayer dark fantasy ARPG built with Phaser 4.2.1. The [playable demo](https://tobisen.github.io/hollowbane/) includes the gothic cloister, keyboard/mouse and analog controller movement; `?combat=1` opens the preserved combat test arena. G2.5 controller support is approved. G4 Monster AI is approved; Skills & Spell Systems is delivered for quality review. `?monsters=1` opens the new encounter arena. Completed combat systems are preserved. See [STATUS.md](STATUS.md) for verified scope and limitations.

## Development

Node >=20.19. Run `npm ci`, `npx playwright install chromium`, then `npm run dev`. Open `/hollowbane/` for the Phaser 4.2.1 playable scene; `?gallery=1` reviews the character animations. `?engine=4` and `?engine=3` retain the comparison observatory. Decorative motion honors reduced motion initially. Click reachable ground or focus the game and use WASD/arrows; scroll or use +/- to zoom. Add `&metrics=1` for optional GL instrumentation; read `window.hollowbaneDiagnostics` for timing/heap/draw data. Use `npm run check`, `npm run test:e2e`, `npm run format:check`. `npm run build` outputs `dist/`; `npm run preview` serves the Pages base path locally.

Asset tooling: `npm run assets:export` and `npm run validate:assets`. Production benchmark: `npm run build`, `npm run preview`, then `npm run benchmark` (60-second sample after 10-second warmup; output under ignored `.local/`). Set `BENCHMARK_BROWSER=firefox` for the full-detail Firefox benchmark after installing that runtime. Full/Balanced detail adjusts render cost; detected software graphics starts in balanced mode. Full G1 review checklist and limitations: [docs/g1-review.md](docs/g1-review.md).

## Monster encounters

Open `?monsters=1` (or Controller menu → Monster encounters) for The Cinder Watch. Choose 5/10/20/30 enemies; AI uses shared combat timing/damage and collision/navigation, with patrol, awareness, chase, retreat, pack rallying and return-to-home. Six roles have different speeds, ranges and attack rhythms. Caster/support foundations use existing physical bolts and pack alerts; final monster art, spells and elite affix libraries remain follow-ups.

AI navigation overlay shows state, home, paths and selected/hovered perception. Reset restores the seed; corpses expire after ten simulation seconds. Immortal test player is an explicit diagnostics option. `?monsters=1&count=30` selects a stress workload; `&paused=1` starts paused. Measured limits and hardware-verification status: [Phase 4 evidence](docs/ai/phase4.md).

## Controllers

Connect a standard-compatible Xbox, PlayStation or generic gamepad and press/release a button to activate it. Left stick moves, right stick aims/faces, L3 toggles walk/run, A/Cross chooses/interacts and B/Circle returns. Menu/Options opens Pause; F2 opens the same menu from a keyboard. Every existing screen is navigable using the left stick/D-pad and confirm/back.

Open `?controller=1` or Pause → Gamepad settings for persistent mappings, selected controller, layout overrides, deadzones, sensitivity, response curves and axis selection. Device selection and Input layout are separate choices: an Xbox device name alone does not prove the browser supplied a standard mapping. Readiness explains missing mapping, activation or blocked access; saved explicit selections follow the reported ID across index changes. Diagnostics/calibration shows raw and processed sticks; vibration is optional and capability-checked. Remapping conflicts are rejected. Focus loss, disconnect and menu transitions clear held inputs and require neutral before rearming. Reserved actions do not create unfinished gameplay systems.

Browser emulation is verified separately from hardware: physical-controller and physical-vibration checks have not been performed. Contracts, test evidence and measured performance: [Phase 2.5](docs/gamepad/phase2.5.md).

## Project state

Start at [STATUS.md](STATUS.md). See [ROADMAP.md](ROADMAP.md), [BACKLOG.md](BACKLOG.md), [GAME_DESIGN.md](GAME_DESIGN.md), [ART_BIBLE.md](ART_BIBLE.md), [ARCHITECTURE.md](ARCHITECTURE.md), [ASSET_MANIFEST.md](ASSET_MANIFEST.md), [TEST_STRATEGY.md](TEST_STRATEGY.md) and [PERFORMANCE_BUDGET.md](PERFORMANCE_BUDGET.md). Source backlog retained byte-for-byte under docs/source. No assets copied from reference games.

## GitHub and deployment

Origin: tobisen/hollowbane. Main is the release branch; focused substantial work uses feature/DBL-xxx or fix/DBL-xxx. Verified small foundation checkpoints may use current branch. `npm run github:import` prints a dry-run. Set GITHUB_TOKEN (issues write) and run `npm run github:import -- --apply` to reconcile 36 milestones, labels and 309 issues (231 source requirements plus scoped increments) by stable title IDs. Never commit tokens. Workflow deploys only after checks pass on main or manual dispatch; repository Pages source must be GitHub Actions. Live verification is separately required; a workflow file alone is not proof of deployment.

## Skill laboratory

`?skills=1` opens The Kindled Circle; add `&monsters=1&count=20` for shared monster abilities. Six original prototypes: Ember Lance, Rime Ring, Storm Thread, Iron Fan, Oath Echo and Briar Edge. X/Q/1–4 cast semantic slots; right click casts the selected skill; controller face/shoulder/trigger actions use saved remaps. D-pad left/right selects and interact casts selected. Target lock (T/R3) and independent right-stick aim are preserved. Mana regenerates through Still Well; costs/cooldowns start on acceptance, interruptions do not refund, movement waits for recovery. Full evidence: [Skills delivery](docs/skills/phase.md).

Gameplay and Visual Polish is in progress after approved Skills. `?polish=1` opens The Sable Court; `&training=1` retains training dummies; `&showcase=1` runs an explicit durable-target animation showcase with actual skill execution. No new mechanics. Evidence: docs/polish/milestone.md.

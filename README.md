# Hollowbane

Original browser-first, singleplayer dark fantasy ARPG. Current local build is the G1 visual prototype: a detailed gothic cloister, eight-direction animated wanderer, click/WASD traversal, depth sorting, smooth camera/zoom and atmospheric effects. G0 and G1 are approved. The [published prototype](https://tobisen.github.io/hollowbane/) passed CI and all ten hosted browser tests. No combat or loot.

## Development

Node >=20.19. Run `npm ci`, `npx playwright install chromium`, then `npm run dev`. Open `/hollowbane/` for the Phaser 4.2.1 playable scene; `?gallery=1` reviews the character animations. `?engine=4` and `?engine=3` retain the comparison observatory. Decorative motion honors reduced motion initially. Click reachable ground or focus the game and use WASD/arrows; scroll or use +/- to zoom. Add `&metrics=1` for optional GL instrumentation; read `window.hollowbaneDiagnostics` for timing/heap/draw data. Use `npm run check`, `npm run test:e2e`, `npm run format:check`. `npm run build` outputs `dist/`; `npm run preview` serves the Pages base path locally.

Asset tooling: `npm run assets:export` and `npm run validate:assets`. Production benchmark: `npm run build`, `npm run preview`, then `npm run benchmark` (60-second sample after 10-second warmup; output under ignored `.local/`). Set `BENCHMARK_BROWSER=firefox` for the full-detail Firefox benchmark after installing that runtime. Full/Balanced detail adjusts render cost; detected software graphics starts in balanced mode. Full G1 review checklist and limitations: [docs/g1-review.md](docs/g1-review.md).

## Project state

Start at [STATUS.md](STATUS.md). See [ROADMAP.md](ROADMAP.md), [BACKLOG.md](BACKLOG.md), [GAME_DESIGN.md](GAME_DESIGN.md), [ART_BIBLE.md](ART_BIBLE.md), [ARCHITECTURE.md](ARCHITECTURE.md), [ASSET_MANIFEST.md](ASSET_MANIFEST.md), [TEST_STRATEGY.md](TEST_STRATEGY.md) and [PERFORMANCE_BUDGET.md](PERFORMANCE_BUDGET.md). Source backlog retained byte-for-byte under docs/source. No assets copied from reference games.

## GitHub and deployment

Origin: tobisen/hollowbane. Main is the release branch; focused substantial work uses feature/DBL-xxx or fix/DBL-xxx. Verified small foundation checkpoints may use current branch. `npm run github:import` prints a dry-run. Set GITHUB_TOKEN (issues write) and run `npm run github:import -- --apply` to reconcile 36 milestones, labels and 239 issues (231 source requirements plus eight scoped G1 increments) by stable title IDs. Never commit tokens. Workflow deploys only after checks pass on main or manual dispatch; repository Pages source must be GitHub Actions. Live verification is separately required; a workflow file alone is not proof of deployment.

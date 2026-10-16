# Hollowbane

Original browser-first, singleplayer dark fantasy ARPG. Current build is a technical engine observatory: isometric placeholder courtyard, fifty sentinel sprites and dynamic lighting in WebGL. No playable combat yet.

## Development

Node >=20.19. Run `npm ci`, `npx playwright install chromium`, then `npm run dev`. Open `/hollowbane/`; `?engine=4` selects Phaser 4 and `?engine=3` selects Phaser 3. Pause control honors reduced motion initially. Add `&metrics=1` for optional GL instrumentation; read `window.hollowbaneDiagnostics` for timing/heap/draw data. Use `npm run check`, `npm run test:e2e`, `npm run format:check`. `npm run build` outputs `dist/`; `npm run preview` serves the Pages base path locally.

## Project state

Start at [STATUS.md](STATUS.md). See [ROADMAP.md](ROADMAP.md), [BACKLOG.md](BACKLOG.md), [GAME_DESIGN.md](GAME_DESIGN.md), [ART_BIBLE.md](ART_BIBLE.md), [ARCHITECTURE.md](ARCHITECTURE.md), [ASSET_MANIFEST.md](ASSET_MANIFEST.md), [TEST_STRATEGY.md](TEST_STRATEGY.md) and [PERFORMANCE_BUDGET.md](PERFORMANCE_BUDGET.md). Source backlog retained byte-for-byte under docs/source. No assets copied from reference games.

## GitHub and deployment

Origin: tobisen/hollowbane. Main is the release branch; focused substantial work uses feature/DBL-xxx or fix/DBL-xxx. Verified small foundation checkpoints may use current branch. `npm run github:import` prints a dry-run. Set GITHUB_TOKEN (issues write) and run `npm run github:import -- --apply` to reconcile 36 milestones, labels and 231 issues by stable title IDs. Never commit tokens. Workflow deploys only after checks pass on main or manual dispatch; repository Pages source must be GitHub Actions. Live verification is separately required; a workflow file alone is not proof of deployment.

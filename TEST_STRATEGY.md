# Test strategy

npm run check runs strict typecheck, lint, unit tests, asset/backlog validation and production build. npm run test:e2e builds/serves under the actual /hollowbane/ base path and checks both engines, canvas, errors, pause interaction and screenshot stability. Install Chromium with npx playwright install chromium. CI retains failure reports/screenshots. Baselines must be reviewed before approval; screenshot equality does not establish art quality.

Pure simulation tests cover deterministic RNG/replay and projection inverses. Future feature requirements: combat fixtures and 10k battles, 100k loot distribution rolls, 1k connected procedural seeds, save migration/fuzz tests and input/death/persistence E2E. These future tests are not implemented by the foundation. GPU lighting must be manually reviewed on reference hardware and Safari/Firefox before G0/G1 support claims.

Performance diagnostics expose rolling FPS/p95 frame delta, navigation-to-scene readiness, browser-supported JS heap (null when unavailable), and optional GL drawArrays/drawElements counts via `?metrics=1`. E2E retains JSON metric attachments. These short smoke samples are not a 60-second reference-hardware benchmark or a current 60 FPS certification. Screenshot baselines were captured on macOS Chromium; CI uses the same baseline with a 1% pixel tolerance, and the first Linux run remains unverified.

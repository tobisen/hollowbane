# G0 publication verification — 2026-10-16

User explicitly approved publication of c2b51cc and its predecessors to main. The working tree was clean before push. Tracked files were inspected and scanned for private keys/common credential patterns; no secrets or unintended files were found. Node dependencies, dist, local test outputs and environment files are ignored. Vite base `/hollowbane/` matches `tobisen/hollowbane`.

## Verification evidence

- Foundation commit: c2b51cce16de575806a2088fa9afc0cd69a8d0ee.
- GitHub Actions: https://github.com/tobisen/hollowbane/actions/runs/38968458568 — completed/success.
- Linux verify job 117200673081: npm ci, typecheck/lint/unit/validators/build, format, Playwright and Pages artifact upload passed.
- Pages deploy job 117201042278: completed/success.
- Site: https://tobisen.github.io/hollowbane/ . Hosted Chromium checks returned HTTP 200 for both engine query variants, visible canvas and ready scene, correct metrics/version, reduced-motion pause, resume interaction, zero page exceptions and zero failed/HTTP-error resource requests.
- Hosted screenshot inspected: courtyard, 50 placeholders and dynamic warm/cool lighting render correctly. Original source and Playwright baselines are retained in the repository; temporary hosted captures remain outside Git.

## Short hosted diagnostic samples

| Engine | Renderer | Samples | p95 frame ms | Ready ms | JS heap bytes | GL submissions |
| ------ | -------- | ------: | -----------: | -------: | ------------: | -------------: |
| 4.2.1  | WebGL    |      73 |        16.65 |    679.9 |      12700000 |              3 |
| 3.90.0 | WebGL    |      76 |        16.65 |    296.1 |      10600000 |             51 |

These brief sequential browser samples are smoke evidence, not a controlled engine speed comparison or reference-hardware certification. Cache state differs. Memory is browser-specific, and instrumentation counts drawArrays/drawElements only.

## Backlog authentication blocker

`gh auth status` failed with `zsh: command not found: gh`. No gh executable exists at /opt/homebrew/bin/gh, /usr/local/bin/gh or /usr/bin/gh. No ~/.config/gh/hosts.yml and no GITHUB_TOKEN/GH_TOKEN environment variable were available. SSH publication succeeded but cannot authenticate GitHub Issues API calls. The idempotent import script and all 231 source records are preserved. Dry-run passed; mocked interruption/resume and repeated imports proved no duplicates. No live import was attempted without API credentials.

## Gate state

DBL-010 is complete based on actual hosted verification. G0 technical publication is verified. Stop for user review/approval before further phase implementation. Cross-browser support, long-duration hardware benchmarking and production visual approval remain future validation work.

## Post-approval CI follow-up

The approved documentation push (4e63a8e, run 38969123901) passed static/unit/build checks but failed its browser step. Full logs/artifacts require API authentication unavailable locally. The browser harness now explicitly selects software WebGL, runs one worker to avoid concurrent GPU pressure, and emits GitHub test annotations. Twelve repeated local browser checks passed without changing screenshot tolerances or baselines. A new remote run must verify this harness change; the exact original failure is not claimed diagnosed.

# Hollowbane agent instructions

Read STATUS.md first, then only relevant modules and issue records. Work on one normal issue or at most three tiny related issues at a time. Use a soft ten-minute budget, split oversized tasks, and checkpoint safely. Keep reports under 200 words. No artificial sleeps or background-work claims.

Use strict TypeScript. Keep simulation independent of Phaser, DOM, wall clock and unseeded randomness. Rendering consumes simulation state and input intents. Never copy protected names, content or assets. Inspect before replacing files. Track all placeholders and asset provenance.

Run targeted tests, npm run check and relevant Playwright checks. Review screenshots for visible work. Commit completed, verified increments with DBL IDs; keep STATUS.md accurate. Do not cross G0–G6 approval gates without user approval. G0 approval is pending. GitHub writes/imports/deployment are authorized by initialization; use the idempotent script, inspect its dry-run first, and record external failures honestly. Do not commit secrets or test artifacts.

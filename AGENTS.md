# Hollowbane agent instructions

Read STATUS.md first, then only relevant modules and issue records. Work on one normal issue or at most three tiny related issues at a time. Use a soft ten-minute budget, split oversized tasks, and checkpoint safely. Keep reports under 200 words. No artificial sleeps or background-work claims.

Use strict TypeScript. Keep simulation independent of Phaser, DOM, wall clock and unseeded randomness. Rendering consumes simulation state and input intents. Never copy protected names, content or assets. Inspect before replacing files. Track all placeholders and asset provenance.

Run targeted tests, npm run check and relevant Playwright checks. Review screenshots for visible work. Commit completed, verified increments with DBL IDs; keep STATUS.md accurate. Do not cross G0–G6 approval gates without user approval. G0 is approved. Phase 1 – Visual Prototype is authorized through the G1 visual gate only. Preserve Phaser 4.2.1. Implement visual environment, eight-direction locomotion, projection/depth/camera, asset tools and relevant tests sequentially. No combat, loot or later phase systems. G1 visual candidate was approved by the user; publication and hosted verification are complete. G1 is technically approved. Phase 2 Character Movement is now authorized through its movement quality gate: scoped DBL-240–244, preserving original dependencies. DBL-036 combat scope is not authorized; only its idle/move slice is. Stop at the movement quality gate. No combat, monster AI or loot. GitHub writes/imports/deployment are authorized by initialization; use the idempotent script, inspect its dry-run first, and record external failures honestly. Do not commit secrets or test artifacts.

Phase authorization update (2026-10-17): User approved Phase 2 movement quality and authorized Phase 3 Combat Fundamentals through combat quality review. This supersedes the movement-gate stop and combat prohibition above. Execute scoped DBL-253–258 sequentially, one normal issue per session; preserve original parent dependencies and Phaser 4.2.1. No loot, inventory, advanced monster AI, skill trees or campaign. Stop for combat quality review.

Phase 3 continuation policy (2026-10-17): After each verified issue commit, continue automatically to the next ready scoped issue. Stop only at the combat quality gate, a critical blocker, or an outside-scope decision. Preserve checkpoint evidence for another Codex session.

Phase 3 gate checkpoint (2026-10-17): DBL-253–259 and DBL-261–262 delivered; CI/Pages and hosted combat verified. Stop at combat quality review. DBL-260 art/audio polish and incomplete original parents remain visible; do not continue gameplay work beyond this gate without user approval.

Priority change (2026-10-17): Phase 2.5 Gamepad Support is authorized through G2.5. Preserve completed combat through 4f68d1f; freeze further Phase 3 work. Execute DBL-263–274 (aliases DBL-GP01–12) sequentially and autonomously, committing verified increments. Phase 3 resumption requires DBL-274 and explicit G2.5 user approval. Never claim physical-controller verification from virtual tests.

G2.5 checkpoint (2026-10-17): DBL-263–274 / DBL-GP01–12 technical candidate delivered, CI/Pages and 22 hosted controller/movement checks pass. Stop for user G2.5 review. User approval remains false; Phase 3 stays frozen. Physical-controller/vibration checks have not been performed. See docs/gamepad/phase2.5.md and gates.json.

Phase 4 authorization: user approved G2.5 and authorized Monster AI through its quality gate. This supersedes the G2.5 stop for scoped DBL-275–281 only; preserve completed combat/controllers. Follow dependency-aware scoped slices of original DBL-058–065, leaving broader parents partial. Hardware follow-ups DBL-282–286 require physical evidence. Continue sequentially; stop at Phase 4 Monster AI review. No loot/inventory/skill trees/campaign.

Phase 4 gate checkpoint: DBL-275–281 and DBL-287–288 technically delivered. Runtime ab46984 passed CI/Pages and 29 hosted scenarios. Stop at Monster AI quality review; quality approval remains false. Physical DBL-282–286, reference-hardware performance and broader original parents remain open. Do not begin loot/inventory/skill trees/campaign or new phase work without user approval. Evidence: docs/ai/phase4.md.

User quality feedback authorizes DBL-289 controller gameplay-focus repair within the delivered candidate. Preserve gate stop for new phase work; record browser versus physical evidence separately.

Controller follow-up DBL-290 addresses reported unknown-layout/index readiness with verified generic recovery only. Native friend device metadata is pending; do not infer a raw Xbox/handheld layout from its name or claim physical verification. Keep Monster AI review gate pending.

G4 approval / Skills authorization (2026-10-17): user approves Monster AI and authorizes Skills & Spell Systems (original target topic 10), scoped DBL-291–298 sequentially through the skills quality gate. This supersedes the Monster AI stop. Preserve completed systems and all open hardware/art/performance/synchronization follow-ups. No loot, inventory, itemization, character skill trees or campaign.

Skills quality checkpoint (2026-10-17): DBL-291 through 298 technically delivered. Runtime 5e09b03 passed CI/Pages 39035255672, 161 unit/59 Chromium, 14 Firefox-WebKit skill cases and 33 hosted controller/skill cases. Stop at Skills & Spell Systems review; user approval remains false. DBL-299 software HUD performance, physical DBL-282 through 286 and broader partial parents remain open. No next-phase systems without approval. Evidence: docs/skills/phase.md and performance.json.

# Status

## C4–C6 skill progression/combat complete (2026-10-18)

- Authorized C4–C6 delivered under scoped DBL-103/111/110/210; original broader parents/dependencies remain partial. One skill point per gained level, separate immutable budget/high-water ledger; atomic validated rank increments and stale-state rejection. No respec/UI.
- Existing cast intents enforce class unlocks and configurable ranked damage/poison/power; timing/cooldowns/input rules unchanged. Committed casts/projectiles snapshot rank effects. Unclassed compatibility retains all six existing skills and passive.
- Schema4 strictly persists ranks/budgets/class/tree versions; explicit1/2/3 migration preserves prior progression/items and awards unspent level−1 skills without assigning a class. Runtime save/restore/encounter resets retain the ledger.
- 56 focused tests, TypeScript, focused lint/format pass. No E2E/full regression/loot simulations. See docs/character-classes.md. STOP after C6; await new scope, no skill-tree UI. Preserve pre-existing local L3/backlog edits and hardware/art/performance follow-ups.

## C1–C3 class/skill-tree foundations complete (2026-10-18)

- User approves P1–P11 (1ce9e92); C1–C3 bounded scope delivered under DBL-113/111/115. Broader original parents/dependencies remain partial and unchanged.
- Warrior/Sorcerer/Ranger configurable class data; shared XP/attribute/equipment engines; versioned nine-branch tree data, ranked prerequisites and unavailable planned ability extension points. Existing six active skills and saves unchanged.
- Eight focused unit tests, TypeScript, focused lint/format pass. No browser changes/E2E, full regression or loot simulation. Evidence and provisional-data limitations: docs/character-classes.md.
- STOP after C3. Next: await user-defined continuation scope before runtime class selection, skill point allocation or rendering. Preserve pre-existing local L3/backlog edits and hardware/art/performance follow-ups.

## P11 release verified — DBL-109 complete (2026-10-18)

- Verified runtime51a943ac96f845a9f749262436c146ea9244511f: CI39159873168 success;105 Chromium and15 advanced cross-browser cases pass, including unchanged Linux visual comparisons. Existing320 unit evidence reused locally; CI check/format passed.
- Pages deployment7159839021 success, exact same SHA; public index-BJpbzwJa.js matches the local production build. Seven hosted panel/allocation/save/reload/migration/virtual-controller cases pass; hosted screenshot reviewed.
- DBL-109 / P11 technically complete. STOP at Character Progression quality review; user approval remains false. No Character Classes/Skill Trees or further gameplay. Physical controllers/reference hardware and broader partial parents remain open. Detailed release/provenance evidence: docs/progression.md.
- Commits994eac1, a7f1868 and51a943a pushed. Pre-existing L3 documentation/backlog edits remain separate and uncommitted; do not discard them.

## P11 Linux visual follow-up (2026-10-18)

- Successor39158266321 /a7f1868:103 Chromium passed, only2 Linux inventory references failed; advanced cross-browser step/deploy skipped. Controller fixes confirmed by CI.
- Retrieved current public test-evidence through nightly.link, resolving direct API401. Reviewed both Linux actual/diff images: intended Character summary/layout and progression footer changes, no unexplained geometry/control regression. Updated only matching1920/1024 Linux baselines; assertions/tolerance unchanged. Provenance/hashes: docs/progression.md.
- Next: regular successor Linux comparisons, advanced browser step, CI/Pages SHA, then hosted critical character/allocation/save/reload flows. DBL-109 remains partial and user quality approval false. No classes/skill trees. Existing320 unit evidence reused; no new simulation/benchmark.

## P11 release verification checkpoint (2026-10-18)

- CI39156818075 /466bf7c FAILED: check/format passed; Chromium95 passed/10 failed; deploy skipped. Eight failures were controller-route/laboratory-text regressions; two Linux inventory comparisons remain unreviewed. DBL-109 stays partial; quality approval false.
- Restored right from Close to Equipment, retaining down to Character; updated laboratory assertion to starts-at40. Verified15 affected/critical Chromium cases, including allocation/save/reload/migration and virtual controllers;2 Darwin visual comparisons pass without updates. Reviewed both references and character screenshot. TypeScript, focused ESLint/format and production build pass; reused320 unit passes, no unit/benchmark rerun.
- Reviewed local994eac1 as appropriate for publication. Linux artifacts12147467280 require authenticated download (401); failed-job log403; gh has no authentication. Public annotations identify exact failures. No Linux references changed or tolerances relaxed. Hosted index remains index-DnCJfCbe.js; progression hosted verification is blocked by skipped deployment.
- Resume: obtain/review Linux actual/diff images from test-evidence; resolve only justified reference changes, verify regular comparisons and advanced checks, then confirm successor CI/Pages and hosted character/allocation/save flows. Stop at progression review; no classes/skill trees. Detailed evidence: docs/progression.md. Pre-existing L3 edits preserved separately.

## Latest progression checkpoint — P11 publication/visual checkpoint (2026-10-18)

- Soft-budget checkpoint: P10 delivered/pushedfcd3af1; P11 local check/build320 units and7 focused browser flows pass; runtime466bf7c pushed to main. Character Progression quality gate remains INCOMPLETE/user approval false. No new gameplay work.
- CI39156818075 for466bf7c was in progress, last step browser dependency installation. Inspect its final jobs/artifacts before proceeding: https://github.com/tobisen/hollowbane/actions/runs/39156818075 . Prior L3 CI39117110123 independently confirmed success, not progression evidence.
- Directly affected inventory visuals failed against old references. Reviewed both Darwin actuals (1920/1024), replaced baselines and verified2/2 without update mode. This reference/checkpoint follow-up commit remains local to avoid canceling the currently collecting CI run. Inspect git log/status for the exact local head; do not discard it. Pre-existing L3 docs/backlog edits remain separately unstaged.
- NEXT: resolve actual CI failures; capture/review Linux inventory and advanced-item references affected by panel/footer; retain all assertions/tolerances. Do not substitute Darwin baselines or call exclusions passes. Check critical normal-character gear/loot flows at new level1. Then push verified follow-up, confirm full CI/Pages, and run hosted character-controller plus allocation/save/migration checks. No large loot simulations needed.
- Public index still index-DnCJfCbe.js; progression build index-CVMXKv8V.js/combat-arena-BRv-XqEg.js. Hosted progression/save NOT verified. Schema1/2→3 compatibility locally covered; physical controllers and reference GPU unverified. See docs/progression.md. Stop at progression review; no classes/skill trees/vendors.

## Latest progression checkpoint — P11 technical candidate (2026-10-18)

- P10 committedfcd3af1. P11 technical candidate verified: npm run check320 unit tests/80 files, TypeScript/lint/assets/backlog/build; formatting passes.4 Chromium panel/allocation/persistence/migration cases and3 virtual controller cases pass. Actual timed monster kill→XP→points→equipment→save and all99 level budgets covered.
- Stop at Character Progression quality review; user quality approval remains false. No classes/skill trees/vendors. Balance is provisional (quadratic costs, fixed monster base XP, no level scaling/champion premium); see docs/progression.md. Physical controllers/reference hardware unverified. Schema1/2→3 item ownership/migration remains covered.
- Publication authorized. Remote main verified2c8218d; local P1–P11 commits need push to existing verify-deploy workflow. Required CI full browser regression/Pages and hosted character/save checks are NOT yet verified. Local combat-arena asset is combat-arena-BRv-XqEg.js. Record exact CI/run/runtime evidence after publication.
- Prior uncommitted L3 documentation/backlog changes remain separate. Original broad source issue parents remain partial. If session limit interrupts publication, resume external verification only; no further gameplay work.

## Latest progression checkpoint — P10 (2026-10-18)

- Current user authorizes P10 then P11 and existing CI/Pages publication through Character Progression quality review. This supersedes the prior P9 stop only for this scope; no classes/skill trees/vendors.
- P10 controller implementation verified:3 Chromium scenarios for virtual Xbox/PlayStation/remapped generic, held allocation and disconnect/mouse/reconnect/cancel;19 focused units, TypeScript and relevant lint pass. Screenshot reviewed. Physical hardware remains unverified.
- P11 quality work now has2 passing focused tests for actual timed monster kill→XP→points→equipment→save, deduplicated XP/loot and all99 level budgets. These tests are not yet part of a verified P11 commit.
- Next: run required final check/build once, critical character persistence/browser checks, commit P11 evidence, push existing main CI/Pages workflow and verify hosted panel/save. Record inaccessible/pending external results honestly. Pre-existing L3 documentation edits remain separate.

## Latest progression checkpoint — P9 complete (2026-10-18)

- P7–P9 technically delivered. P7 commit8e72707, P8 commit14a22b6; this P9 increment completes current authorization. STOP: do not begin P10/P11 or later work without a new request. Broad DBL-108/104/210 parents remain partial beyond these scoped slices.
- Schema3 persists strict versioned progression; schema1/2 migrations preserve all item/embedded ownership and loot state, map legacy level to threshold XP/unspent budget. New normal characters start1; separate item laboratory starts40. Single progression authority supplies UI, requirements and saves. See docs/progression.md.
- P9:24 focused save/runtime cases pass; full unit run316/318 initially (2 hardcoded schema2 assertions), both updated and verified in targeted rerun. TypeScript/relevant lint/backlog checks pass. Four Chromium scenarios pass across corrected runs; reviewed panel screenshot at P7/P8. No final P11 quality gate claim or physical-controller verification.
- Browser evidence includes earned-point allocation, duplicate-click rejection, corrupt-import atomicity, save/reload and legacy IndexedDB upgrade retaining schema1 previous checkpoint. Unit evidence covers levels1–99 and schema2 mixed-content sockets/runes. Existing CAS/backup/quarantine policy unchanged.
- No publication/deployment performed. P10 controller-specific focus/prompts and P11 balancing/quality review remain pending. Pre-existing local L3 docs/backlog edits are preserved separately; final L3 playable review still pending.

## Latest progression checkpoint — P8 (2026-10-18)

- P7 committed8e72707; P8 allocation verified:12 focused unit/runtime tests,2 Chromium panel/keyboard/disabled-controls scenarios; TypeScript/lint pass and screenshot reviewed.
- P9 remains: strict versioned progression snapshot, legacy level-to-XP migration preserving gear and ownership, single runtime progression authority, atomic load/save and funded allocation/reload browser evidence. Current data is still session-only.
- Authorization is now only P7–P9. Stop after P9 or checkpoint at soft session limit. P10/P11 are not authorized in this continuation. Pre-existing L3 edits remain untouched.

## Latest progression checkpoint — P7 (2026-10-18)

- P7 delivered; P6 preserved. P8 allocation and P9 persistence remain next under current authorization. Stop after P9; P10/P11 are outside this session.
- Shared panel has no duplicate stat formulas;1 new view-state +3 runtime tests and1 Chromium browser scenario pass, screenshot reviewed.
- Current XP is still session-only and inventory requirement level remains legacy12/laboratory40 until P9 migration. Preserve existing item/save data and all pre-existing local L3 edits.
- Next: P8 allocate through immutable domain logic with ready-state protection and requirement validation; P9 schema3 snapshot plus explicit schema1/2 migration, progression authority binding and atomic restore. Original broad issue parents remain partial.

## Active progression batch — P6–P11 (2026-10-18)

- User authorizes autonomous sequential P6–P11 through progression quality review, superseding prior P5 stop. Preserve all prior mechanics/items/saves and pre-existing local L3 documentation. No classes/skill trees/vendors/campaign.
- P6 / DBL-106 requirement domain delivered and verified: configurable minima for level/Strength/Dexterity, equip/swap/world checks, immutable atomic invalidation reconciliation with full-bag rejection. Legacy content stat minima remain0; future requirement tuning uses base rules without rewriting items. Runtime uses innate/allocated attributes; no gear self-support cycles.
- Six new tests;19 targeted equipment/world/save/runtime tests, TypeScript and relevant lint pass. No visual change in P6.
- Next P7–P8 / DBL-108/104: accessible gothic character panel and transactional allocation using existing modal/controller input; P9 / DBL-210: versioned progression snapshot/legacy migration with full item preservation; P10 / DBL-004: controller focus/prompts; P11 / DBL-109: one final broad regression and quality evidence. These are not yet delivered. Existing broad parents remain partial.
- P9 must bind the single progression authority to inventory session snapshots and synchronize effective requirement level. Current saves remain unchanged/session XP is not persisted. Legacy inventory starts at12 (separate item laboratory40); migration must preserve equipped identities and explicitly document initial XP/attribute budget mapping. Current HP/mana policy: retain absolute amounts/clamp, no refill or resurrection.

## Current session — DBL-103/104/105 / P3–P5 (2026-10-18)

- Completed the explicitly authorized cohesive P3–P5 increment. Five attribute points per gained level, high-water reward ledger, immutable attribute allocation and shared combat/equipment derivation. No P6 authorization; stop after this commit.
- Configurable defaults: starting Strength/Dexterity/Vitality/Energy all0 to preserve baseline; flat coefficients per point Strength→physical damage0.5, Dexterity→accuracy2/defense1, Vitality→max HP5, Energy→max mana3. Bonuses precede advanced gear multipliers; Strength is a physical-only modifier, excluding proc damage. Default coefficients/starts live in src/simulation/attributes.ts; EquipmentBase accepts overrides.
- Resource policy remains absolute amounts clamped to new maxima, never proportional refill or resurrection. Inventory stat refresh/comparisons share the same attribute-aware base; no character UI or new browser interaction.
- Eight new tests;29 focused progression/XP/equipment/hit-rule/runtime tests, TypeScript and relevant lint pass. No browser suite: simulation changes and runtime wiring are unit-tested; no UI/browser API changes.
- Progression is session-only as in P2. Future saves must persist total XP/versioned curve, starting/allocated attributes, available/spent budget and rewarded-level high-water mark with validation; skill points remain separate and unimplemented. Original parent IDs/dependencies and pre-existing L3 edits preserved; final playable-demo review remains pending.

## Current session — DBL-103 / P2 (2026-10-18)

- P2 monster XP rewards completed: configurable base rewards for six authored roles (champions share base), exactly once per encounter monster identity, eligible player kills only. Immediate death-event consumption survives bounded log eviction; environmental/non-player/training deaths cannot later gain credit by replay.
- Five new focused tests;16 targeted XP/combat-hit-trace/encounter tests, TypeScript and targeted lint pass. Session-only XP uses P1 progression/level99 cap; no save migration, loot, UI or combat-rule changes.
- P2 explicitly authorized after P1; stop now, no P3. DBL-103 remains partial; preserve prior local L3 documentation edits and pending playable-demo review.

## Current session — DBL-103 / P1 (2026-10-18)

- P1 character level/XP foundation completed and verified; stop after this task. No P2 authorization or runtime/save changes.
- Five focused XP unit tests, TypeScript and targeted lint pass. Default provisional curve costs100 × L² per advancement; configurable cumulative thresholds cap at99. Persist total XP with a versioned curve in future; no migration now.
- User reports L3 CI/deployment successful after2c8218d; final playable-demo review remains pending. No known local blocking implementation defect. Independent CI recheck unavailable (gh unauthenticated; public API DNS unavailable). Earlier L3 checkpoint below is historical and does not override this report.
- Pre-existing documentation/backlog edits retained separately. DBL-103 remains partial; no new issue IDs or dependencies changed.

- **L2 approved; L3 Advanced Itemization active.** DBL-320–332 complete. DBL-334–350 authorized sequentially through five increments/L3 review. No vendors, crafting, character progression or campaign.
- Playable demo: https://tobisen.github.io/hollowbane/?inventory=1 · V / View/Create opens inventory. Phaser4.2.1, all prior gameplay, original36 topics/231 requirements and unchanged L1 content2 preserved; versioned L2 content3 adds equipment bases.
- Verified application9288dd1; CI/Pages39071489421 success; hosted `index-puSphf0k.js` matches tested local build. Full check213, complete Chromium85, complete Firefox/WebKit134 and hosted inventory29 pass (4 intended non-Chromium visual skips). Evidence/screenshots: docs/inventory/l2.md.
- Deterministic grid/gear/world transactions, single stat pipeline, mouse/semantic-controller lifecycle, IndexedDB atomic checkpoints, validation and explicit corruption recovery delivered. No prototype archive migration claimed; storage errors retain session items and expose export/retry.
- Repeated SwiftShader combat RAF p9516.7–16.8ms at5/10/20/30 enemies after inline navigation fix; open modal33.4ms retained as DBL-333 follow-up. Native GPU/physical latency unverified.
- DBL-282–286 physical-controller tasks, friend native-layout metadata, provisional art/audio, native/full-detail/software/Firefox performance and GitHub issue synchronization remain open. Import dry-run333 records/36 milestones; no token-based synchronization claimed. Original parents036/074/079/080/081/082/083/084 remain partial.

L3 issue334 complete: typed deterministic modifier/event foundation,5 targeted tests/full check218. 335 complete:12 unique definitions/3 complete sets,5 new tests/full check223.351 complete: isolated version4 registry and legacy replay,2 new tests/full check225.336 complete: version4 unique/set generation and equipment-only activation,4 new tests/full check229; existing browser inventory scenario passes.352 complete: generic derived unique/set stats and comparisons,3 new tests/full check232, actual committed strike damage verified.353 complete: explicit schema2 content4 save support and validated1→2 migration; legacy-only saves preserve schema1. Full check233 and inventory Chromium/Firefox/WebKit29 pass/4 intentional visual skips, virtual Xbox/PlayStation included.337 complete: playable unique/set inspection at ?inventory=1&advanced=1, full check235, inventory38 pass/4 tracked old visual exclusions; three new Darwin browser visual references reviewed. Linux advanced visual exception tracked348.338 complete: socket limits and12 typed original gems,3 targeted tests/full check238.339 complete: isolated content5, atomic insertion/extraction, bounded ownership trees and compatible schema2 manifests;5 targeted/full check243 and12 cross-browser persistence scenarios pass.340 complete:12 original weighted sigils/8 ordered combination definitions,2 targeted/full check245.341 complete: isolated content6 and exact ordered combinations via shared modifiers;4 targeted/full check249,9 cross-browser advanced/controller scenarios pass.342 complete: frozen content7 expanded affix generation,4 targeted/full check253 and3 cross-browser set/save scenarios.354 complete: typed bounded hit resolution/context,3 targeted/full check256 and8 combat/skill browser scenarios.355 complete: scene weapon/speed repair and real casting/recovery bridge;2 targeted/full check258 and inventory41 pass/4 tracked visual exceptions.356 complete: actual contextual hit/skill/DoT arithmetic from shared baselines,6 targeted/full check264 and12 advanced/controller/bow browser cases pass.343 complete: real generic proc/leech/status execution,8 targeted/full check272 and15 advanced/controller/bow/gem browser scenarios.344 complete: bounded corruption validation, all save prefixes2–8, final registry8 legacy-table compatibility and safe old-route fallback;5 targeted/full check277,15 persistence browser cases +3 table/diagnostic cases.357 complete: readable component/pattern inspection, full modifier differences and original provisional glyphs;3 new/full check280,6 browser cases/6 reviewed Darwin references matched.358 complete: explicit atomic socket UI, contextual controller read/navigation and error handling; full check280, inventory62 pass/4 tracked visual exceptions and9 Darwin references matched.359 complete: actual non-damaging buff ranks,2 new/full check282 and2 Firefox/WebKit skill regressions.345 complete: final content8, isolated requirement laboratory, all components/host replays and controller-readable recipes;2 new/full check284, inventory68 pass/4 tracked exclusions plus6 strengthened isolation cases.346 complete: real set/pattern lifecycle tests, full check286, complete Chromium98 and Firefox/WebKit160 pass.347 complete:2.4m rolls/1099029 replay-validated items, zero invalid/distribution failures;2 extreme-cap tests/full check288.348 performance/Linux visuals next, then349–350. Detailed docs/items/l3.md.

L3 checkpoint source through336 pushed520b7fd; public CI39105753079 was in progress when inspected.352/353 verified locally; CI/hosted completion for these increments is not claimed here. Hardware/GPU and GitHub Issues sync remain unverified/open.

# Status

## D01 / DBL-386 continuation (2026-10-20)

- Existing implementation recovered into synchronized normal main; expedition start, ordered travel, crypt attunement, once-only completion and nested exploration4 migration reviewed. Strict stage validation now rejects non-string data. Standard check394 tests passes;17 focused cases and final three-case validator rerun pass. TypeScript/lint/build and scoped format pass.
- Real-input browser acceptance passes (2.4min): deliberate mouse start, ordered outbound/controller travel, keyboard crypt attunement, return to camp, atomic checkpoint/reload, unchanged character/loot and repeated exit protection. Crypt and completed-camp screenshots reviewed. Pointer-driver failure retained in D01 evidence; established controller driver passes both legs. Ready for scoped D01 commit/push; exact-SHA CI/Pages and hosted acceptance remain pending. No D02 until release gates pass.

## VS Code workflow reconciliation (2026-10-20)

- Normal main fast-forwarded from35ab99b to origin/main312182a; overnight/development shares that base. D00 exact workflow39343312275 verify and Pages deploy independently confirmed successful. Original local documentation retained, with backup patch in /private/tmp/hollowbane-workspace-reconcile and retained Git stash. STATUS top-section overlap resolved by preserving both histories.
- No active overnight runner found by process inspection. Overnight worktrees/tooling retained. Existing unfinished D01 files copied unchanged into normal workspace for review and continuation; original worktree preserved. D01 is not verified or published. Continue approved D01/DBL-386 specification in tools/overnight/tasks.json; use normal main commit/push and exact CI/Pages gates, superseding runner-only publication wording.

## D00 / DBL-385 exact-CI retry (2026-10-20)

- Exact candidate0f86c38 workflow39341023318 failed:123 browser cases pass; live-kill assertion inspected actors before asynchronous IndexedDB restoration. Pages did not deploy it. Captured log/source diagnosis recorded in docs/overnight/d00.md.
- Scoped test waits for initial storage/controller readiness and restored-checkpoint status before strict actor/reward ownership checks. No runtime/save/gameplay changes. Fourteen focused units, TypeScript/lint/format and production build pass. Five unaffected W4 browser cases pass; corrected live-kill passes3/3 repetitions. Reload screenshot reviewed.
- Follow-up release remains pending runner-owned exact SHA CI/Pages, artifact identity and hosted six-case verification. No push, D01 or gate approval. Original parent/hardware limits retained.

## D00 / DBL-385 W4 verification candidate (2026-10-20)

- Verification only; runtime/save formats, assets, dependencies and gate approvals unchanged. Added graveyard discovery unit coverage, real-input seed42 discovery/reload in all three generated environments, persisted container ownership/repeat-open checks and a natural monster kill→XP/loot→atomic save/reload check.
- Fourteen focused units, TypeScript/lint/format and Playwright production build pass. Shipped baseline6d26ad3 exact CI/Pages39331041663 successful;26 hosted files match the local build. Hosted six-case W4 verification and reviewed screenshots documented in docs/overnight/d00.md.
- Scoped verification commit publication remains runner-owned and pending: exact new SHA CI/Pages, hosted bytes/tests and machine checkpoint must pass before advancement. No push, D01 or user gate approval in this session. Physical-controller/native-GPU limits retained.

## DBL-010 actual implementation permissions (2026-10-19)

- Supported explicit approval path verified from overnight/development: automatic-review workspace-write Codex executed approved Git index refresh, exact CI read, authenticated remote read and an actual harmless push to overnight/permission-probe-33a3fc5. Ordinary sandbox Git metadata remains protected. No unrestricted mode, rules changes, D00 or tracked gameplay edits. Astra6 Max probe passes.
- Sixteen offline tests and complete15-task dry-run pass; actual implementation build and hosted minimap/movement/save smoke pass, all26 hosted files match. Added tooling-only verify-activation action: D00 start is blocked until exact activation release gates pass and verified SHA is recorded. Existing CI now also runs Python tests/queue dry-run.
- Prior preflight35ab99b now has successful exact CI/Pages39326566635 and deployment7185581214; actual-worktree hosted bytes/smoke verified. This tooling-only integration/publication remains pending at commit time. Final live result/verified SHA will be persisted in .local/overnight/permissions.json and events.jsonl without triggering a self-referential evidence commit. Original main checkout dirty documents retained byte-for-byte.

## DBL-010 D00–D14 activation specification checkpoint (2026-10-19)

- Supplied user specifications now define all15 D00–D14 tasks in tools/overnight/tasks.json; runner loads the versioned queue. Dry-run: D00 eligible, D01–D14 pending predecessor release evidence. Existing DBL numbering/parent edges preserved through explicit narrow slices. No gameplay/D00 executed.
- Fifteen offline tests pass; task prerequisites, exact release gates, isolated branch guards, history/deadline preservation, cancellation/lock/resume and evidence-based model selection verified. Sol6.1 High escalates only after two distinct complex failures to Astra6 Max, returning to Sol after resolution. Static/build verification and real implementation-worktree permission/publication checks are recorded separately below/in activation-evidence.json.
- Original checkout edits remain untouched. Activation branch cannot publish itself through the runner; integration into origin/main and actual implementation-worktree Git/network/Codex permissions are required before READY.

## DBL-010 overnight activation checkpoint (2026-10-19)

- Setup only; no gameplay/unattended execution. Isolated overnight/activation worktree preserves original modified BACKLOG.md, STATUS.md and docs/items/l3.md. D00–D14 authorized, but exact approved specifications unavailable: 15 blocked slots, zero executable deliverables. Dry-run stops safely at D00.
- Twelve offline tests, TypeScript/lint/format/build pass. Evidence-based bounded retries retain cumulative history/deadline; exact-SHA CI, Pages, artifact and smoke failures block release. Added shared repository lock and terminal-independent launch commands. Sol6.1 High/Astra6 Max catalog and prior live probes verified.
- Confirmed Pages4fd6646 deployment7184782837 success; 26 hosted files match and hosted minimap/movement/save smoke passes. Six35ab99b source blobs verified; its CI39326566635 still running. Activation publication and unattended worktree permissions remain unverified. NOT READY. Evidence: tools/overnight/activation-evidence.json.

## W4 / DBL-385 persistent automap checkpoint (2026-10-19)

- DBL-384 runtime dce178e CI/Pages workflow39317420535 completed success (checked once). DBL-385 adds bounded radial terrain-cell reveal and a cached isometric minimap: unexplored cells remain dark; player, discovered spawn/exits and treasure are marked. Tab or controller Map toggles without modal/combat capture; existing M menu/V inventory and non-world routes retain their behavior.
- Exploration state3 explicitly migrates state1/2 with empty discovery per area. Each discovery record binds to the saved area seed/content/layout fingerprint; unknown versions, stale fingerprints, duplicate/out-of-range cells reject safely. Existing character/items/gold/deaths, map fingerprints and generators remain unchanged. Reveal updates only on cell changes; terrain redraw only on layout/discovery/container changes; stop/manual/transition checkpoints reuse atomic persistence.
- Ten focused discovery/container/save cases pass, including wilderness/crypt, repeat reveal, seed/layout isolation and legacy migration. One critical Chromium map-toggle/movement/save-reload case passes6.6s; screenshot test-results/w4-minimap.png reviewed. TypeScript/relevant lint/format/build pass. Reused prior integration evidence; no long route, full regression, loot simulations or GPU claim.
- DBL-385 is the last W4 backlog issue; dependency-ready386 belongs to W5 and is not started. Stop at session budget/W4 review checkpoint: technical380–385 delivered, but new CI/deployment and hosted W4 gameplay gate evidence remain pending. Do not mark W4 quality approved or start W5. Preserve unrelated local edits.

## W4 / DBL-384 container interaction checkpoint (2026-10-19)

- DBL-383 committed f802e61. DBL-384 renders original code-drawn chest/crate/barrel wood/iron props with world depth/occlusion, rare trim, opened lids and nearby highlight. Pointer click or nearby button, keyboard E and existing controller Interact share the validated transaction; dead/paused/modal input is blocked. Existing automatic safe exit travel remains unchanged. Gold/opened HUD and reward sound/state feedback trigger existing atomic autosave.
- One focused browser scenario passes10s: real mouse route to nearby treasure, virtual-controller opening, repeat keyboard input, atomic save/reload and persisted gold/opened identity. Closed/opened screenshots reviewed under test-results/w4-treasure-*.png (not committed); HUD moved away from existing controls. TypeScript/relevant lint/format/build pass; seven383/save cases reused. No long forest route/full regression rerun, no hardware/GPU claim.
- Session checkpoint after383–384.385 persistent discovery/minimap remains dependency-ready and authorized; W4 is incomplete and hosted gate verification remains pending. No W5. Existing save layouts/seeds/fingerprints/progression retained; nested exploration state migration is explicit. Preserve unrelated local edits.

## W4 / DBL-383 seeded one-time containers (2026-10-19)

- Prior checkpoint1e77cd7 CI39314212850 completed success.383 adds container-rule1: up to six deterministic reachable nonblocking chest/barrel/crate positions outside safe camp/anchors, common/rare gold amounts and existing item generator/table rewards. No layout/encounter seeds, fingerprints or character schema changes.
- Exploration state2 explicitly migrates state1 with zero gold/no opened containers while preserving original layout rules. Gold, opened identity and ground rewards share the existing atomic character checkpoint. Drop-capacity/placement failure commits nothing; duplicate opening/reload cannot repeat rewards. Old snapshots remain accepted; malformed/duplicate opened identities rejected.
- Three container cases plus four existing save cases pass; reachability/repeatability/seed variation, ownership/reload and full-drop rollback covered. TypeScript/relevant lint pass. Runtime controls/rendering are next384;385 discovery/minimap remains. W4 incomplete; no new hosted claim or W5 work. Unrelated edits preserved.

## W4 / DBL-382 browser travel CI follow-up (2026-10-19)

- CI39311124008 at542b4af passes check and formatting;118 browser cases pass, only generated forest travel exhausts its total120s budget. The failure is not the historical unit timeout or formatting. Public annotations identify world.spec.ts:101; full log access requires authentication.
- Forest pointer travel retains every pathfinder turn but uses three-unit rather than1.5-unit subdivisions, reducing repeated stop/project/click/wait work on straight segments. Existing arrival, transition, atomic reload and isolated restart assertions and per-hop10s timeout are unchanged. Only this full-trip case receives180s total CI headroom; global settings remain unchanged. No runtime/save/seed changes.
- Local baseline passes49.9s; reduced-stop route passes46.3s with identical assertions. TypeScript/relevant lint/format and build pass. No full regression repeated. Publication is a candidate fix pending CI; no W4 hosted claim. W4 remains380–382 delivered,383–385 pending; W5 untouched.

## W4 / DBL-382 reward context and safe checkpoint (2026-10-19)

-380/381 delivered as0831dff/363e1c5.382 binds future generated-world loot levels1/3/5 on load/restore/travel, retaining content tables, global seed/sequence, reserved/parked ownership and existing pickup transactions. Legacy content1 loot policy, item rolls, maps/fingerprints and character save schema remain unchanged. Version1 encounter plan checksum is pinned against accidental identity drift.

- Seven focused reward/lifecycle/save cases plus seeded placement case pass. Targeted Chromium live-ID checkpoint/reload passes and asserts stored forest reward level1; earlier screenshot reviewed. TypeScript/relevant lint/format/build pass. No broad regression, loot simulation, hardware/GPU or hosted-completion claim.
- Session-budget checkpoint after the three related380–382 increments. Next383 containers/one-time item+gold rewards,384 interactions,385 persistent discovery/minimap remain authorized. W4 remains incomplete; stop before W5. Preserve unrelated local edits. W4 evidence docs/world/w4.md; hosted gameplay verification belongs at the W4 gate.

## W4 / DBL-381 encounter lifecycle (2026-10-19)

- Existing AI/skills/lifecycle now run in generated world scenes, retaining the one player/progression authority. Packs defer within9 units of a restored player, use existing50-actor/path limits and champion mechanics, with provisional area/elite stat scaling. Camp/legacy small floors stay safe; survivors reset home, defeated IDs remain defeated.
- Existing per-area death snapshots and global loot sequence/ownership are reused; XP death ledger restores all area-namespaced IDs. Two lifecycle/reward replay tests plus four save cases pass,380 placement case passes. One Chromium live-ID save/reload case passes; screenshot reviewed. TypeScript/relevant lint/build pass. No schema, map seed or fingerprint changes.
  -380 committed0831dff. Next382 area-level loot binding before publication, then383–385 containers/discovery. Developer-only peaceful option isolates old visual/navigation scenarios, never default gameplay. W4 is incomplete; no hosted completion claim or W5 work. Unrelated edits preserved.

## W4 / DBL-380 seeded encounters (2026-10-19)

- User approves W3 and authorizes W4 DBL-380–385 only; stop before W5 IDs386+. Outstanding audit CI39307638495 inspected once:still in_progress, no new deployment claim.
  -380 adds pure encounter-plan1: forest skirmishers, graveyard mixed shield/support groups, crypt tank/caster groups; normal/champion/occasional elite leaders. Up to15/18/28 actors, stable area-namespaced IDs and independent RNG,9-unit anchor protection, actor-clear placement and swept intra-pack connections. Maps/fingerprints/save data unchanged. No runtime/reward adoption under380 alone.
- Focused12-layout/seed placement case, TypeScript/relevant lint/format pass. Next381 lifecycle/death persistence,382 loot scaling. W4 remains incomplete; no containers/minimap or hosted claim. Unrelated edits preserved. Evidence docs/world/w4.md.

## DBL-379 / W3 final technical review (2026-10-19)

- DBL-378 committedfb24201.379 connected review complete: four existing hosted environment cases4/4 (48.9s), one inspected screenshot per area, exact fingerprint/camera/real input/travel checks. Reused successful broad CI and earlier ownership/save/transition evidence; no unrelated regression, benchmarks or regenerated art.
- Exact public runtime7b268e87f5d7985de3d27f65f682cf6580fc760d verified: CI39302518214 verify/deploy success; Pages deployment7181832950 success, public index-DjRiEKMB.js matches local build, all7 bitmap hashes match audited source/exports. Evidence and screenshot hashes: docs/world/w3-review.md; review copies /private/tmp/hollowbane-w3-final-review/.
- Failed39290173775 tested533740e with a missing first-case local timeout; existing6bccd6f fixed it minimally. Both affected unit cases pass locally; no global timeout/assertion changes now. Asset/detail audit validates23 records,7 hashes and4.216MB transfer budget; native GPU/physical controller/release rights limits remain open.
- Stop at W3 quality gate: scoped374–379 technically complete, user visual approval pending. No W4/W5. Audit commits change validation/docs only; their post-push CI/Pages outcome must be recorded separately, not claimed from the deployed runtime's success. Preserve unrelated local edits.

## DBL-378 asset/detail audit (2026-10-19)

- Exact CI39290173775 failed on533740e: first world-layout case omitted a per-test timeout and inherited Vitest5s; only the second case then had15s. Existing6bccd6f minimally corrected the first case, preserving assertions/global unit settings. Reran affected file2/2 plus two appearance/camp cases:4 focused tests pass. Later runtime7b268e8 passed complete CI/Pages39302518214; no duplicate timeout fix introduced.
- DBL-378 now pins seven original source/export pairs by SHA256 and byte size, registers native world/camp code provenance and verifies per-file/aggregate/nominal decoded texture budgets through existing asset validation. Source art unchanged. Four-seed static scene counts/bounds and remaining release/hardware limitations recorded in docs/art/w3.md and w3-inventory.json.23 asset records and alpha/pivots/budgets pass; relevant lint/format pass.
- Next379 connected visual/navigation and hosted verification only. Preserve original IDs/dependencies and unrelated local edits. W3 review remains pending; no W4/W5.

## DBL-114/004 skill confirmation CI repair (2026-10-19)

- Quick mouse→Tab→Enter confirmation could be canceled by the click callback's device handoff before it read pending state. The callback now matches prompt policy: mouse/keyboard preserve pending confirmation; transitions to/from gamepad cancel. Added explicit focus assertions to legacy discipline/keyboard allocation browser coverage. No timeout/skill/save rule changes.
- All4 targeted skill-tree Chromium cases pass (mouse/save/reload, keyboard confirmation/repeat, virtual Xbox/PlayStation/cancel/disconnect). TypeScript/relevant lint/format/build pass. No full regression or physical-controller claim. W3 review stop remains; no W4/W5 or new phase work. Unrelated edits preserved.

## DBL-373 / W3 browser CI repair (2026-10-19)

- Attached CI log exposed a camp click outside the displayed viewport after travel, a forest waypoint wait and a legacy save expectation still pinned to schema4. Destination travel now precedes layout/camera presentation updates, and world diagnostics publish after rendering so area/position/camera describe the same displayed frame. Mouse waypoint checks stop prior movement and await walking=false before projection. Legacy browser assertion expects CHARACTER_SCHEMA while retaining previous schema1/item identity checks.
- Only three failing browser cases rerun: legacy IndexedDB upgrade, camp→forest→camp and forest mouse/keyboard/save/reload/isolated restart pass. Camera-centering regression assertion added after each camp transition; no forced clicks, skipped assertions or relaxed collision tolerances. Three focused view/runtime unit cases, TypeScript/relevant lint/format/build pass; camp screenshot reviewed.
- Existing unit5s failure was already fixed by6bccd6f; no further timeout increases. No save format, seeds, fingerprints or simulation rules changed. W3 review stop remains; no W4/W5. Preserve unrelated local documentation and external-result notes.

## DBL-375 / W3 CI timeout follow-up (2026-10-19)

- User CI evidence: historical/reproducibility world case exceeded5000ms at5439ms; the separate roundtrip case passed7461ms with its existing15s limit. The first case now also explicitly allows15s. Both cases retain every assertion, seed, path and fingerprint sample; no runtime/global unit timeout changes.
- Only world-layout.test.ts rerun:2/2 pass. TypeScript/relevant lint/format pass. No browser/full regression needed for a test timeout-only fix. W3 review stop remains; no W4/W5 work. Unrelated local edits preserved.

## DBL-377 / scoped W3 environment review candidate (2026-10-19)

- DBL-375 forest committed4d6995a;376 graveyard committed88bc39c.377 crypt now renders textured modular stone walls on existing solid boundary cells, original-footprint pillars, floor variations, torch-bearing arches and bounded static lantern pools. Existing generated rooms/corridors, exits and collision remain authoritative; no seeds/fingerprints/save contracts changed.
- Targeted appearance tests cover four seeds, legacy/current dispatch and all three biomes, scenery placement and unchanged fingerprints. TypeScript/relevant lint/build and21 asset records/alpha/pivots/budgets pass. One representative browser travel case per new environment passes; screenshots reviewed. No unrelated simulations, broad regression, physical-controller or GPU benchmark claim. Art provenance/budgets: docs/art/w3.md.
- Browser default timeout60s and slow world roundtrip unit timeout15s replace30s/5s; assertions unchanged. No remote timeout fix is claimed before CI evidence.
- Stop for scoped374–377 W3 environment quality review; user approval pending. Dedicated378–379 follow-ups remain open, not silently closed. No W4/W5 begun. CI/Pages check once after push; do not claim hosted verification without success evidence. Unrelated local documentation preserved.

## DBL-376 graveyard checkpoint (2026-10-19)

- Generated graveyard now renders gothic monuments, dead trees, fallen masonry, iron fence details, mist and labelled forest/crypt connections. Original transparent torch-lit crypt portal is anchored to existing solid terrain near the exit. Foot depth/occlusion shared with forest; no maps/seeds/navigation/fingerprints changed.
- Focused appearance/placement test across both biomes and legacy/current rules, TypeScript/relevant lint/build and asset alpha/pivot validation pass. One virtual-controller graveyard→forest browser case passes; screenshot reviewed at test-results/w3-forgotten-graveyard.png. No unrelated simulations or performance benchmark.
- DBL-375 committed4d6995a. Next377 crypt remains authorized. W3 quality review pending; no W4/W5. CI/Pages check after publication only; unrelated edits preserved.

## DBL-375 forest checkpoint (2026-10-19)

- Original leafy oak plus reused dead trees/fallen masonry, mossy path edges, rooted vegetation, bounded mist, foot-depth sorting and near-player canopy fading decorate existing generated forest cells. No navigation, seed or saved fingerprint changes. Sources/exports/provenance retained in docs/art/w3.md.
- Three focused environment/world-layout cases, TypeScript/relevant lint/build and alpha/pivot asset validation pass. Forest mouse travel/return passes; screenshot reviewed at test-results/w3-haunted-forest.png. No broad simulations or benchmark claim.
- Standard browser timeout60s; slow world roundtrip unit case15s, with assertions unchanged. Next376 graveyard then377 crypt remain authorized; W3 review pending. No W4/W5. CI/Pages check deferred until publication as requested. Unrelated edits preserved.

## W3 / DBL-374 checkpoint (2026-10-19)

- W2 approved; W3 DBL-374–377 authorized.374 camp technical candidate delivered: textured paving/apron, original transparent shelters/fire, reused ruins/trees/lanterns, static amber pools, exit sign and foot-depth layering. No generator/map/navigation/save changes; legacy/current camp fingerprint preserved.
- Seven targeted camp/layout/save tests, TypeScript/relevant lint/build and asset transparency/pivot/budget checks pass. Chromium camp→forest→camp passes; revised screenshot reviewed at test-results/w3-ashen-refuge.png. Source art/runtime exports/provenance retained in docs/art/w3.md. Bounded static layers only; no measured hardware-performance claim.
- Safe session-budget stop after374. Next375 forest, then376 graveyard and377 crypt; other areas retain W2 previews. W3 quality gate remains pending. No W4/W5 begun. Latest CI checked once but gh unauthenticated; no CI/Pages/public demo verification.
- Preserve unrelated BACKLOG/STATUS/L3 edits. W3 continuation remains authorized; do not infer completion of375–377 or broaden scoped IDs.

## DBL-373 / W2 runtime checkpoint (2026-10-19)

- New content2 expeditions integrate generator1 forest/graveyard/crypt geometry, live terrain/prop rendering, following camera, existing logical navigation and safe travel. Original primitives preview W2 geometry; W3 appearance placeholders remain. No W3 work started.
- Content1 restores exact original layouts/seeds and two-area availability. Content2 requires per-area layout fingerprints; drift/invalid data rejects before character mutation. Existing atomic checkpoint/CAS and single player/progression/item/loot authorities remain; no automatic layout conversion.
- Isolated developer seed/start-area/restart controls and current area/seed/layout/generator display use separate test-run databases; normal player storage is untouched. See docs/world/expedition.md.
- 378 unit tests, TypeScript/relevant lint/build/backlog validation pass. Two Chromium forest mouse/keyboard/save/reload/restart and crypt virtual-controller corridor/travel cases pass; screenshots reviewed. No physical-controller claim. Latest CI inspected once but gh unauthenticated; no remote CI/Pages/public demo verification.
- DBL-373 and W2 technically complete; stop here per current request. No W3 authorization inferred. Preserve unrelated BACKLOG/STATUS/L3 edits and historical external-result notes.

## DBL-372 checkpoint (2026-10-19)

- Bounded three deterministic candidate attempts for wilderness/dungeon, then validated fallback. Reuses371 placement/navigation validation; first-attempt version1 fingerprints unchanged. Registered area seeds and character/loot streams preserved; invalid input/fallback fail closed.
- 14 focused generation/retry/validation tests, TypeScript/relevant lint pass. No runtime/save/browser change. CI39275923451 checked once but gh unauthenticated; no CI/deployment claim.
- Next373 versioned runtime integration is authorized; W2 incomplete, no W3 started. Unrelated local documentation preserved.

## Generation validation checkpoint — DBL-371 (2026-10-19)

- DBL-370 committed99e995b.371 extracts shared actor-clearance/swept connectivity from wilderness, validates prop footprints against actual ground, prop/placement overlaps, reserved spawn/exit/arrival zones and bounded room placements. Dungeon checks room bounds/overlap, unique connected corridor metadata and actual swept room connections. Outdoor/dungeon version1 fingerprints remain unchanged.
- 18 focused dungeon/wilderness/shared-validation/save/travel checks, TypeScript/relevant lint pass. Pure candidate generation only: no live world/save contract/rendering changes or browser/full regression/loot simulations. Existing schema5/content1 areas stay pinned; no silent migration.
- Git sync published four prior commits through993f1cc after review/dry-run. CI39275311814 checked once at993f1cc was in progress; no deployment claim. This newly verified370/371 batch is ready for normal fast-forward publication; record push outcome in final report rather than assume success.
- Exact next DBL-372 bounded generation retries/fallback, then373 reproducibility/versioned integration before runtime adoption. Stop after the selected370/371 batch; W2 and full expedition remain incomplete. Preserve unrelated BACKLOG/STATUS/L3 edits.

## Dungeon checkpoint — DBL-370 / Git sync (2026-10-19)

- Reviewed unpublished8090595/3a220b5/b7606a9/993f1cc against remote b737d96: fast-forward ancestry, intended source/docs/tests only, no artifacts or credential-pattern matches. Formatting fix verified;13 focused checks/TypeScript pass. Dry-run then normal push succeeded through993f1cc; no history rewrite/unrelated edits staged.
- Resulting CI39275311814/993f1cc checked once: in progress, not successful/deployed evidence.
- DBL-370 adds versioned pure dungeon candidates: three reusable room sizes, seeded connected corridors, optional leaf rooms/dead ends, entrance/exit anchors, circular pillar footprints and future monster/treasure placement zones. Four focused deterministic/connectivity/invalid-input/fallback cases pass; TypeScript/relevant lint pass. Logical pillar appearance is a W3 placeholder, no artwork added.
- Next371 shared placement/navigation validation, then372 bounded retries. Runtime/save adoption remains later373; existing world content1/schema5 layouts remain untouched. Current dungeon authorization supersedes historical exclusions below. W1–W5 incomplete.

## Outdoor composition checkpoint — DBL-369 (2026-10-19)

- DBL-368 committed b7606a9;369 composes20 modules through a seeded spanning tree, winding passages, clearings and exact named entrances/arrivals. Original circular footprints follow rotated stamps. All walkable cell centers and anchors are checked with actor clearance/swept collision; invalid outdoor candidates use a deterministic validated clearing fallback.
- 13 focused module/generation/save/travel tests pass, including nine representative seeds, route variation, an exact version1 digest, blocked entrances, split terrain and forced disconnected-extension fallback. TypeScript/relevant lint pass. Pure generation only: no rendering changes, browser tests, loot simulations or benchmarks. W1 runtime/schema5/layout1 saves remain pinned and unchanged; new layout1 is separately scoped to the wilderness generator, not installed as world content1.
- No additional ready authorized issue: next graph node DBL-370 is dungeon generation, expressly excluded.371 navigation validation and372 general retries/fallback retain their dependencies and remain planned;369 includes only its local outdoor safety guard, not their broader acceptance.373 remains later seeded/runtime integration. Stop before370; W1–W5 expedition incomplete.
- Remote main remains b737d96 and latest CI39267892319 is the old formatting failure. Local366 onward have not been pushed; no new CI/Pages success claimed. Unrelated local documentation preserved.

## Wilderness modules checkpoint — DBL-368 (2026-10-19)

- Five original data-driven logical module kinds: path, clearing, forest, obstacles and ruins; seeded selection, quarter-turn masks and matching circular collision footprints. Two focused tests cover all20 rotated modules, ports, deterministic choices and invalid inputs; TypeScript/relevant lint pass.
- Collision-only appearance tags `wilderness-boulder-footprint` / `wilderness-ruin-footprint` are unresolved W3 renderer placeholders, not external artwork. Pure generator foundation only; version-one saved layouts and runtime remain unchanged.
- Remote main is b737d96; local366/367 have not reached GitHub. Latest CI39267892319 failed pre-fix formatting; no new deployment evidence.
- Next DBL-369 seeded outdoor composition. DBL-370 dungeon work is explicitly excluded this session;371/372 retain their original370/371 dependencies and cannot be closed as ready wilderness issues. W1–W5 remains incomplete.

## World persistence checkpoint — DBL-367 (2026-10-19)

- Schema5 adds optional versioned exploration to the existing checksum/CAS/current+previous IndexedDB transaction. Persists area, four derived seeds, position, discovery, parked ground items and per-area loot death identities. One global loot stream and nested item ownership remain authoritative. Schema1–4 saves migrate without inventing exploration.
- World route restores validated layout/navigation/position and character together; exit-zone positions resume at a clear spawn. Invalid/unknown/unavailable area references reject without partial load, retain originals and leave the safe camp session available with explicit backup recovery. Character-only routes refuse exploration restoration and lock saving rather than overwrite world state. Out-of-bounds legacy ground items require retained-original recovery/export, never silent relocation/deletion.
- 31 focused save/progression/equipment/runtime/navigation/ownership checks pass; TypeScript/relevant lint pass. Chromium save→reload in forest→camp and IndexedDB world+character backup/stale-tab/corruption recovery pass. No loot simulations or physical-controller claim. Original temporary W1 floors remain; complete expedition is not delivered.
- CI inspected once: latest39267892319 still targets b737d96 and failed formatting;8090595 has no published run, so its correction is not remotely verified. No new Pages claim.
- W1 technical scope362–367 is complete. No dependency-ready W1 issues remain: exact next DBL-368 is W2 reusable wilderness modules, followed369 seeded outdoor composition. Session-budget stop; W1–W5 authorization remains active through World review.

## World runtime checkpoint — DBL-366 (2026-10-19)

- `?world=1` integrates original temporary logical camp/forest floors and exit markers with the existing Phaser scene, pointer/keyboard/virtual-controller movement and logical swept navigation adapter. One live player/progression authority survives travel; area-local actors/projectiles clear only after validated commit. W2 generation/W3 art remain pending; no external assets added.
- 13 focused unit checks, TypeScript/relevant lint, build and two Chromium mouse/virtual-controller camp→forest→camp cases pass; screenshot reviewed. Prototype intentionally has no storage/inventory binding until DBL-367; no physical-controller claim.
- Latest CI39267892319 at b737d96 failed format:check; deploy skipped. Reproduced committed BACKLOG missing blank lines, fixed only that formatting in the index while preserving unrelated local edits. No new hosted claim.
- Soft session-budget checkpoint: next DBL-367 atomic world/character persistence, then DBL-368 W2 modules. W1–W5 authorization remains active through World quality review; complete expedition is pending.

## World & Exploration checkpoint — DBL-365 (2026-10-19)

- DBL-365 owns only immutable travel/layout state. Prepared transitions verify proximity, registered destination and area seed, deep-copy validated destinations, reject forged/canceled/stale/cross-session/replayed handles and retain old state on failure. Three focused transition cases plus two anchor cases, TypeScript and relevant lint pass; no character/save mutation.
- Next: DBL-366 runtime lifecycle/two-area prototype, then367 atomic world persistence. W2–W5 remain pending.
- W1–W5 remains authorized; stop at World quality review. No complete expedition or new hosted claim. Preserve pre-existing L3 changes; physical-controller evidence remains open.

## World & Exploration checkpoint — DBL-364 (2026-10-19)

- DBL-364 validates exact registered exits, clear actor-radius spawns/triggers/arrivals and separation from every exit interaction zone. Two focused tests, TypeScript and relevant lint pass. Logical anchors only; runtime integration follows DBL-366.
- Next: DBL-365 prepared atomic transition domain; then366 runtime prototype and367 save binding.
- W1–W5 remains authorized; stop at World quality review. No complete expedition or new hosted claim. Preserve pre-existing L3 changes; physical-controller evidence remains open.

## World & Exploration checkpoint — DBL-362–363 (2026-10-19)

- User authorizes autonomous W1–W5 through World quality review. C13 technical prerequisite complete: CI39165184187 / e14335fad98afbc7464ae2c2a0505ce465af619b verify+Pages success; public index-DBDMEo57.js matches; three hosted class cases pass, Warrior screenshot reviewed. No physical-controller/balance claim.
- DBL-362 pure four-area registry, reciprocal connections and stable versioned area seeds delivered; three focused tests, TypeScript/relevant lint and backlog validation pass. No runtime world integration or public expedition yet.
- Thirty increments DBL-362–391 registered without renumbering original IDs/parents; scope and continuation docs/world/expedition.md. DBL-363 logical terrain/object/navigation contracts also delivered: two focused clearance/validation tests (five combined), TypeScript/relevant lint pass. Next DBL-364 spawn/entrance anchors, then365 safe transitions,366 runtime prototype,367 persistence. Continue sequentially under W1–W5 authorization; no new approval required before World review. Soft session checkpoint; resume at DBL-364. Existing src/world/navigation.ts uses projected ground-image pixels; preserve it and add an explicit logical-map adapter at366 rather than mixing units.
- Preserve pre-existing BACKLOG.md/docs/backlog.json/docs/items/l3.md/STATUS.md changes separately. Hardware, artwork, provisional class balance, broader parent and issue-sync follow-ups remain open. This checkpoint supersedes historical “no world authorized” notes below.

## C13 Linux inventory references reviewed (2026-10-18)

- CI39164518366 /63bd4c8 passed check/format and110 Chromium cases; only two Linux inventory visual references failed. Advanced browser verification and Pages deployment were skipped; C13/user quality approval remain pending.
- Retrieved public artifact12150163212, verified artifact expected images exactly matched repository references, and reviewed both Linux actual/diff pairs. Copied only the exact1920/1024 Linux actuals for the intended Skills summary/layout shift (1920 height858→930). No tolerance/assertion changes or platform substitution. Provenance/full hashes: docs/character-classes.md.
- Reference-only follow-up; reused CI simulation/type/lint evidence, no local broad tests or loot simulations. Next: push this increment, confirm regular Linux/advanced CI checks and exact Pages SHA/assets, then run hosted class tests. Stop at C13; physical hardware, provisional balance/planned nodes and unrelated local edits stay open.

## C13 CI failure / safe publication checkpoint (2026-10-18)

- Runtime83593130685becfcbaa40d65f67f98ee24c2427c pushed; CI39164311209 FAILED in npm run check; Pages skipped. Public index-BJpbzwJa.js is still the prior progression build; candidate index-DBDMEo57.js is NOT hosted-verified. C13 and user quality approval remain pending.
- Fixed stale future-schema assertion at advanced-loot.test.ts:235: schema3 replacement was a no-op for schema4. Both schema assertions now use CHARACTER_SCHEMA. Three focused save tests, TypeScript/relevant lint pass; no local full regression/million-roll initializer/loot simulations rerun. Existing31 focused class/persistence checks and three keyboard/mouse/virtual-controller class scenarios passed. Two reviewed Darwin references pass normal comparisons.
- Resume: inspect successor CI triggered by this commit, resolve actual failures; Linux inventory references likely need actual Linux image review for the intended Skills summary. Do not copy Darwin references or relax tolerances. Confirm exact CI/Pages runtime SHA, then run three hosted class flows. Prior failed run: https://github.com/tobisen/hollowbane/actions/runs/39164311209 . Detailed evidence/hashes: docs/character-classes.md.
- Candidate URLs: https://tobisen.github.io/hollowbane/?developer=1&classLab=warrior (also sorcerer/ranger); deployment pending. STOP at C13; no world/campaign. Preserve unrelated L3/backlog edits, provisional balance/planned nodes and physical-controller follow-ups.

## C13 class quality publication candidate (2026-10-18)

- Scoped DBL-113/115/116:31 focused unit checks, three keyboard/mouse/virtual Xbox–PlayStation class combat flows, TypeScript/relevant lint pass. Reused prior class/save/equipment evidence. Fixed bare class-lab routing and conflicting encounter/loot flags; class lab creates no inventory/IndexedDB access and no NPC spell casts.
- Reviewed/refreshed only two Darwin inventory references for the intended Skills summary; assertions/tolerances unchanged. Linux references require real Linux evidence. No full local regression or loot simulations; existing CI requires full regression.
- Publication authorized; inspected SSH push dry-run (remote1ce9e92 → local25fb180 before this increment). Next: push this verified candidate, record exact CI/Pages SHA/result, review real failures/Linux images and run hosted class scenarios. C13/user quality approval remains false until review. Candidate demo: https://tobisen.github.io/hollowbane/?developer=1&classLab=warrior (also sorcerer/ranger); hosted verification NOT yet claimed.
- STOP at C13; no world/campaign. Preserve unrelated local edits and provisional balance/planned-node/physical-controller follow-ups. Evidence: docs/character-classes.md.

## C10–C12 class gameplay complete (2026-10-18)

- C10–C11 domain committed f1c50ed (scoped DBL-110/112/113). C12 connects shared class mechanics/descriptions/HUD/skillbar and correct pointer-source aiming; schema4, old ranks/items and six legacy abilities preserved. No permanent class switching/respec/new tree UI.
- Developer-only `?developer=1&classLab=warrior|sorcerer|ranger` creates memory-only level12 starter fixtures and passive targets; inventory/save UI is excluded. Browser checks deny IndexedDB access, proving no character checkpoint reads/writes on this route.
- 59 focused unit/7 targeted Chromium cases pass; TypeScript, relevant lint/format/build pass. Class/skill screenshots reviewed. Provisional balancing, planned nodes, physical controllers and broader parents remain open; no full regression/loot simulation/publication claim. Details: docs/character-classes.md.
- STOP after C12. Await explicit continuation; preserve unrelated local L3/backlog edits and all hardware/art/performance follow-ups.

## C10–C11 class combat domain verified (2026-10-18)

- Scoped DBL-110/112/113: heavy guarded-stagger Warrior melee/defensive armor buff; Sorcerer projectile/slow control; Ranger precise poison/piercing projectiles. Attribute scaling, one ranked passive and conditional direct-hit synergy per class use existing modifiers, fresh baselines and duplicate-hit prevention.
- 59 focused unit tests, TypeScript/relevant lint pass. Schema4, existing IDs/ranks and six unclassed abilities preserved; no switching/respec. Original broader parents remain partial.
- C12 remaining: commit browser/HUD/description integration and isolated memory-only developer fixture route with final seven-case browser evidence/screenshot review. No next-phase authorization. Details: docs/character-classes.md; preserve unrelated local edits.

## C7–C9 skill-tree UI complete (2026-10-18)

- Scoped DBL-111/114/204/004/210 delivered: gothic Skills panel, three branches per discipline, prerequisite/state/rank display, shared-rule current/next effect inspector, confirmed allocation and learned-active skillbar assignment. No new abilities/respec.
- Existing semantic keyboard/mouse/controller input retained; repeated input, stale state, cancel/disconnect/device changes protected. Optional validated schema4 bar preserves prior saves and legacy six-skill access. Permanent discipline choice is explicit and changes skill access only, preserving attributes/items.
- 33 focused unit/8 targeted Chromium cases, TypeScript/relevant lint/format/build pass; desktop/narrow screenshots reviewed. Controller evidence is virtual Xbox/PlayStation only. Planned nodes/hardware/broader parents remain open. Evidence: docs/character-classes.md.
- STOP after C9. Await new authorization before further classes/gameplay; preserve unrelated local L3/backlog edits and hardware/art/performance follow-ups.

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

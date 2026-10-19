# World & Exploration

Authorized 2026-10-19: W1–W5, thirty dependency-ordered scoped increments DBL-362–391. The pre-existing local DBL-361 follow-up record is retained unchanged as an ID reservation so committed numbering remains contiguous; it is not part of world delivery. Stop at World quality review. C13 technical prerequisite verified against CI39165184187, runtime e14335fad98afbc7464ae2c2a0505ce465af619b and hosted class flows. This is not a claim of class balance approval or physical hardware verification.

## Architecture

DBL-362 defines four logical identities, reciprocal named arrivals, safe camp metadata and versioned uint32 per-area seed derivation independent of generation/visit order. Registry validation checks identity uniqueness, reciprocity and reachability. Seeds are content-versioned; subsequent generator changes must preserve older saved layouts or migrate explicitly. Area levels1/1/3/5 are provisional tuning.

World coordinates and collision/navigation stay in simulation. Rendering projects loaded area data through existing movement/camera/depth systems. Planned layers separate terrain, collidable objects, decoration and authored spawn/connection anchors; no monolithic scene or renderer rewrite. DBL-363 adds bounded row-major terrain and separate identified objects with logical circular footprints, plus pure map validation and actor-clearance queries. Existing src/world/navigation.ts uses projected ground-image pixels; DBL-366 must explicitly adapt logical navigation without changing legacy movement. Runtime world loading is not implemented yet.

The current character/inventory session remains the single owner of XP, attributes, skills, equipment, item ownership and loot stream. Area changes must prepare and validate destination terrain/spawn before committing, reject stale/repeated requests, and leave the live session intact on failure. World state will own only area seed/version, discovery, encounter/container identities and position. Save integration must use the existing atomic checkpoint/CAS path, not a second independent character save.

W2 composes reusable modules into paths/clearings and rooms/corridors, validates connectivity and restricted placements, retries a bounded number of times then uses a validated safe fallback. W3 reuses existing original assets with provenance and detail budgets. W4 binds existing encounters/loot, one-time container transactions and exploration/minimap. W5 covers expedition/save/controller integration, useful performance measurements and exact public runtime verification.

## Verification and continuation

DBL-362: three focused domain cases cover reciprocal connected registry, invalid/missing/disconnected entries and deterministic independent seed identities, including invalid seed bounds. TypeScript and focused lint required before commit. No assets added; no new placeholders. No world browser route or public expedition exists yet.

DBL-363: two focused map validation/clearance cases pass (five combined world tests), TypeScript/relevant lint pass. Test-only appearance ID test-only-rock is a fixture, not a runtime asset/placeholder. No production assets added.

Next DBL-364: authored spawn/entrance anchors validated against logical clearance and registry arrival names. Then DBL-365 prepared transitions, DBL-366 runtime prototype, DBL-367 atomic world persistence. Continue sequentially under user W1–W5 authorization; no routine approval stops. Preserve unrelated L3 edits and original parent dependencies. Final broad suite only at W5 or meaningful shared-system risk.

## DBL-364 checkpoint

DBL-364 validates exact registered exits, clear actor-radius spawns/triggers/arrivals and separation from every exit interaction zone. Two focused tests, TypeScript and relevant lint pass. Logical anchors only; runtime integration follows DBL-366.

Next: DBL-365 prepared atomic transition domain; then366 runtime prototype and367 save binding.

## DBL-365 checkpoint

DBL-365 owns only immutable travel/layout state. Prepared transitions verify proximity, registered destination and area seed, deep-copy validated destinations, reject forged/canceled/stale/cross-session/replayed handles and retain old state on failure. Three focused transition cases plus two anchor cases, TypeScript and relevant lint pass; no character/save mutation.

Next: DBL-366 runtime lifecycle/two-area prototype, then367 atomic world persistence. W2–W5 remain pending.

### DBL-366 implementation handoff

Integrate the existing arena rather than introduce another character authority. `src/main.ts` routes labs to `startCombatArena`; `src/rendering/combat-arena.ts` closes over one `nav` object shared with movement, skills, loot and inventory. `src/world/navigation.ts` currently projects logical points through `onGround` and supports ellipse obstacles; introduce an explicit logical-map navigation adapter while preserving legacy behavior and run navigation/movement checks. WorldTravel owns frozen layouts and generation-independent area seeds; movement must synchronize travel position before prepare, while caller enforces idle/alive/input-modal safety.

Scene actor0, world.experience, inventoryRuntime and loot session must survive travel; do not call the arena reset handler, which recreates world/abilities and resets loot. Clear per-area targets/projectiles/AI only after destination validation; do not transfer uncollected drops to the destination. DBL-366 may use clearly documented original temporary floor/exit visuals for camp/forest; W2 generation and W3 environment art are still pending. Test actual walk→exit→return flow and save-owner identity; use keyboard/mouse and virtual controller. DBL-367 then binds versioned world state to existing atomic character save, with legacy/no-world compatibility. No hosted expedition claim until W5.

## DBL-366 checkpoint

`?world=1` loads the existing arena scene with the same player and progression owner. Explicit `areaNavigation` retains logical collision units, sweeps circular clearance against solid cells/objects and reuses the existing pathfinder; legacy navigation is unchanged. Original temporary eight-by-eight ground floors and exit rings introduce no external assets. These placeholders await W2 generation/W3 environment work. Forest's graveyard connection is visibly inactive until subsequent world increments.

Camp/forest travel validates and commits before removing targets/projectiles, stops queued movement and clears area-local skill bolts/statuses while preserving self statuses, resources and progression. Alive/idle/cast/modal/pause guards protect transitions. W1 prototype excludes storage/inventory routes pending DBL-367 atomic binding; it does not claim saved expedition integration or item transfer verification. Existing character routes remain available unchanged.

Evidence: 13 focused navigation/travel/runtime units, TypeScript/relevant lint and build pass. Two Chromium cases actually walk camp→forest→camp with mouse and virtual Xbox input; screenshot reviewed. No physical-controller or hosted verification. CI39267892319/b737d96 failed formatting before deploy; reproduced committed BACKLOG's missing blank lines and corrected them without staging unrelated L3 edits.

Soft session-budget checkpoint: next DBL-367 versioned world snapshot and existing atomic character save binding. W1 is not complete; W2–W5 remain authorized/pending. No new approval stop.

## DBL-367 checkpoint

Character schema5 adds optional exploration version1 to the existing single checksummed snapshot. IndexedDB database/store versions stay unchanged: current+previous writes and stale-tab CAS still cover the entire character/world together. Explicit schema1–4 migration preserves prior progression/equipment/inventory, nested sockets/runes and loot without fabricating exploration. Original version-one prototype layouts are pinned in `world-prototype.ts`; W2 must version/migrate rather than change restored layouts silently.

World snapshots validate current area, four exact derived seeds, content/layout version, clear position, unique discovered areas, per-area death identities and bounded parked drops. Item ownership/content validation includes all parked areas and embedded items. Travel parks old ground drops and restores destination drops without rerolling identities or resetting the single loot sequence; active-area drops remain only in the character loot block. Recovery starts outside exit zones. Unknown/unavailable area references and invalid positions fail closed: original storage remains retained, initial camp stays usable, and existing explicit backup recovery remains available. Legacy ground items outside the logical camp bounds are rejected with originals retained rather than moved/deleted silently.

Scene restoration prepares validated navigation/layout before committing character/world synchronously. Saving serializes the complete snapshot synchronously before the asynchronous IndexedDB transaction; travel during an in-flight save marks another checkpoint dirty. Character-only routes reject world checkpoints before mutation and lock writing so opening an older lab cannot erase exploration. Inventory/save UI is now enabled on `?world=1`; HP/mana/combat still follow the existing restart policy.

Evidence:31 focused navigation/travel/save/progression/equipment/runtime/embedded-ownership tests; TypeScript/relevant lint. Critical Chromium world save→forest reload→camp and IndexedDB combined-world backup/CAS/corrupt-save recovery pass. No loot simulations. CI queried once: latest39267892319 stillb737d96/format failure;8090595 is not pushed/CI-verified. No hosted claim. W1 scope362–367 technically complete; next368 begins W2, so no additional W1 task exists. Stop at session budget, retaining W1–W5 authorization.

## DBL-368 wilderness modules

Five original logical seven-cell modules provide path/clearing/forest/obstacle/ruin masks and circular prop footprints. Data-driven catalog, versioned local uint32 stream, explicit quarter turns and named cardinal ports keep generation independent of rendering, global loot RNG and visit order. Two focused tests cover20 rotated stamps, clear doors/centers, blocked prop footprints, reproducible selection and malformed masks/seeds/catalogs. No runtime/save layout changes or browser work. Collision-only appearance tags `wilderness-boulder-footprint` and `wilderness-ruin-footprint` are W3 renderer placeholders; no third-party content/assets added.

Next369 composes outdoor modules.370 is dungeon scope and excluded by the current user request;371/372 remain dependency-blocked by370/371 respectively. Preserve graph/IDs rather than silently close blocked issues. Remote main remainsb737d96; local366/367 unpushed, latest CI39267892319 is the old format failure. No deployment claim.

## DBL-369 outdoor composition

The pure outdoor generator composes a five-by-four module graph with seeded randomized depth-first connections. Every module belongs to one spanning tree; cardinal ports carve winding passages through the same logical masks used by navigation. Spawn and two registered exit/arrival groups occupy reserved clearings. Authored circular props are rotated/transformed with their masks, validated against their ground footprint and kept off passage axes. Forest and graveyard identities derive independent area seeds. An exact layout digest pins wilderness-generator version1; this version is separate from world content1/exploration1, whose existing prototype layouts remain untouched.

The local outdoor safety guard flood-fills actor-clear cell centers using exact swept navigation edges, checks spawn/exits/arrivals and rejects disconnected walkable pockets. A disconnected extension catalog deterministically falls back to connected clearings and revalidates; malformed catalogs/seeds fail explicitly. No retry loop/shared dungeon validation is claimed. The existing DBL-371/372 broader acceptance and dependencies remain planned, not duplicated/closed under369. New modules/generation are not yet installed into the playable route; runtime/save adoption requires the later explicit versioned integration, preserving existing saves meanwhile.

Evidence:13 focused module/composition/save/travel cases pass. Covers all20 module rotations, nine representative seeds including uint32 boundaries, meaningful graph/mask variation, preserved registry connections, corrupt anchors, impassable cut, collision obstruction, forced fallback and exact version1 fingerprint. TypeScript/relevant lint pass. No renderer/interaction changes or browser/full regression/loot simulations/benchmarks. Original logical appearance tags remain the368 W3 placeholders, with no new assets.

Next dependency node370 is a dungeon generator and excluded this session.371/372 depend on370/371; their dependencies and original IDs are unchanged. Stop here pending scope/dependency direction rather than begin forbidden dungeon work. Overall W1–W5 remains incomplete. Remote main/CI unchanged from the single startup check; no publication/deployment claim.

## DBL-370 and Git synchronization

Explicit dungeon authorization supersedes the prior session's exclusion. Three original room templates (5×5,9×5,7×7) compose seeded room trees, optional pruned leaves, straight connected corridors, distinct entrance/exit rooms and registered crypt return anchors. Matching logical pillar circles and reserved monster/treasure zones add no live actors/items. `dungeon-pillar-footprint` is a W3 appearance placeholder with no external artwork. Version1 dungeon candidates remain separate from unchanged persisted world content1. Four focused tests verify representative uint32 seeds, variation, anchors/connectivity, bad geometry/input, exact fingerprint and deterministic validated fallback after simulated candidate rejection. No runtime/browser changes.

Reviewed four unpublished commits against remote b737d96: fast-forward ancestry, expected source/docs/tests only, no generated artifacts or credential-pattern matches, formatting and13 focused tests/TypeScript pass. Dry-run then normal push published through993f1cc. Resulting CI39275311814 checked once in progress; no success/deployment claim. Existing local BACKLOG/STATUS/L3 edits excluded. Next371 shared navigation/placement validation;372 retries and373 versioned runtime integration remain pending.

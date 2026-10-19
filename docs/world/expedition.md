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

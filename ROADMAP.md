# Roadmap

The initialization directive supplies the following 36 target phases. The imported backlog has a different topic ordering; its phase metadata is deliberately retained rather than silently renumbered. Use requirements/DBL IDs to plan against this target roadmap. Current authorization: G4 Monster AI approved; Skills & Spell Systems (topic 10) through its quality gate. Delivery gate names do not rename the original G0–G6 definitions.

- **00 — Project Foundation**
- **01 — Engine Evaluation**
- **02 — Rendering Architecture**
- **03 — Art Direction & Asset Pipeline**
- **04 — Isometric World Prototype**
- **05 — Character Movement**
- **06 — Combat Fundamentals**
- **07 — Advanced Combat Mechanics**
- **08 — Monster AI**
- **09 — Monster Types & Behaviors**
- **10 — Skills & Spell Systems**
- **11 — Item Architecture**
- **12 — Loot Generation**
- **13 — Inventory & Equipment**
- **14 — Advanced Itemization**
- **15 — Vendors & Economy**
- **16 — Character Attributes & Experience**
- **17 — Character Classes & Skill Trees**
- **18 — World Architecture**
- **19 — Procedural Map Generation**
- **20 — Environments & Dungeons**
- **21 — NPC & Quest Systems**
- **22 — Campaign & Bosses**
- **23 — Difficulty Scaling**
- **24 — Advanced Character Builds**
- **25 — Farming & Endgame**
- **26 — Crafting & Item Upgrades**
- **27 — Advanced Gameplay Systems**
- **28 — Expanded Classes**
- **29 — Expanded Monsters & Bosses**
- **30 — Expanded World & Campaign**
- **31 — Content Balancing**
- **32 — Graphics & Animation Polish**
- **33 — Sound, Music & Atmosphere**
- **34 — Performance, Accessibility & QA**
- **35 — Release & Future Development**

## Gates

G0: verified technical foundation, engine comparison/ADR, local and published prototype. Stop for approval.
G1: approved coherent visual/movement prototype.
G2: responsive combat approved through observed encounters.
G3: complete kill/loot/equip/sell/level/specialize loop.
G4: first playable campaign act.
G5: complete core campaign difficulties and endgame.
G6: release quality, legal/assets, reliability and browser checks.

Original source phases 00–01 cover initialization. Target phases 04–05 split source phase 04; source phase 33 contains save reliability that remains a prerequisite for any persistence feature, regardless of target phase names. The backlog source remains the detailed requirements authority, not an instruction to implement all phases.

## Source-to-target allocation

The import uses `phase` for original source numbering and `targetPhase` for GitHub phase labels/milestones. Topic allocation is explicit in docs/backlog.json. Target phase 04 (world prototype) is an integration gate composed from projection, art and movement requirements; it has no fabricated replacement DBL ID. Source companion/challenge systems map to target phase 27; source save/reliability requirements map to target phase 34. Broader source requirements are split into new dependent IDs only when entering an approved phase.

## Delivery insertion: Phase 2.5 — Complete Gamepad & Controller Support

Authorized 2026-10-17, after approved movement and before any further combat development. This delivery phase does not renumber the original 36 target phases above. All completed Phase 3 work through `4f68d1f` is preserved; the request to pause after DBL-253 is applied prospectively because later combat increments were already completed. No combat systems are added in this phase.

DBL-GP01–12 map uniquely to stable DBL-263–274 (see BACKLOG.md). Complete semantic input, lifecycle/profiles, analog movement/aim, existing-screen navigation, prompts, persistent settings, calibration, safety/haptics, browser/performance validation, then stop at **G2.5**. Phase 3 resumption depends on DBL-274 completion **and explicit G2.5 user approval**; docs/gamepad/gates.json records this dependency. Emulated browser validation never substitutes for physical-controller verification.

## Authorized delivery: Phase 4 — Monster AI

G2.5 is approved. User delivery Phase 4 maps to original roadmap topic 08 (Monster AI) and foundations in 09; the original 36 phases and numeric source metadata remain unchanged. Scoped DBL-275–281 depend on completed combat/controller slices rather than marking the original spell-chain dependencies done. Implement through the Monster AI quality gate only; hardware follow-ups DBL-282–286 remain separate.

## Authorized delivery: Skills & Spell Systems

G4 Monster AI approved by user. Original topic 10 and scoped source DBL-044/046/047/051–057/062 slices execute as DBL-291–298. Preserve 36 topics and existing parent dependencies; no character skill trees, items or campaign. Stop at the skills quality gate.

## Intermediate Gameplay & Visual Polish

Skills technically approved. DBL-299 HUD performance, then scoped DBL-300 motion, 301 skill effects, 302 HUD readability, 303 audio, 304 contact/lighting consistency, 305 regression/showcase, 306 repeated performance, 307 hosted verification, 308 HUD-safe camera and 309 final gate evidence. These refine existing DBL-260/042/050/057/063/074 slices, not duplicate full requirements. Preserve the original 36 phases and IDs; no gameplay expansion. Stop for polish review.

Polish technical candidate delivered: scoped DBL-299–309 complete; user quality approval pending. Original 36 phases, IDs and broader partial parents preserved. Stop before new gameplay. Evidence: docs/polish/milestone.md.

## L1 – Item Architecture & Loot

Polish technically approved. DBL-310 content, 311 generation, 312 inspection/save, 313 death drops, 314 playable interaction, 315 diagnostics/statistics, 316 regression/performance/publication, 317 quality evidence. Original topics11–13 and parent dependencies preserved; these scoped slices do not complete inventory/equipment or broader itemization. Stop at L1 review; no L2 without approval.

L1 quality work split before completion: DBL-316 regression/visual, DBL-317 repeated performance/hosted verification, DBL-318 final review evidence. Scope is now310–318; stable original IDs/topics preserved, no duplicate acceptance.

DBL-319 is a required L1 dependency discovered by burst profiling: early-seed RNG correlation fix/content version2. DBL-317 depends on319 before final performance/publication;318 remains final gate. Graph validation now supports later-added dependencies without renumbering IDs and detects actual cycles.

L1 technical candidate delivered: DBL-310–319 complete; stop for user L1 review. Original36 phases preserved; no L2 without approval. Detailed docs/loot/l1.md.

L1 approved; L2 Inventory & Equipment authorized through DBL-320–331 and L2 gate, superseding the earlier inventory prohibition for this scope. Sequential footprints/grid/equipment/world transactions/stats/persistence/UI/controller/regression/performance/publication/gate. Original36 topics and IDs preserved; no L3/progression/crafting/vendors/sockets/runewords.

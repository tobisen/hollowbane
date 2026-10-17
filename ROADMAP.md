# Roadmap

The initialization directive supplies the following 36 target phases. The imported backlog has a different topic ordering; its phase metadata is deliberately retained rather than silently renumbered. Use requirements/DBL IDs to plan against this target roadmap. Current authorization: initialization tasks A–M and technical G0 only. No production gameplay beyond the foundation.

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

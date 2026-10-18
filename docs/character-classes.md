# Character classes C1–C3

User approved Character Attributes & Experience through P11 (1ce9e92) on 2026-10-18 and authorized this bounded data foundation only.

## Existing issue reconciliation

- C1: DBL-113 scoped class-definition foundation, including authorized Ranger data. The original two-class playable vertical slice remains partial; no IDs, titles or dependencies replaced.
- C2: DBL-111 scoped typed three-branch data per class with requirements/ranks. Runtime tree integration remains outside this slice.
- C3: DBL-115 scoped content/build validation. Full build calculator, effects and breakpoints remain pending. Original dependencies on DBL-110/112/114 remain unchanged; their broader scope is not claimed complete.

## Data and shared calculations

`character-classes.ts` supplies Warrior, Sorcerer and Ranger identity, configurable starting attributes and base HP/mana. Provisional starts respectively: STR/DEX/VIT/ENE 8/3/7/2, 2/3/4/11, 4/9/5/2; base HP/mana 120/60, 80/120, 100/80. These are unaudited balance defaults, not applied to existing characters. `createClassFoundation` uses existing `experienceAt` and `createAttributes`; `classEquipmentBase` feeds the existing equipment stat calculation, which adds attribute resource bonuses once. No per-class progression formulas.

`src/content/skill-trees.json` version1 defines Arms/Resolve/Bulwark, Ember/Rime/Tempest, Wilds/Precision/Trailcraft. Stable branch/node IDs have level requirements (1/12), maximum ranks (5/3) and ranked prerequisites. All six existing active skills are referenced unchanged. Planned abilities are explicit original data placeholders: no effects/assets or runtime registrations. Every mastery node and Warrior Bulwark/Ranger Precision/Trailcraft foundations are unavailable extension points. No new playable skill is claimed.

Unknown tree input is validated atomically and copied/deeply frozen. Rejects invalid version/classes/branches/nodes, duplicate IDs, missing or cross-class references, prerequisite cycles, invalid ranks/levels, unknown existing abilities and existing abilities dependent on planned ones. Pure build validation rejects unavailable abilities, unmet requirements and invalid ranks; output sorts stable IDs independently of caller key order. Ranks are read-only hypothetical inputs, with no point spending or effect calculations. Bounds: three branches per class, 1–128 nodes per branch, level1–99, rank1–20.

## Persistence and continuation

Class content and tree content each start at version1. Future save work must explicitly persist class ID, content versions and stable node/rank pairs, define missing/renamed-node migration and validate before atomic restore. No current save schema, migration, runtime skill availability or existing character is changed here. No balance or physical hardware claim.

Verification: eight focused tests across class foundations, tree validation and existing skill registry; TypeScript, focused ESLint and formatting pass. No browser behavior changed; no E2E, full regression or loot simulations run.

STOP after C3. Next requires user scope/authorization (for example skill point rules); class selection, allocation UI, tree rendering, effects, artwork, vendors and campaign remain unimplemented.

## C4–C6 (2026-10-18)

C4 rewards one skill point per gained level (98 total at99), with an immutable high-water ledger separate from attributes. C5 validates atomic rank increments, class/level/prerequisites/caps and total spending; no refunds/respec. `InventoryRuntime.allocateSkills` checks the expected authoritative state, persists through the existing session API and rejects stale requests. Scoped original IDs: DBL-103 rewards, DBL-111 allocation, DBL-110 combat and DBL-210 persistence; broader parents/dependencies remain partial.

C6 gates existing semantic cast intents against class ranks without selecting or allocating skills. Rank1 preserves authored effects; configurable defaults add10% base damage and poison/power magnitude per extra rank, leaving slow, timing, cooldowns, mana, geometry and durations unchanged. Casts/projectiles snapshot their ranked definition; existing item modifiers, hit rules and baseline mana passive remain intact. Class-bound characters start with locked skills; class assignment remains an explicit domain-state initialization (`createSkillProgression(classId, level)`), without a selector/UI. Existing unclassed characters retain six-skill compatibility; allocating to them requires future explicit class assignment. Planned nodes remain unavailable.

Character schema4 adds strict version1 skill progression/tree metadata, class identity, ranks and budget. Explicit1/2/3 migrations preserve items, loot stream, XP and attributes; old saves gain level−1 unspent skill points and remain unclassed. Invalid budgets, ranks, requirements, class or versions reject the load without replacing the original/backup. Encounter reset, save/restore and attribute allocation retain the skill ledger. Prior C1–C3 descriptions of unimplemented spending/persistence are historical.

Verification:56 focused tests across rewards/allocation, real cast effects, timing, snapshots, saves/migrations, runtime and existing monster/input/item-save contracts; TypeScript, focused lint and formatting pass. No browser UI/input behavior changed, E2E/full regression/loot simulations not run. STOP after C6; await authorization before further class work or skill-tree UI.

## C7–C9 interface (2026-10-18)

Scoped DBL-111/114/204 UI, DBL-004 semantic controller interactions and DBL-210 persistence; broader parents remain partial. Inventory now contains a gothic Skills panel with three discipline browsers, three specialization tabs each, prerequisite connectors, state/rank indicators and a persistent effect inspector showing current/next rank. Icons reuse the original six code-native HUD glyphs; planned nodes use an original geometric placeholder. No external assets or new abilities.

Learning uses the shared allocator verdict, an explicit confirmation and expected-state protection. Keyboard repeat/double clicks cannot spend again; controller cancel, disconnect, blur and device handoff discard pending confirmation. Legacy access stays unchanged until a separately confirmed permanent skill discipline is chosen. This changes skill access only, retaining existing attributes/items; no respec or automatic class-stat conversion.

Learned active abilities can be assigned to six existing semantic skillbar actions. Schema4 accepts an optional validated six-slot `bar` inside skill progression; older schema4 records need no rewrite, legacy defaults retain the original six bindings and class-bound empty slots remain unusable. Assignment, load and activation validate unlocks through domain functions. Existing save/recovery mechanisms persist ranks and assignments.

Verification:33 focused unit tests;8 targeted Chromium cases across skill UI and affected character save/migration flows; TypeScript, relevant lint/format and production build pass. Reviewed desktop/narrow screenshots. Xbox/PlayStation tests use virtual browser controllers, not physical hardware. Planned branch nodes remain unavailable; physical hardware and broader parents remain open. STOP after C9; no new effects, respec, campaign or vendors.

## C10–C11 combat foundation (2026-10-18)

Scoped DBL-110/112/113: class variants preserve the six original unclassed abilities. Warrior Iron Fan becomes a heavy single-target melee strike using existing guarded stagger; Oath Echo adds armor while empowered. Sorcerer retains Ember Lance/Rime Ring. Ranger Briar Edge becomes a precise poison projectile; Storm Thread becomes a physical projectile piercing up to3 distinct targets, referenced by the existing Precision foundation node. Existing node IDs, schema4 and saved ranks remain valid; no permanent switching/migration.

Configurable damage scaling:2.5% per Strength/Energy/Dexterity point for the respective class, using the existing modifier aggregator and shared attribute authority. Rank3 starter pairs cost6 of11 points at level12. Warrior passive:4 armor/Arms rank; buff:40+10 armor/Resolve rank. Sorcerer passive:0.5 mana/second/Ember rank, in addition to baseline regeneration; existing Energy→mana remains. Ranger passive:8 accuracy/Wilds rank; precise attacks cannot miss or crit. Synergies add5% per supporting rank: empowered Warrior Iron Fan; Sorcerer Ember Lance against slow; Ranger Storm Thread against poison. Direct skills only, never DoT/procs. Stable modifier identities, fresh baselines and per-projectile victim ledgers prevent compounding/recursive/duplicate hits. Synergy precision is normalized to six decimals before existing integer damage flooring. Gear, resistances, hitstun guard and cooldown rules remain in place.

59 focused unit tests and TypeScript/relevant lint pass. C12 developer browser integration/evidence follows separately; provisional balance, no full regression or loot simulations.

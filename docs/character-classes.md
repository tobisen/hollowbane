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

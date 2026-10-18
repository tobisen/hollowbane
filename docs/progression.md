# Character progression — P1–P9

The character sheet opens inside Inventory (V / View). Expand Character to inspect
XP, innate/allocated attributes and the same derived totals used by combat. +1
buttons spend one earned point; repeated key events, double-click duplicates and
stale requests cannot replay an allocation. No respec or skill points.

Normal new characters start at level1, zero XP/attributes. The separate item
laboratory starts at40. Each advancement costs100 × current level² XP and grants5
attribute points, through99 (490 total points). Monster base XP remains provisional:
melee/ranged/flanker25, caster35, support30, tank40; champions share the base.
Flat coefficients: Strength0.5 physical damage, Dexterity2 accuracy/1 defense,
Vitality5 maximum HP, Energy3 maximum mana. Gear modifiers apply once after these
bonuses. Current HP/mana retain absolute amounts, clamped on maximum decreases.
Frozen item content2–8 keeps its original level minima and zero stat minima;
P6 supports configurable base Strength/Dexterity rules without rewriting items.

Character schema3 stores `xp-v1`, accumulated XP, derived level/next threshold,
starting/allocated attributes, available/spent points and rewarded-level high-water
mark. Validation checks exact fields, safe integers, curve/level consistency,
point conservation and inventory level. Future XP curve changes require a new
curve ID and explicit migration; custom runtime curves cannot be silently saved
as `xp-v1`.

Schema1/2 snapshots validate against their declared item registries first, then
migrate to their existing level's XP threshold with zero allocated attributes and
5 × (level−1) available points. No item, equipment, embedded socket, set/rune data
or loot RNG stream is regenerated. In-memory migration does not overwrite storage;
the next successful save retains the original as the previous checkpoint.
IndexedDB retains its atomic current/previous transaction and stale-tab revision
check. Unsupported/corrupt saves remain available for explicit recovery/export;
rejected loads/imports leave the live character unchanged. XP changes trigger the
existing checkpoint mechanism. Encounter resets retain progression. Combat restarts
on reload: fresh encounter monsters can earn XP again, while loading a snapshot
into the current encounter keeps its consumed-death ledger.

P7/P8: four view/runtime tests then12 focused tests and2 Chromium scenarios; reviewed
1280×800 panel screenshot. P9: shared unit run316 passes and2 outdated schema2
assertion failures; those assertions were updated for schema3 and24 targeted
save/runtime cases pass. Four Chromium scenarios cover panel/keyboard access,
funded allocation and duplicate protection, rejected corrupt import, reload, and
schema1 IndexedDB migration retaining the original backup. Unit coverage includes
schema2 migration with real mixed-content sockets/runes and levels1–99. Physical
controllers, full controller focus/prompt validation and final balance/quality
review remain P10/P11, outside this continuation. No publication claim.

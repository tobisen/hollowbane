import { attributeValues } from "../simulation/attributes";
import type { MonsterExperience } from "../simulation/monster-experience";
import type { DerivedEquipment } from "../simulation/equipment-stats";
/** Present exactly the shared simulated totals; no second stat formula. */
export function characterPanelState(
  xp: MonsterExperience,
  stats: DerivedEquipment,
) {
  const level = xp.character.level;
  const floor = xp.curve[level - 1]!;
  const next = xp.character.nextLevelXp;
  return {
    level,
    totalXp: xp.character.totalXp,
    nextLevelXp: next,
    progress:
      next === null ? 1 : (xp.character.totalXp - floor) / (next - floor),
    attributes: attributeValues(xp.attributes),
    available: xp.attributes.available,
    stats: {
      health: stats.maxHp,
      mana: stats.maxMana,
      damage: stats.offense.damage,
      accuracy: stats.offense.accuracy,
      defense: stats.defense.defense,
      armor: stats.defense.armor,
    },
    resistances: Object.fromEntries(
      ["physical", "fire", "cold", "lightning", "poison", "arcane"].map(
        (element) => [
          element,
          element === "physical"
            ? stats.defense.physicalResistance
            : (stats.defense.resistances?.[element as "fire"] ?? 0),
        ],
      ),
    ),
  };
}

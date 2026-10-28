import type { ClassId } from "../simulation/character-classes";
import type { CharacterInventory } from "../simulation/equipment";
import type { Weapon } from "../simulation/combat";

/** Fixed sword, optional original shield; armor remains cosmetic/static in-world.
 * Fail closed for empty/unknown weapons and future equipment bases.
 */
export function warriorRendererSelection(
  classId: ClassId | null,
  equipment: CharacterInventory["equipment"],
  legacy = false,
  activeWeapon: Weapon = "melee",
): string {
  if (classId !== "warrior") return "other-class";
  if (legacy) return "debug-legacy";
  if (!equipment.main) return "empty-main-hand";
  if (equipment.main.base !== "ash-blade")
    return `unsupported-weapon:${equipment.main.base}`;
  if (equipment.off && equipment.off.base !== "bark-guard")
    return `unsupported-offhand:${equipment.off.base}`;
  if (activeWeapon !== "melee") return "committed-projectile";
  return equipment.off ? "supported-shield" : "supported";
}

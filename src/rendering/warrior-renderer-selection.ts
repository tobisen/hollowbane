import type { ClassId } from "../simulation/character-classes";
import type { CharacterInventory } from "../simulation/equipment";

/** Fixed sword, empty offhand; armor has always been cosmetic/static in-world.
 * Fail closed for empty/unknown weapons and future equipment bases.
 */
export function warriorRendererSelection(
  classId: ClassId | null,
  equipment: CharacterInventory["equipment"],
  legacy = false,
): string {
  if (classId !== "warrior") return "other-class";
  if (legacy) return "debug-legacy";
  if (!equipment.main) return "empty-main-hand";
  if (equipment.main.base !== "ash-blade")
    return `unsupported-weapon:${equipment.main.base}`;
  if (equipment.off) return `unsupported-offhand:${equipment.off.base}`;
  return "supported";
}

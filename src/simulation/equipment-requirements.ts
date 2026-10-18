import type { AttributeValues } from "./attributes";
import { effectiveRequirement } from "./item-ownership";
import type { GeneratedItem } from "./loot";
export interface EquipmentRequirement {
  readonly level: number;
  readonly strength: number;
  readonly dexterity: number;
}
export interface EquipmentRequirementContext {
  readonly attributes: Pick<AttributeValues, "strength" | "dexterity">;
  readonly rules?: Readonly<Record<string, Partial<EquipmentRequirement>>>;
}
/** Frozen content2–8 declares only level requirements. Stat minima default to0;
 * configurable base rules add requirements without rewriting generated item identity.
 * Only innate/allocated attributes count, preventing self-supporting gear cycles.
 */
export function equipmentRequirement(
  item: GeneratedItem,
  context?: EquipmentRequirementContext,
): EquipmentRequirement {
  const configured = context?.rules?.[item.base];
  const requirement = {
    level: Math.max(effectiveRequirement(item), configured?.level ?? 1),
    strength: configured?.strength ?? 0,
    dexterity: configured?.dexterity ?? 0,
  };
  for (const value of Object.values(requirement))
    if (
      !Number.isSafeInteger(value) ||
      value < 0 ||
      value > Number.MAX_SAFE_INTEGER
    )
      throw new RangeError("Invalid equipment requirement");
  if (requirement.level < 1 || requirement.level > 99)
    throw new RangeError("Invalid requirement level");
  // Validate configured level before max() can hide a negative/fractional override.
  if (
    configured?.level !== undefined &&
    (!Number.isInteger(configured.level) ||
      configured.level < 1 ||
      configured.level > 99)
  )
    throw new RangeError("Invalid configured requirement level");
  return requirement;
}
export function meetsEquipmentRequirements(
  item: GeneratedItem,
  level: number,
  context?: EquipmentRequirementContext,
): boolean {
  const required = equipmentRequirement(item, context);
  const strength = context?.attributes.strength ?? 0,
    dexterity = context?.attributes.dexterity ?? 0;
  if (
    ![level, strength, dexterity].every(Number.isSafeInteger) ||
    level < 1 ||
    level > 99 ||
    strength < 0 ||
    dexterity < 0
  )
    throw new RangeError("Invalid character requirements");
  return (
    level >= required.level &&
    strength >= required.strength &&
    dexterity >= required.dexterity
  );
}

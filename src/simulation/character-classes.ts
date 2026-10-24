import {
  createAttributes,
  attributeValues,
  type AttributeValues,
} from "./attributes";
import { experienceAt } from "./experience";
import type { EquipmentBase } from "./equipment-stats";
import { STARTER_ITEM_CONTENT } from "./item-registry";

export const CLASS_IDS = ["warrior", "sorcerer", "ranger"] as const;
export type ClassId = (typeof CLASS_IDS)[number];
export interface ClassDefinition {
  readonly id: ClassId;
  readonly name: string;
  readonly identity: string;
  readonly attributes: AttributeValues;
  /** Base resources before the shared attribute/equipment calculation. */
  readonly health: number;
  readonly mana: number;
  readonly starterWeapon: string;
}
export const CLASS_CONTENT_VERSION = 2;
export function validateClasses(
  data: readonly ClassDefinition[],
): readonly ClassDefinition[] {
  if (data.length !== CLASS_IDS.length)
    throw new Error("Expected three classes");
  const ids = new Set<string>();
  for (const entry of data) {
    if (
      !CLASS_IDS.includes(entry.id) ||
      ids.has(entry.id) ||
      !entry.name.trim() ||
      !entry.identity.trim()
    )
      throw new Error("Invalid class identity");
    ids.add(entry.id);
    createAttributes(entry.attributes);
    const starter = STARTER_ITEM_CONTENT.bases.find(
      (base) => base.id === entry.starterWeapon,
    );
    const category = { warrior: "blade", sorcerer: "staff", ranger: "bow" }[
      entry.id
    ];
    if (
      !starter ||
      starter.category !== category ||
      starter.level !== 1 ||
      starter.requirement > 1 ||
      !STARTER_ITEM_CONTENT.tables.some(
        (table) => table.id === `starter-${starter.id}`,
      )
    )
      throw Error("Invalid class starter weapon");
    for (const resource of [entry.health, entry.mana])
      if (!Number.isSafeInteger(resource) || resource < 1 || resource > 10000)
        throw new Error("Invalid class resource");
  }
  return Object.freeze(
    data.map((entry) =>
      Object.freeze({
        ...entry,
        attributes: Object.freeze({ ...entry.attributes }),
      }),
    ),
  );
}
/** Class foundations and creation-only equipment; never applied to loaded saves. */
export const CHARACTER_CLASSES = validateClasses([
  {
    id: "warrior",
    name: "Warrior",
    identity: "Close-range martial resilience",
    attributes: { strength: 8, dexterity: 3, vitality: 7, energy: 2 },
    health: 120,
    mana: 60,
    starterWeapon: "ash-blade",
  },
  {
    id: "sorcerer",
    name: "Sorcerer",
    identity: "Elemental ranged spellcasting",
    attributes: { strength: 2, dexterity: 3, vitality: 4, energy: 11 },
    health: 80,
    mana: 120,
    starterWeapon: "cinder-staff",
  },
  {
    id: "ranger",
    name: "Ranger",
    identity: "Precision and wilderness technique",
    attributes: { strength: 4, dexterity: 9, vitality: 5, energy: 2 },
    health: 100,
    mana: 80,
    starterWeapon: "reed-bow",
  },
]);
/** Reuses the one XP/attribute engine; resource bonuses are applied by deriveEquipment. */
export function createClassFoundation(
  definition: ClassDefinition,
  totalXp = 0,
) {
  validateClasses(
    CHARACTER_CLASSES.map((entry) =>
      entry.id === definition.id ? definition : entry,
    ),
  );
  if (!CLASS_IDS.includes(definition.id)) throw new Error("Unknown class");
  const experience = experienceAt(totalXp);
  const attributes = createAttributes(definition.attributes, experience.level);
  return { experience, attributes };
}
export function classEquipmentBase(
  definition: ClassDefinition,
  base: EquipmentBase,
  totalXp = 0,
): EquipmentBase {
  const foundation = createClassFoundation(definition, totalXp);
  return {
    ...base,
    health: definition.health,
    mana: definition.mana,
    attributes: attributeValues(foundation.attributes),
  };
}

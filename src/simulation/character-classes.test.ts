import { describe, expect, it } from "vitest";
import {
  CHARACTER_CLASSES,
  createClassFoundation,
  validateClasses,
  classEquipmentBase,
} from "./character-classes";
import { attributeValues, attributeBonuses } from "./attributes";
import { DEFAULT_XP_CURVE } from "./experience";
import { captureEquipmentBase, deriveEquipment } from "./equipment-stats";
import { createCombat } from "./combat";
import { createCharacterInventory } from "./equipment";
describe("class foundations", () => {
  it("uses shared XP, point budgets and equipment formulas for all classes", () => {
    const base = captureEquipmentBase(createCombat().actors[0]!);
    for (const definition of CHARACTER_CLASSES) {
      const foundation = createClassFoundation(
        definition,
        DEFAULT_XP_CURVE[11]!,
      );
      expect(foundation.experience.level).toBe(12);
      expect(foundation.attributes.available).toBe(55);
      expect(attributeValues(foundation.attributes)).toEqual(
        definition.attributes,
      );
      const result = deriveEquipment(
        createCharacterInventory(),
        classEquipmentBase(definition, base),
      );
      const bonuses = attributeBonuses(definition.attributes);
      expect(result.maxHp).toBe(definition.health + bonuses.health);
      expect(result.maxMana).toBe(definition.mana + bonuses.mana);
      expect(createClassFoundation(definition, 100)).toEqual(
        createClassFoundation(definition, 100),
      );
    }
  });
  it("validates configuration and owns starting values", () => {
    const copy = structuredClone(CHARACTER_CLASSES);
    const result = validateClasses(copy);
    expect(result[0]).not.toBe(copy[0]);
    expect(Object.isFrozen(result[0]!.attributes)).toBe(true);
    for (const patch of [
      { health: 0 },
      { mana: Infinity },
      { identity: "" },
      { attributes: { strength: -1, dexterity: 0, vitality: 0, energy: 0 } },
    ])
      expect(() =>
        validateClasses([{ ...copy[0]!, ...patch }, ...copy.slice(1)]),
      ).toThrow();
    expect(() => validateClasses([copy[0]!, copy[0]!, copy[2]!])).toThrow();
  });
});

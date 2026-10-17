import { it, expect } from "vitest";
import { ITEM_CONTENT, EQUIPMENT_CONTENT } from "./item-content";
import { generateLoot } from "./loot";
import {
  equipmentDefinition,
  validateEquipmentContent,
} from "./equipment-content";
import { validateGeneratedItem } from "./item-save";
it("preserves legacy2 rolls while supporting explicit3 equipment categories", () => {
  expect(ITEM_CONTENT.version).toBe(2);
  expect(ITEM_CONTENT.bases).toHaveLength(8);
  expect(EQUIPMENT_CONTENT.bases).toHaveLength(11);
  const i = generateLoot({
    seed: 42,
    sequence: 5634,
    areaLevel: 12,
    monsterLevel: 12,
    table: "court",
  })!;
  expect(i.name).toBe("Last Coal");
  expect(i.stats).toEqual({ damage: 16, fireResistance: 15 });
  for (let sequence = 0; sequence < 100; sequence++) {
    const i = generateLoot(
      {
        seed: 42,
        sequence,
        areaLevel: 12,
        monsterLevel: 12,
        table: "reliquary",
      },
      EQUIPMENT_CONTENT,
    );
    if (i) {
      expect(validateGeneratedItem(i)).toEqual(i);
      expect(equipmentDefinition(i).width).toBeGreaterThan(0);
    }
  }
});
it("validates complete bounded footprints and two-hand slot restrictions", () => {
  const d = EQUIPMENT_CONTENT.bases.map((b) =>
    equipmentDefinition({ base: b.id, contentVersion: 3 }),
  );
  expect(validateEquipmentContent(d, EQUIPMENT_CONTENT)).toHaveLength(11);
  expect(() =>
    validateEquipmentContent(d.slice(1), EQUIPMENT_CONTENT),
  ).toThrow();
  d[0] = { ...d[0]!, width: 0 };
  expect(() => validateEquipmentContent(d, EQUIPMENT_CONTENT)).toThrow();
});

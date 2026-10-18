import { expect, it } from "vitest";
import { ADVANCED_ITEMS } from "./advanced-item-content";
import { ADVANCED_CONTENT } from "./item-registry";
import { generateLoot, type GeneratedItem } from "./loot";
import {
  serializeItems,
  validateGeneratedItem,
  identifyItem,
} from "./item-save";
import { simulateLoot } from "./loot-diagnostics";
import { createCharacterInventory, validateCharacter } from "./equipment";
import { equipmentModifiers } from "./equipment-modifiers";
import { serializeCharacter } from "./inventory-save";
import { createLootWorld } from "./world-loot";
import { equipmentDefinition } from "./equipment-content";
const context = { seed: 42, monsterLevel: 12, areaLevel: 12, table: "sanctum" };
const found = new Map<string, GeneratedItem>();
for (let sequence = 0; sequence < 1000000 && found.size < 24; sequence++) {
  const item = generateLoot({ ...context, sequence }, ADVANCED_CONTENT);
  if (item?.advanced) found.set(item.unique ?? item.advanced.set!.piece, item);
}
it("generates every original unique and set piece with replayable controlled modifiers", () => {
  const ids = [
    ...ADVANCED_ITEMS.uniques.map((u) => u.id),
    ...ADVANCED_ITEMS.sets.flatMap((s) => s.pieces.map((p) => p.id)),
  ];
  expect(ids).toHaveLength(24);
  for (const id of ids) {
    const item = found.get(id)!;
    expect(item, id).toBeDefined();
    expect(validateGeneratedItem(item)).toEqual(item);
    expect(item.id).toMatch(/^l4-/);
    expect(item.identified).toBe(false);
    expect(item.advanced?.modifiers.every((m) => m.source === item.id)).toBe(
      true,
    );
    const known = identifyItem(item);
    expect(known).toEqual({ ...item, identified: true });
    const changed = structuredClone(known);
    changed.advanced!.modifiers.pop();
    expect(() => validateGeneratedItem(changed)).toThrow();
  }
});
it("activates cumulative equipped thresholds and removes them without compounding or RNG", () => {
  const c = createCharacterInventory();
  const set = ADVANCED_ITEMS.sets[0]!;
  for (const piece of set.pieces) {
    const item = identifyItem(found.get(piece.id)!);
    const slot = equipmentDefinition(item).slots[0]!;
    c.equipment[slot] = item;
  }
  validateCharacter(c);
  const first = equipmentModifiers(c);
  expect(first.active.map((a) => a.required)).toEqual([2, 3, 4]);
  expect(equipmentModifiers(c)).toEqual(first);
  delete c.equipment.boots;
  expect(equipmentModifiers(c).active.map((a) => a.required)).toEqual([2, 3]);
  c.grid.items.push({
    item: identifyItem(found.get(set.pieces[3]!.id)!),
    x: 0,
    y: 0,
  });
  expect(equipmentModifiers(c).active.map((a) => a.required)).toEqual([2, 3]);
  c.equipment.helmet!.identified = false;
  expect(equipmentModifiers(c).active.map((a) => a.required)).toEqual([2]);
});
it("reports modern set rarity separately and respects expected conditional distributions", () => {
  const report = simulateLoot(context, 25000, ADVANCED_CONTENT);
  expect(report.distributionValid).toBe(true);
  expect(report.quality.set).toBeGreaterThan(0);
  expect(report.expectedConditionalQuality.set).toBeGreaterThan(0);
  expect(report.invalidItems).toBe(0);
});

it("rejects modern items in legacy save envelopes until an explicit migration exists", () => {
  const item = [...found.values()][0]!;
  expect(() => serializeItems([item])).toThrow(/versioned character/);
  const character = createCharacterInventory();
  character.grid.items.push({ item, x: 0, y: 0 });
  expect(() =>
    serializeCharacter({ character, loot: createLootWorld(42) }),
  ).toThrow(/Unsupported content registry/);
});

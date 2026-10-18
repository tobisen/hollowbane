import { expect, it } from "vitest";
import {
  ADVANCED_CONTENT,
  registeredItemContent,
  ADVANCED_GENERATION,
} from "./item-registry";
import {
  ITEM_CONTENT,
  EQUIPMENT_CONTENT,
  itemContentForVersion,
} from "./item-content";
import { generateLoot } from "./loot";
it("adds explicit version4 content without mutating version2/3 registries", () => {
  expect(registeredItemContent(2)).toBe(ITEM_CONTENT);
  expect(registeredItemContent(3)).toBe(EQUIPMENT_CONTENT);
  expect(registeredItemContent(4)).toBe(ADVANCED_CONTENT);
  expect(EQUIPMENT_CONTENT.uniques).toEqual(ITEM_CONTENT.uniques);
  expect(ADVANCED_CONTENT.uniques).toHaveLength(
    ITEM_CONTENT.uniques.length + 12,
  );
  expect(EQUIPMENT_CONTENT.tables.some((t) => t.id === "sanctum")).toBe(false);
  expect(ADVANCED_CONTENT.tables.some((t) => t.id === "sanctum")).toBe(true);
  expect(ADVANCED_GENERATION.setFromRareBasisPoints).toBe(2500);
  expect(() => registeredItemContent(1)).toThrow();
  expect(() => registeredItemContent(99)).toThrow();
  expect(() => itemContentForVersion(4)).toThrow(); // Frozen legacy API remains explicit.
});
it("retains legacy unique seed identity and rolled attributes exactly", () => {
  const context = {
    seed: 42,
    sequence: 5634,
    areaLevel: 12,
    monsterLevel: 12,
    table: "court",
  };
  const before = generateLoot(context, ITEM_CONTENT),
    after = generateLoot(context, registeredItemContent(2));
  expect(JSON.stringify(after)).toBe(JSON.stringify(before));
  expect(after?.unique).toBe("last-coal");
  expect(after?.id).toBe("l2-2a-1602");
  expect(after?.stats).toEqual({ damage: 16, fireResistance: 15 });
});

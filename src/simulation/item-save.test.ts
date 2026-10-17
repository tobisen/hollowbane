import { it, expect } from "vitest";
import { generateLoot } from "./loot";
import {
  deserializeItems,
  serializeItems,
  identifyItem,
  inspectItem,
  validateGeneratedItem,
} from "./item-save";
function fixture() {
  for (let sequence = 0; sequence < 1000; sequence++) {
    const i = generateLoot({
      seed: 42,
      sequence,
      monsterLevel: 15,
      areaLevel: 12,
      table: "court",
    });
    if (i && i.quality !== "normal") return i;
  }
  throw Error("fixture");
}
it("identifies immutably without rerolling and hides unknown stats", () => {
  const item = fixture(),
    known = identifyItem(item);
  expect(item.identified).toBe(false);
  expect(inspectItem(item).stats).toBeNull();
  expect({ ...known, identified: false }).toEqual(item);
  expect(identifyItem(known)).toEqual(known);
  expect(inspectItem(known).stats).toEqual(item.stats);
});
it("roundtrips reordered fields and rejects forged attributes or unknown fields", () => {
  const i = fixture();
  expect(deserializeItems(serializeItems([i]))).toEqual([i]);
  expect(validateGeneratedItem({ ...i })).toEqual(i);
  for (const v of [
    { ...i, schema: 2 },
    { ...i, stats: { damage: 999 } },
    { ...i, name: "Forgery" },
    { ...i, extra: 1 },
    { ...i, origin: { ...i.origin, sequence: Infinity } },
  ])
    expect(() => validateGeneratedItem(v)).toThrow();
});
it("fails atomically for unsupported malformed oversized duplicate archives", () => {
  const i = fixture();
  for (const text of [
    "{",
    "null",
    JSON.stringify({ schema: 2, contentVersion: 1, items: [] }),
    JSON.stringify({
      schema: 1,
      contentVersion: 1,
      items: [i, { ...i, stats: { life: 1 } }],
    }),
    " ".repeat(524289),
  ])
    expect(() => deserializeItems(text)).toThrow();
  expect(() => serializeItems([i, i])).toThrow();
  expect(
    deserializeItems(serializeItems([identifyItem(i)]))[0]?.identified,
  ).toBe(true);
});

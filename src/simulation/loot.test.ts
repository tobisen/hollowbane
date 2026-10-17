import { it, expect } from "vitest";
import { ITEM_CONTENT } from "./item-content";
import { generateLoot, weighted } from "./loot";
const context = {
  seed: 42,
  sequence: 0,
  monsterLevel: 15,
  areaLevel: 12,
  table: "court",
};
it("replays exact items with independent streams including seed zero", () => {
  for (let sequence = 0; sequence < 100; sequence++) {
    const c = { ...context, seed: 0, sequence };
    expect(generateLoot(c)).toEqual(generateLoot(c));
  }
  expect(() => generateLoot({ ...context, seed: NaN })).toThrow();
  expect(() => generateLoot({ ...context, table: "missing" })).toThrow();
});
it("weights honor zero entries and reject unsafe tables", () => {
  expect(
    weighted(
      [0, 4],
      (x) => x,
      () => 0,
    ),
  ).toBe(4);
  expect(() =>
    weighted(
      [],
      () => 1,
      () => 0,
    ),
  ).toThrow();
});
it("level gates, unique fallback and affix incompatibilities hold across many rolls", () => {
  let found = 0;
  for (let sequence = 0; sequence < 10000; sequence++) {
    const item = generateLoot({ ...context, sequence });
    if (!item) continue;
    found++;
    const affixes = item.affixes.map((a) =>
      ITEM_CONTENT.affixes.find((x) => x.id === a.id)!,
    );
    expect(new Set(affixes.map((a) => a.group)).size).toBe(affixes.length);
    for (const a of affixes) {
      expect(a.categories).toContain(
        ITEM_CONTENT.bases.find((b) => b.id === item.base)!.category,
      );
      expect(item.level).toBeGreaterThanOrEqual(a.minLevel);
      expect(item.level).toBeLessThanOrEqual(a.maxLevel);
      expect(affixes.some((b) => a.excludes.includes(b.group))).toBe(false);
    }
    if (item.quality === "unique")
      expect(
        ITEM_CONTENT.uniques.some(
          (u) => u.id === item.unique && u.level <= item.level,
        ),
      ).toBe(true);
  }
  expect(found).toBeGreaterThan(3000);
  expect(found).toBeLessThan(4000);
});
it("uses monster, area and table levels and configurable quality without rarity inflation", () => {
  const d = structuredClone(ITEM_CONTENT);
  d.tables[0]!.chance = 10000;
  d.tables[0]!.quality = { normal: 0, magic: 0, rare: 0, unique: 1 };
  d.tables[0]!.bases = [{ id: "ash-blade", weight: 1 }];
  expect(
    generateLoot({ ...context, monsterLevel: 1, areaLevel: 1 }, d)?.quality,
  ).toBe("rare");
  expect(
    generateLoot({ ...context, monsterLevel: 1, areaLevel: 8 }, d)?.unique,
  ).toBe("last-coal");
  expect(generateLoot({ ...context, monsterLevel: 99 }, d)?.level).toBe(99);
});
it("nearby seeds produce distinct early encounters with expected drop rate", () => {
  let count = 0;
  const patterns = new Set<string>();
  for (let seed = 0; seed < 1000; seed++) {
    let pattern = "";
    for (let sequence = 0; sequence < 30; sequence++) {
      const i = generateLoot({ ...context, seed, sequence });
      if (i) count++;
      pattern += i ? "1" : "0";
    }
    patterns.add(pattern);
  }
  expect(count).toBeGreaterThan(9900);
  expect(count).toBeLessThan(11100);
  expect(patterns.size).toBeGreaterThan(900);
});

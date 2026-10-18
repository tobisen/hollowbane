import { expect, it } from "vitest";
import { ADVANCED_EXAMPLES } from "./advanced-item-examples";
import { ADVANCED_CONTENT } from "./item-registry";
import { generateLoot } from "./loot";
import { identifyItem } from "./item-save";
import { describeAdvancedItem } from "./item-description";
const example = (id: string) =>
  generateLoot(
    {
      seed: 42,
      sequence: ADVANCED_EXAMPLES[id]!,
      areaLevel: 12,
      monsterLevel: 12,
      table: "sanctum",
    },
    ADVANCED_CONTENT,
  )!;
it("replays all 24 developer examples without leaking unidentified modifiers", () => {
  expect(Object.keys(ADVANCED_EXAMPLES)).toHaveLength(24);
  for (const id of Object.keys(ADVANCED_EXAMPLES)) {
    const item = example(id),
      before = structuredClone(item);
    expect(item.unique ?? item.advanced?.set?.piece).toBe(id);
    expect(describeAdvancedItem(item)).toBe("");
    expect(describeAdvancedItem(identifyItem(item)).length).toBeGreaterThan(10);
    expect(item).toEqual(before);
  }
});
it("describes actual equipped distinct pieces, cumulative activation and removal", () => {
  const items = ["watch-hands", "watch-brow", "watch-coat", "watch-tread"].map(
    (id) => identifyItem(example(id)),
  );
  const full = describeAdvancedItem(items[0]!, items);
  expect(full).toContain("Ashen Watch · 4/4 equipped");
  expect(full).toContain("ACTIVE 4-piece bonus");
  expect(full).toContain("10% on hit (weapon): 12 fire damage");
  const partial = describeAdvancedItem(items[0]!, items.slice(0, 2));
  expect(partial).toContain("ACTIVE 2-piece bonus");
  expect(partial).toContain("Inactive 3-piece bonus");
  expect(describeAdvancedItem(items[0]!, [items[0]!, items[0]!])).toContain(
    "1/4 equipped",
  );
});

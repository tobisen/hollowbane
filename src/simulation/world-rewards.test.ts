import { expect, it } from "vitest";
import { configureWorldRewards } from "./world-rewards";
import { createLootWorld } from "./world-loot";
import { inventoryItem } from "./inventory-test-helper";
it("scales future rolls by area while preserving the global stream, table, parked ownership and death ledger", () => {
  const loot = createLootWorld(123);
  loot.sequence = 27;
  loot.table = "sanctum";
  loot.reserved = ["parked-item"];
  loot.deaths.add(2000);
  const item = inventoryItem("ash-blade");
  loot.drops.push({ item, position: { x: 0, y: 0 }, tick: 1, source: 2000 });
  const drops = loot.drops,
    deaths = loot.deaths;
  for (const [area, level] of [
    ["haunted-forest", 1],
    ["forgotten-graveyard", 3],
    ["ancient-crypt", 5],
    ["ashen-refuge", 1],
  ] as const) {
    configureWorldRewards(loot, area);
    expect([loot.areaLevel, loot.monsterLevel]).toEqual([level, level]);
    expect(loot.seed).toBe(123);
    expect(loot.sequence).toBe(27);
    expect(loot.table).toBe("sanctum");
    expect(loot.drops).toBe(drops);
    expect(loot.drops[0]!.item).toBe(item);
    expect(loot.deaths).toBe(deaths);
    expect(loot.reserved).toEqual(["parked-item"]);
  }
});

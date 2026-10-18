import { it, expect } from "vitest";
import { ITEM_LABORATORY_EXAMPLES } from "./item-laboratory-examples";
import { ADVANCED_EXAMPLES } from "./advanced-item-examples";
import { generateLoot } from "./loot";
import { registeredItemContent } from "./item-registry";
import { SOCKET_CONTENT } from "./socket-content";
it("replays all frozen component and socket host examples without searching or collisions", () => {
  const ids = new Set<string>();
  expect(ITEM_LABORATORY_EXAMPLES).toHaveLength(30);
  for (const e of ITEM_LABORATORY_EXAMPLES) {
    const i = generateLoot(
      {
        seed: e.seed,
        sequence: e.sequence,
        areaLevel: e.level,
        monsterLevel: e.level,
        table: e.table,
      },
      registeredItemContent(e.version),
    )!;
    expect(i.base).toBe(e.base);
    expect(i.quality).toBe("normal");
    expect(ids.has(i.id)).toBe(false);
    ids.add(i.id);
    if (e.table === "sanctum")
      expect(i.socketCapacity).toBe(
        e.base === "ash-blade" ? 2 : SOCKET_CONTENT.hosts[e.base]!.limit,
      );
  }
});
it("preserves original unique/set replay identities under the original registry", () => {
  for (const [identity, sequence] of Object.entries(ADVANCED_EXAMPLES)) {
    const i = generateLoot(
      { seed: 42, sequence, areaLevel: 12, monsterLevel: 12, table: "sanctum" },
      registeredItemContent(4),
    )!;
    expect(i.unique ?? i.advanced?.set?.piece).toBe(identity);
  }
});

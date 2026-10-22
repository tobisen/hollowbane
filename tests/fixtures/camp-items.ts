import { generateLoot, type GeneratedItem } from "../../src/simulation/loot";
import { SOCKET_ITEM_CONTENT } from "../../src/simulation/item-registry";
import { identifyItem } from "../../src/simulation/item-save";
/** Explicit replay-valid test stock; no live game mutation or production hook. */
export function socketedCampItem(): GeneratedItem {
  const find = (base: string) => {
    for (let sequence = 0; sequence < 10000; sequence++) {
      const item = generateLoot(
        {
          seed: 84,
          sequence,
          areaLevel: 24,
          monsterLevel: 24,
          table: base.includes("gem") ? "gem-cache" : "sanctum",
        },
        SOCKET_ITEM_CONTENT,
      );
      if (
        item?.base === base &&
        (base.includes("gem") || (item.socketCapacity ?? 0) > 0)
      )
        return identifyItem(item);
    }
    throw Error("Missing socketed camp fixture");
  };
  const host = find("ash-blade");
  host.embedded = [find("fire-gem-1")];
  return host;
}

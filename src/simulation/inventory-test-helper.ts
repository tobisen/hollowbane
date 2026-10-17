import { generateLoot, type GeneratedItem } from "./loot";
import { itemContentForVersion } from "./item-content";
import { identifyItem } from "./item-save";
export function inventoryItem(
  base: string,
  start = 0,
  version = 3,
): GeneratedItem {
  for (let sequence = start; sequence < start + 100000; sequence++) {
    const i = generateLoot(
      {
        seed: 42,
        sequence,
        areaLevel: 12,
        monsterLevel: 12,
        table: version === 2 ? "court" : "reliquary",
      },
      itemContentForVersion(version),
    );
    if (i?.base === base) return identifyItem(i);
  }
  throw Error("Missing item fixture");
}

import { registeredItemContent } from "./item-registry";
import { generateLoot, type GeneratedItem } from "./loot";
import { identifyItem } from "./item-save";
/** Deterministic developer/test fixture discovery; never called in the frame loop. */
export function advancedItem(
  base: string,
  options: {
    version?: number;
    seed?: number;
    level?: number;
    start?: number;
    accept?: (item: GeneratedItem) => boolean;
  } = {},
): GeneratedItem {
  const version = options.version ?? 8,
    content = registeredItemContent(version);
  const table = base.startsWith("sigil-")
    ? "sigil-cache"
    : base.includes("-gem-")
      ? "gem-cache"
      : version === 2
        ? "court"
        : version === 3
          ? "reliquary"
          : "sanctum";
  for (let sequence = options.start ?? 0; sequence < 1000000; sequence++) {
    const item = generateLoot(
      {
        seed: options.seed ?? 42,
        sequence,
        areaLevel: options.level ?? 40,
        monsterLevel: options.level ?? 40,
        table,
      },
      content,
    );
    if (item?.base === base && (!options.accept || options.accept(item)))
      return identifyItem(item);
  }
  throw Error(`No deterministic fixture for ${base}`);
}

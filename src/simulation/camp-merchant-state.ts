import { generateLoot, type GeneratedItem } from "./loot";
import { itemContentForVersion } from "./item-content";
import { identifyItem } from "./item-save";

/** Original finite camp stock. Prices are gold, with no restock or buyback. */
export const MERCHANT_PRICES: Readonly<Record<string, number>> = {
  "ash-blade": 60,
  "reed-bow": 60,
  "cinder-staff": 60,
  "woven-coat": 50,
  "trail-boots": 30,
};
export const MERCHANT_OFFERS = Object.keys(MERCHANT_PRICES);
export const MERCHANT_SALE_LIMIT = 2048;
export interface MerchantState {
  version: 1;
  revision: number;
  purchased: string[];
  /** Includes embedded components; sold identities never re-enter the loot stream. */
  retired: string[];
}
export function newMerchantState(): MerchantState {
  return { version: 1, revision: 0, purchased: [], retired: [] };
}
export function validateMerchantState(value: unknown): MerchantState {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Invalid merchant state");
  const s = value as Record<string, unknown>;
  if (
    Object.keys(s).sort().join() !== "purchased,retired,revision,version" ||
    s.version !== 1 ||
    !Number.isSafeInteger(s.revision) ||
    (s.revision as number) < 0 ||
    !Array.isArray(s.purchased) ||
    s.purchased.length > MERCHANT_OFFERS.length ||
    s.purchased.some((id) => !MERCHANT_OFFERS.includes(id)) ||
    new Set(s.purchased).size !== s.purchased.length ||
    !Array.isArray(s.retired) ||
    s.retired.length > MERCHANT_SALE_LIMIT ||
    s.retired.some(
      (id) =>
        typeof id !== "string" ||
        !/^l[2-8]-[0-9a-f]{1,8}-[0-9a-f]{1,8}$/.test(id),
    ) ||
    new Set(s.retired).size !== s.retired.length ||
    (s.revision as number) < s.purchased.length + (s.retired.length ? 1 : 0)
  )
    throw Error("Invalid merchant ledger; original retained");
  return {
    version: 1,
    revision: s.revision as number,
    purchased: [...s.purchased] as string[],
    retired: [...s.retired] as string[],
  };
}
const stock = new Map<string, GeneratedItem>();
/** Separate pinned content3 stream; no simulation RNG or world loot sequence consumed. */
export function merchantItem(offer: string): GeneratedItem {
  if (!MERCHANT_OFFERS.includes(offer)) throw Error("Unknown merchant offer");
  if (!stock.has(offer)) {
    for (let sequence = 0; sequence < 4096; sequence++) {
      const item = generateLoot(
        {
          seed: 0x4d455243,
          sequence,
          areaLevel: offer === "cinder-staff" ? 3 : 1,
          monsterLevel: 1,
          table: "reliquary",
        },
        itemContentForVersion(3),
      );
      if (item?.base === offer && item.quality === "normal") {
        stock.set(offer, identifyItem(item));
        break;
      }
    }
  }
  const item = stock.get(offer);
  if (!item) throw Error("Merchant stock has no valid deterministic roll");
  return structuredClone(item);
}
/** Bounded sale prices. A purchased normal item sells for at most half its cost. */
export function merchantSalePrice(item: GeneratedItem): number {
  const quality = { normal: 1, magic: 2, rare: 3, unique: 4, set: 4 }[
    item.quality
  ];
  return Math.min(
    1000,
    Math.max(
      1,
      Math.floor(
        ((MERCHANT_PRICES[item.base] ?? 20) *
          quality *
          (1 + Math.min(item.level, 99) / 99)) /
          4,
      ),
    ),
  );
}

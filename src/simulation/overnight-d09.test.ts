import { expect, it } from "vitest";
import { tradeWithMerchant, type MerchantIntent } from "./camp-merchant";
import {
  MERCHANT_OFFERS,
  MERCHANT_PRICES,
  merchantItem,
  merchantSalePrice,
  newMerchantState,
  validateMerchantState,
} from "./camp-merchant-state";
import {
  createInventorySession,
  validateSession,
  type InventorySession,
} from "./inventory-world";
import { WorldSession } from "./world-session";
import {
  serializeCharacter,
  deserializeCharacter,
  inspectSnapshots,
  snapshotChecksum,
} from "./inventory-save";
import { validateGeneratedItem } from "./item-save";
import { inventoryItem } from "./inventory-test-helper";
import { generateLoot, type GeneratedItem } from "./loot";
import { SOCKET_ITEM_CONTENT } from "./item-registry";
import { identifyItem } from "./item-save";
import { placeLoot } from "./world-loot";
import { ARENA_NAV } from "./combat";

/** Domain cases use the retained static layout; generated-world persistence has its own case below. */
function fixture(gold = 500, layoutVersion = 1): InventorySession {
  const s = createInventorySession(900);
  const world = new WorldSession(undefined, 42, layoutVersion);
  s.exploration = world.capture({ x: 1, y: 3 }, s.loot);
  s.exploration.containers!.gold = gold;
  return s;
}
function intent(
  s: InventorySession,
  kind: "buy" | "sell",
  id: string,
): MerchantIntent {
  return {
    kind,
    id,
    expectedRevision: s.character.revision,
    expectedMerchantRevision: s.exploration?.merchant?.revision ?? 0,
  };
}
function trade(s: InventorySession, kind: "buy" | "sell", id: string) {
  const result = tradeWithMerchant(s, intent(s, kind, id));
  if (!result.ok) throw Error(result.reason);
  return result.value;
}
function rejected(
  s: InventorySession,
  action: MerchantIntent,
  match: RegExp,
  alive = true,
  idle = true,
) {
  const before = structuredClone(s);
  const result = tradeWithMerchant(s, action, alive, idle);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.reason).toMatch(match);
  expect(s).toEqual(before);
}
it("offers are finite original replay-valid stock, with deterministic identities and loss-making resale", () => {
  const items = MERCHANT_OFFERS.map(merchantItem);
  expect(items).toHaveLength(5);
  expect(new Set(items.map((i) => i.id)).size).toBe(5);
  for (const item of items) {
    expect(validateGeneratedItem(item)).toEqual(item);
    expect(merchantItem(item.base)).toEqual(item);
    expect(item.identified).toBe(true);
    expect(merchantSalePrice(item)).toBeLessThan(MERCHANT_PRICES[item.base]!);
  }
  items[0]!.stats.damage = 999;
  expect(merchantItem(MERCHANT_OFFERS[0]!).stats.damage).not.toBe(999);
});
it("buys and sells atomically through real save/reload without repeated stock, duplicate gold or consuming loot RNG", () => {
  const s = fixture();
  const quote = intent(s, "buy", "ash-blade");
  let bought = trade(s, "buy", "ash-blade");
  expect(s.character.grid.items).toEqual([]);
  expect(s.exploration!.containers!.gold).toBe(500);
  expect(s.exploration!.merchant).toBeUndefined();
  expect(bought.exploration!.containers!.gold).toBe(440);
  expect(bought.character.grid.items[0]!.item).toEqual(
    merchantItem("ash-blade"),
  );
  expect(bought.loot.sequence).toBe(s.loot.sequence);
  rejected(bought, quote, /changed/);
  bought = deserializeCharacter(serializeCharacter(bought));
  rejected(bought, intent(bought, "buy", "ash-blade"), /already purchased/);
  const item = bought.character.grid.items[0]!.item;
  const sale = intent(bought, "sell", item.id);
  const sold = trade(bought, "sell", item.id);
  expect(sold.exploration!.containers!.gold).toBe(
    440 + merchantSalePrice(item),
  );
  expect(sold.exploration!.merchant!.retired).toEqual([item.id]);
  expect(sold.character.grid.items).toEqual([]);
  const loaded = deserializeCharacter(serializeCharacter(sold));
  expect(loaded.loot.reserved).toContain(item.id);
  rejected(loaded, sale, /changed/);
  rejected(loaded, intent(loaded, "sell", item.id), /backpack/);
  rejected(loaded, intent(loaded, "buy", "ash-blade"), /already purchased/);
});
it("insufficient gold, full capacity, stock collisions, unowned/equipped and unidentified sales retain every half", () => {
  const poor = fixture(0);
  rejected(poor, intent(poor, "buy", "trail-boots"), /Not enough gold/);
  const full = fixture();
  full.character.grid = { columns: 1, rows: 1, items: [] };
  rejected(full, intent(full, "buy", "ash-blade"), /full/);
  const collision = fixture();
  collision.loot.drops.push({
    item: merchantItem("ash-blade"),
    position: { x: 1, y: 3 },
    tick: 0,
    source: -1,
  });
  rejected(collision, intent(collision, "buy", "ash-blade"), /Duplicate/);
  const gear = fixture();
  gear.character.equipment.main = inventoryItem("ash-blade");
  rejected(
    gear,
    intent(gear, "sell", gear.character.equipment.main.id),
    /backpack/,
  );
  rejected(gear, intent(gear, "sell", "not-owned"), /backpack/);
  let item = inventoryItem("copper-band");
  while (item.quality === "normal")
    item = inventoryItem("copper-band", item.origin.sequence + 1);
  item.identified = false;
  gear.character.grid.items.push({ item, x: 0, y: 0 });
  rejected(gear, intent(gear, "sell", item.id), /Identify/);
});
it("stale inventory/merchant quotes, invalid offers, death, active attacks, distance and remote areas reject unchanged", () => {
  const s = fixture();
  rejected(
    s,
    { ...intent(s, "buy", "ash-blade"), expectedRevision: -1 },
    /changed/,
  );
  rejected(
    s,
    { ...intent(s, "buy", "ash-blade"), expectedMerchantRevision: 1 },
    /changed/,
  );
  rejected(s, intent(s, "buy", "__proto__"), /unavailable/);
  rejected(s, intent(s, "buy", "ash-blade"), /safely/, false);
  rejected(s, intent(s, "buy", "ash-blade"), /safely/, true, false);
  const distant = fixture();
  distant.exploration!.position = { x: 0, y: 0 };
  rejected(distant, intent(distant, "buy", "ash-blade"), /safely/);
  const remote = fixture();
  const forest = new WorldSession(undefined, 42, 1, "haunted-forest");
  remote.exploration = forest.capture(
    forest.travel.state.position,
    remote.loot,
  );
  rejected(remote, intent(remote, "buy", "ash-blade"), /safely/);
});
it("gold/revision overflow rejects before item removal or purchase", () => {
  const s = fixture(Number.MAX_SAFE_INTEGER);
  const item = inventoryItem("trail-boots");
  s.character.grid.items.push({ item, x: 0, y: 0 });
  rejected(s, intent(s, "sell", item.id), /Gold limit/);
  s.character.revision = Number.MAX_SAFE_INTEGER;
  rejected(s, intent(s, "buy", "ash-blade"), /revision limit/);
});
it("legacy saves stay byte-stable without merchant state; damaged ledgers offer validated prior recovery", () => {
  const s = fixture(),
    old = serializeCharacter(s);
  expect(serializeCharacter(deserializeCharacter(old))).toBe(old);
  expect(deserializeCharacter(old).exploration!.merchant).toBeUndefined();
  const bought = trade(s, "buy", "trail-boots");
  const good = serializeCharacter(bought);
  const sold = trade(bought, "sell", bought.character.grid.items[0]!.item.id);
  const duplicate = structuredClone(bought);
  duplicate.exploration!.merchant = sold.exploration!.merchant!;
  expect(() => validateSession(duplicate)).toThrow(/Sold item identity/);
  expect(() =>
    validateMerchantState({ ...newMerchantState(), purchased: ["unknown"] }),
  ).toThrow(/merchant/);
  expect(() =>
    validateMerchantState({ ...newMerchantState(), extra: true }),
  ).toThrow(/merchant/);
  const corrupt = JSON.parse(good);
  corrupt.body.exploration.merchant.revision = -1;
  corrupt.checksum = snapshotChecksum(JSON.stringify(corrupt.body));
  const broken = JSON.stringify(corrupt);
  expect(() => deserializeCharacter(broken)).toThrow(/merchant/);
  expect(inspectSnapshots(broken, old).kind).toBe("recoverable");
});
it("selling socketed gear retires every embedded identity and restores none on reload", () => {
  const find = (base: string): GeneratedItem => {
    for (let sequence = 0; sequence < 10000; sequence++) {
      const item = generateLoot(
        {
          seed: 42,
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
    throw Error("Missing socketed merchant fixture");
  };
  const host = find("ash-blade"),
    gem = find("fire-gem-1");
  host.embedded = [gem];
  const s = fixture();
  s.character.grid.items.push({ item: host, x: 0, y: 0 });
  const sold = trade(s, "sell", host.id);
  const loaded = deserializeCharacter(serializeCharacter(sold));
  expect(loaded.exploration!.merchant!.retired).toEqual([host.id, gem.id]);
  expect(loaded.loot.reserved).toEqual(
    expect.arrayContaining([host.id, gem.id]),
  );
  expect(loaded.character.grid.items).toEqual([]);
  rejected(loaded, intent(loaded, "sell", gem.id), /backpack/);
  expect(
    placeLoot(loaded.loot, host, { x: 0, y: 0 }, 0, -1, ARENA_NAV),
  ).toBeNull();
  expect(
    placeLoot(loaded.loot, gem, { x: 0, y: 0 }, 0, -1, ARENA_NAV),
  ).toBeNull();
});
it("generated layout seeds fingerprints and discovery survive the complete merchant checkpoint", () => {
  const s = fixture(500, 2);
  const bought = trade(s, "buy", "trail-boots");
  const loaded = deserializeCharacter(serializeCharacter(bought));
  expect(loaded.exploration!.contentVersion).toBe(2);
  expect(loaded.exploration!.areas).toEqual(s.exploration!.areas);
  expect(loaded.exploration!.visited).toEqual(s.exploration!.visited);
  expect(loaded.exploration!.position).toEqual(s.exploration!.position);
  expect(loaded.exploration!.quests).toEqual(s.exploration!.quests);
  expect(loaded.character.grid.items[0]!.item).toEqual(
    merchantItem("trail-boots"),
  );
  expect(loaded.exploration!.containers!.gold).toBe(470);
  expect(loaded.exploration!.merchant!.purchased).toEqual(["trail-boots"]);
});

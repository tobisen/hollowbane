import { CAMP_NPCS } from "./camp-dialogue";
import {
  merchantItem,
  merchantSalePrice,
  MERCHANT_PRICES,
  MERCHANT_SALE_LIMIT,
  newMerchantState,
  validateMerchantState,
} from "./camp-merchant-state";
import { addGrid, type InventoryResult } from "./inventory-grid";
import {
  reserveOwned,
  validateSession,
  type InventorySession,
} from "./inventory-world";
import { validateGeneratedItem } from "./item-save";
import { itemTree } from "./item-ownership";
import type { AreaId, WorldPoint } from "./world";

export interface MerchantIntent {
  kind: "buy" | "sell";
  id: string;
  expectedRevision: number;
  expectedMerchantRevision: number;
}
export function canTradeAtCamp(
  area: AreaId,
  position: WorldPoint,
  alive: boolean,
  idle: boolean,
): boolean {
  const npc = CAMP_NPCS.find((n) => n.id === "orren-thale")!;
  return (
    area === "ashen-refuge" &&
    alive &&
    idle &&
    [position.x, position.y].every(Number.isFinite) &&
    Math.hypot(position.x - npc.position.x, position.y - npc.position.y) <= 1.2
  );
}
/** Immutable gold/item/ledger transaction; the caller persists the whole candidate atomically. */
export function tradeWithMerchant(
  session: InventorySession,
  intent: MerchantIntent,
  alive = true,
  idle = true,
): InventoryResult<InventorySession> {
  const w = session.exploration;
  if (
    !w ||
    w.version !== 6 ||
    !w.containers ||
    !canTradeAtCamp(w.area, w.position, alive, idle)
  )
    return { ok: false, reason: "Return safely to Orren Thale to trade." };
  try {
    validateSession(session);
    const merchant = validateMerchantState(w.merchant ?? newMerchantState());
    if (
      intent.expectedRevision !== session.character.revision ||
      intent.expectedMerchantRevision !== merchant.revision
    )
      return { ok: false, reason: "Trade changed; select the item again." };
    if (
      session.character.revision >= Number.MAX_SAFE_INTEGER ||
      merchant.revision >= Number.MAX_SAFE_INTEGER
    )
      return { ok: false, reason: "Trade revision limit reached." };
    let gold = w.containers.gold;
    if (!Number.isSafeInteger(gold) || gold < 0)
      throw Error("Invalid gold balance");
    let grid = session.character.grid;
    if (intent.kind === "buy") {
      if (
        !Object.hasOwn(MERCHANT_PRICES, intent.id) ||
        merchant.purchased.includes(intent.id)
      )
        return {
          ok: false,
          reason: "That offer is unavailable or already purchased.",
        };
      const cost = MERCHANT_PRICES[intent.id]!;
      if (gold < cost)
        return { ok: false, reason: "Not enough gold; trade unchanged." };
      const item = merchantItem(intent.id);
      const added = addGrid(grid, item);
      if (!added.ok)
        return { ok: false, reason: "Backpack full; gold and stock retained." };
      grid = added.value;
      gold -= cost;
      merchant.purchased.push(intent.id);
    } else if (intent.kind === "sell") {
      const entry = grid.items.find((e) => e.item.id === intent.id);
      if (!entry)
        return {
          ok: false,
          reason:
            "Only items in your backpack can be sold; unequip gear first.",
        };
      const item = validateGeneratedItem(entry.item);
      if (!item.identified)
        return { ok: false, reason: "Identify the item before selling." };
      const retired = itemTree([item]).map((i) => i.id);
      if (merchant.retired.length + retired.length > MERCHANT_SALE_LIMIT)
        return { ok: false, reason: "Merchant ledger full; item retained." };
      gold += merchantSalePrice(item);
      if (!Number.isSafeInteger(gold))
        return { ok: false, reason: "Gold limit reached; item retained." };
      grid = { ...grid, items: grid.items.filter((e) => e !== entry) };
      merchant.retired.push(...retired);
    } else return { ok: false, reason: "Unknown trade intent." };
    merchant.revision++;
    const candidate = reserveOwned({
      ...session,
      character: {
        ...session.character,
        grid,
        revision: session.character.revision + 1,
      },
      exploration: { ...w, merchant, containers: { ...w.containers, gold } },
    });
    validateSession(candidate);
    return { ok: true, value: candidate };
  } catch (error) {
    return {
      ok: false,
      reason:
        error instanceof Error
          ? error.message
          : "Trade rejected; state unchanged.",
    };
  }
}

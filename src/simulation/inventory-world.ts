import type { ExplorationSnapshot } from "./world-save";
import {
  validateProgression,
  type ProgressionSnapshot,
} from "./progression-save";
import type { EquipmentRequirementContext } from "./equipment-requirements";
import { itemTree } from "./item-ownership";
import {
  createCharacterInventory,
  ownedItems,
  ownedItem,
  equipItem,
  unequipItem,
  validateCharacter,
  type CharacterInventory,
} from "./equipment";
import { addGrid, moveGrid, type InventoryResult } from "./inventory-grid";
import { EQUIP_SLOTS, type EquipSlot } from "./equipment-content";
import {
  createLootWorld,
  canInspectDrop,
  placeLoot,
  type LootWorld,
} from "./world-loot";
import { validateGeneratedItem, identifyItem } from "./item-save";
import { canWalk, type Navigation } from "../world/navigation";
import type { Point } from "../world/isometric";
export interface InventorySession {
  exploration?: ExplorationSnapshot;
  progression?: ProgressionSnapshot;
  /** Runtime rule context, deliberately excluded from item/save identity. */
  requirements?: EquipmentRequirementContext;
  character: CharacterInventory;
  loot: LootWorld;
}
export function createInventorySession(seed = 42): InventorySession {
  const loot = createLootWorld(seed);
  loot.table = "reliquary";
  return { character: createCharacterInventory(), loot };
}
export function reserveOwned(s: InventorySession): InventorySession {
  return {
    ...s,
    character: s.character,
    loot: {
      ...s.loot,
      reserved: itemTree([
        ...ownedItems(s.character),
        ...(s.exploration?.areas.flatMap((a) => a.drops.map((d) => d.item)) ??
          []),
      ]).map((i) => i.id),
    },
  };
}
export function validateSession(s: InventorySession, nav?: Navigation): void {
  if (
    s.progression &&
    validateProgression(s.progression).character.level !== s.character.level
  )
    throw Error("Inventory and progression level mismatch");
  validateCharacter(s.character, s.requirements);
  const all = itemTree([
    ...ownedItems(s.character),
    ...s.loot.drops.map((d) => d.item),
    ...(s.exploration?.areas.flatMap((a) => a.drops.map((d) => d.item)) ?? []),
  ]);
  if (
    s.loot.drops.length > s.loot.capacity ||
    s.loot.capacity < 1 ||
    s.loot.capacity > 128 ||
    new Set(all.map((i) => i.id)).size !== all.length
  )
    throw Error("Duplicate or excessive world items");
  for (const d of s.loot.drops) {
    validateGeneratedItem(d.item);
    if (
      !Number.isFinite(d.position.x) ||
      !Number.isFinite(d.position.y) ||
      !Number.isSafeInteger(d.tick) ||
      d.tick < 0 ||
      !Number.isSafeInteger(d.source) ||
      (nav && !canWalk(nav, d.position))
    )
      throw Error("Invalid world item");
  }
}
function complete(
  s: InventorySession,
  character: CharacterInventory,
  loot = s.loot,
): InventoryResult<InventorySession> {
  return { ok: true, value: reserveOwned({ ...s, character, loot }) };
}
export function pickupDrop(
  s: InventorySession,
  id: string,
  player: Point,
  nav: Navigation,
  point?: Point,
  alive = true,
): InventoryResult<InventorySession> {
  const drop = s.loot.drops.find((d) => d.item.id === id);
  if (!alive || !drop || !canInspectDrop(drop, player, nav))
    return { ok: false, reason: "Item is not reachable nearby" };
  if (ownedItem(s.character, id))
    return { ok: false, reason: "Duplicate ownership" };
  validateGeneratedItem(drop.item);
  if (s.character.revision >= Number.MAX_SAFE_INTEGER)
    return { ok: false, reason: "Revision limit reached" };
  const placed = point
    ? addGrid(s.character.grid, drop.item, point)
    : addGrid(s.character.grid, drop.item);
  if (!placed.ok)
    return {
      ok: false,
      reason: "Inventory full or invalid placement; item remains on ground",
    };
  return complete(
    s,
    { ...s.character, grid: placed.value, revision: s.character.revision + 1 },
    { ...s.loot, drops: s.loot.drops.filter((d) => d !== drop) },
  );
}
export function dropOwned(
  s: InventorySession,
  id: string,
  player: Point,
  nav: Navigation,
  tick: number,
  alive = true,
): InventoryResult<InventorySession> {
  const item = ownedItem(s.character, id);
  if (!alive || !item)
    return { ok: false, reason: "No owned item or player unavailable" };
  if (s.character.revision >= Number.MAX_SAFE_INTEGER)
    return { ok: false, reason: "Revision limit reached" };
  const c = {
    ...s.character,
    revision: s.character.revision + 1,
    grid: {
      ...s.character.grid,
      items: s.character.grid.items.filter((e) => e.item !== item),
    },
    equipment: { ...s.character.equipment },
  };
  for (const slot of EQUIP_SLOTS)
    if (c.equipment[slot] === item) delete c.equipment[slot];
  const loot = {
    ...s.loot,
    drops: [...s.loot.drops],
    reserved: ownedItems(c).map((i) => i.id),
  };
  if (!placeLoot(loot, item, player, tick, 0, nav))
    return { ok: false, reason: "No safe world space; item retained" };
  return complete(s, c, loot);
}
export function moveOwned(
  s: InventorySession,
  id: string,
  destination:
    | { kind: "grid"; x: number; y: number }
    | { kind: "equipment"; slot: EquipSlot },
): InventoryResult<InventorySession> {
  let result: InventoryResult<CharacterInventory>;
  if (destination.kind === "equipment")
    result = equipItem(s.character, id, destination.slot, s.requirements);
  else {
    const slot = EQUIP_SLOTS.find(
      (slot) => s.character.equipment[slot]?.id === id,
    );
    if (slot)
      result = unequipItem(s.character, slot, destination, s.requirements);
    else {
      if (s.character.revision >= Number.MAX_SAFE_INTEGER)
        return { ok: false, reason: "Revision limit reached" };
      const moved = moveGrid(
        s.character.grid,
        id,
        destination.x,
        destination.y,
      );
      result = moved.ok
        ? {
            ok: true,
            value: {
              ...s.character,
              grid: moved.value,
              revision: s.character.revision + 1,
            },
          }
        : moved;
    }
  }
  return result.ok ? complete(s, result.value) : result;
}
export function identifyOwned(
  s: InventorySession,
  id: string,
): InventoryResult<InventorySession> {
  const item = ownedItem(s.character, id);
  if (!item) return { ok: false, reason: "Item not found" };
  if (item.identified) return { ok: true, value: s };
  if (s.character.revision >= Number.MAX_SAFE_INTEGER)
    return { ok: false, reason: "Revision limit reached" };
  const known = identifyItem(item),
    c = {
      ...s.character,
      revision: s.character.revision + 1,
      grid: {
        ...s.character.grid,
        items: s.character.grid.items.map((e) =>
          e.item === item ? { ...e, item: known } : e,
        ),
      },
      equipment: { ...s.character.equipment },
    };
  for (const slot of EQUIP_SLOTS)
    if (c.equipment[slot] === item) c.equipment[slot] = known;
  return complete(s, c);
}

import { it, expect } from "vitest";
import {
  type InventorySession,
  createInventorySession,
  pickupDrop,
  dropOwned,
  moveOwned,
  validateSession,
  reserveOwned,
} from "./inventory-world";
import { placeLoot } from "./world-loot";
import { inventoryItem } from "./inventory-test-helper";
import { ARENA_NAV } from "./combat";
import { fromGround } from "../world/navigation";
const p = fromGround({ x: 750, y: 560 });
it("moves the same original instance ground→grid→equipment→grid→ground exactly once", () => {
  let s = createInventorySession();
  const item = inventoryItem("ash-blade");
  placeLoot(s.loot, item, p, 1, 1, ARENA_NAV);
  for (const op of [
    (s: InventorySession) => pickupDrop(s, item.id, p, ARENA_NAV),
    (s: InventorySession) =>
      moveOwned(s, item.id, { kind: "equipment", slot: "main" }),
    (s: InventorySession) =>
      moveOwned(s, item.id, { kind: "grid", x: 0, y: 0 }),
    (s: InventorySession) => dropOwned(s, item.id, p, ARENA_NAV, 2),
  ]) {
    const r = op(s);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    s = r.value;
    validateSession(s, ARENA_NAV);
  }
  expect(s.loot.drops[0]?.item).toBe(item);
  expect(s.character.grid.items).toHaveLength(0);
  expect(s.character.equipment).toEqual({});
});
it("fails full pickup/drop without changing either location", () => {
  const s = createInventorySession(),
    item = inventoryItem("woven-coat");
  s.character.grid = { columns: 1, rows: 1, items: [] };
  placeLoot(s.loot, item, p, 1, 1, ARENA_NAV);
  const before = structuredClone(s);
  expect(pickupDrop(s, item.id, p, ARENA_NAV).ok).toBe(false);
  expect(s).toEqual(before);
  expect(
    pickupDrop(s, item.id, fromGround({ x: 250, y: 280 }), ARENA_NAV).ok,
  ).toBe(false);
  s.character.grid = { columns: 10, rows: 4, items: [{ item, x: 0, y: 0 }] };
  s.loot.drops = [];
  const badNav = {
    ...ARENA_NAV,
    obstacles: [{ x: 750, y: 560, rx: 2000, ry: 2000 }],
  };
  const snapshot = structuredClone(s);
  expect(dropOwned(s, item.id, p, badNav, 2).ok).toBe(false);
  expect(s).toEqual(snapshot);
});
it("blocks duplicate generated world identities owned in inventory or equipment", () => {
  const s = createInventorySession(),
    item = inventoryItem("copper-band");
  s.character.equipment.ring1 = item;
  const reserved = reserveOwned(s);
  expect(placeLoot(reserved.loot, item, p, 1, 1, ARENA_NAV)).toBeNull();
  expect(reserved.character.equipment.ring1).toBe(item);
});

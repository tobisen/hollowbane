import { it, expect } from "vitest";
import {
  createCharacterInventory,
  equipItem,
  unequipItem,
  validateCharacter,
} from "./equipment";
import { inventoryItem } from "./inventory-test-helper";
it("equips compatible identified items and preserves original references", () => {
  const c = createCharacterInventory(),
    blade = inventoryItem("ash-blade");
  c.grid.items = [{ item: blade, x: 0, y: 0 }];
  const r = equipItem(c, blade.id, "main");
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(r.value.equipment.main).toBe(blade);
  expect(c.grid.items[0]?.item).toBe(blade);
  expect(equipItem(c, blade.id, "helmet").ok).toBe(false);
  expect(equipItem({ ...c, level: 0 }, blade.id, "main").ok).toBe(false);
  const u = unequipItem(r.value, "main");
  expect(u.ok && u.value.grid.items[0]?.item).toBe(blade);
  validateCharacter(r.value);
});
it("stows off-hand atomically for two-hand weapons and fails safely when full", () => {
  const bow = inventoryItem("reed-bow"),
    shield = inventoryItem("bark-guard"),
    blade = inventoryItem("ash-blade");
  const c = createCharacterInventory();
  c.grid.items = [{ item: bow, x: 0, y: 0 }];
  c.equipment = { main: blade, off: shield };
  const r = equipItem(c, bow.id, "main");
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(r.value.equipment.main).toBe(bow);
    expect(r.value.equipment.off).toBeUndefined();
    expect(r.value.grid.items.map((e) => e.item)).toEqual(
      expect.arrayContaining([blade, shield]),
    );
    validateCharacter(r.value);
  }
  const full = {
    ...c,
    grid: { columns: 2, rows: 3, items: [{ item: bow, x: 0, y: 0 }] },
  };
  const before = structuredClone(full);
  expect(equipItem(full, bow.id, "main").ok).toBe(false);
  expect(full).toEqual(before);
});
it("supports two rings, exact swaps and rejected unidentified equipment", () => {
  const a = inventoryItem("copper-band"),
    b = inventoryItem("copper-band", a.origin.sequence + 1),
    c = createCharacterInventory();
  c.equipment = { ring1: a, ring2: b };
  const r = equipItem(c, a.id, "ring2");
  expect(r.ok && r.value.equipment.ring1).toBe(b);
  expect(r.ok && r.value.equipment.ring2).toBe(a);
  expect(
    equipItem(
      {
        ...c,
        grid: {
          ...c.grid,
          items: [{ item: { ...a, identified: false }, x: 0, y: 0 }],
        },
        equipment: {},
      },
      a.id,
      "ring1",
    ).ok,
  ).toBe(false);
});
it("unequip failure on a full grid retains equipment and does not mutate", () => {
  const ring = inventoryItem("copper-band"),
    other = inventoryItem("copper-band", ring.origin.sequence + 1),
    c = createCharacterInventory(12, 1, 1);
  c.equipment.ring1 = ring;
  c.grid.items = [{ item: other, x: 0, y: 0 }];
  const r = unequipItem(c, "ring1");
  expect(r.ok).toBe(false);
  expect(c.equipment.ring1).toBe(ring);
  const swap = unequipItem(c, "ring1", { x: 0, y: 0 });
  expect(swap.ok && swap.value.equipment.ring1).toBe(other);
  expect(swap.ok && swap.value.grid.items[0]?.item).toBe(ring);
});

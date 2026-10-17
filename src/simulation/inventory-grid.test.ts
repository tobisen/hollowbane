import { it, expect } from "vitest";
import {
  createGrid,
  addGrid,
  firstFit,
  moveGrid,
  removeGrid,
  canPlaceGrid,
  validateGrid,
} from "./inventory-grid";
import { inventoryItem } from "./inventory-test-helper";
it("uses row-major first-fit for multi-cell items without rotation", () => {
  let g = createGrid();
  const blade = inventoryItem("ash-blade"),
    coat = inventoryItem("woven-coat");
  const a = addGrid(g, blade);
  expect(a.ok).toBe(true);
  if (!a.ok) return;
  g = a.value;
  expect(firstFit(g, coat)).toEqual({ x: 1, y: 0 });
  expect(canPlaceGrid(g, coat, 0, 1)).toBe(false);
  expect(canPlaceGrid(g, coat, 9, 0)).toBe(false);
  expect(canPlaceGrid(g, coat, 0.5, 0)).toBe(false);
  expect(firstFit(createGrid(3, 1), blade)).toBeNull();
  validateGrid(g);
});
it("moves and swaps original instances atomically", () => {
  const a = inventoryItem("ash-blade"),
    b = inventoryItem("ash-blade", a.origin.sequence + 1);
  const g = {
    ...createGrid(),
    items: [
      { item: a, x: 0, y: 0 },
      { item: b, x: 1, y: 0 },
    ],
  };
  const moved = moveGrid(g, a.id, 1, 0);
  expect(moved.ok).toBe(true);
  if (moved.ok) {
    expect(moved.value.items.find((e) => e.item === b)).toMatchObject({
      x: 0,
      y: 0,
    });
    expect(moved.value.items.find((e) => e.item === a)).toMatchObject({
      x: 1,
      y: 0,
    });
    validateGrid(moved.value);
  }
  expect(g.items[0]?.x).toBe(0);
  const removed = removeGrid(g, a.id);
  expect(removed.ok && removed.value.entry.item).toBe(a);
});
it("rejects full grids, duplicate identities and swaps that cannot fit without mutation", () => {
  const coat = inventoryItem("woven-coat"),
    ring = inventoryItem("copper-band");
  const g = { ...createGrid(2, 3), items: [{ item: coat, x: 0, y: 0 }] };
  const before = structuredClone(g);
  expect(addGrid(g, ring).ok).toBe(false);
  expect(addGrid(g, coat).ok).toBe(false);
  expect(moveGrid(g, coat.id, 1, 0).ok).toBe(false);
  expect(g).toEqual(before);
  expect(() =>
    validateGrid({ ...g, items: [...g.items, { item: ring, x: 0, y: 0 }] }),
  ).toThrow();
});

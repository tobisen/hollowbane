import { equipmentDefinition } from "./equipment-content";
import type { GeneratedItem } from "./loot";
export interface GridItem {
  item: GeneratedItem;
  x: number;
  y: number;
}
export interface InventoryGrid {
  columns: number;
  rows: number;
  items: GridItem[];
}
export type InventoryResult<T> =
  { ok: true; value: T } | { ok: false; reason: string };
export function createGrid(columns = 10, rows = 4): InventoryGrid {
  if (
    ![columns, rows].every((n) => Number.isSafeInteger(n) && n >= 1 && n <= 20)
  )
    throw Error("Invalid grid dimensions");
  return { columns, rows, items: [] };
}
export function overlap(a: GridItem, b: GridItem): boolean {
  const x = equipmentDefinition(a.item),
    y = equipmentDefinition(b.item);
  return (
    a.x < b.x + y.width &&
    a.x + x.width > b.x &&
    a.y < b.y + y.height &&
    a.y + x.height > b.y
  );
}
export function canPlaceGrid(
  grid: InventoryGrid,
  item: GeneratedItem,
  x: number,
  y: number,
  exclude: readonly string[] = [],
): boolean {
  const d = equipmentDefinition(item),
    entry = { item, x, y };
  return (
    Number.isSafeInteger(x) &&
    Number.isSafeInteger(y) &&
    x >= 0 &&
    y >= 0 &&
    x + d.width <= grid.columns &&
    y + d.height <= grid.rows &&
    grid.items.every((e) => exclude.includes(e.item.id) || !overlap(entry, e))
  );
}
/** Row-major first-fit: top-to-bottom, then left-to-right, never rotate/repack. */
export function firstFit(
  grid: InventoryGrid,
  item: GeneratedItem,
): { x: number; y: number } | null {
  for (let y = 0; y < grid.rows; y++)
    for (let x = 0; x < grid.columns; x++)
      if (canPlaceGrid(grid, item, x, y)) return { x, y };
  return null;
}
export function addGrid(
  grid: InventoryGrid,
  item: GeneratedItem,
  point = firstFit(grid, item),
): InventoryResult<InventoryGrid> {
  if (grid.items.some((e) => e.item.id === item.id))
    return { ok: false, reason: "Duplicate item identity" };
  if (!point || !canPlaceGrid(grid, item, point.x, point.y))
    return { ok: false, reason: "No room at that position" };
  return {
    ok: true,
    value: { ...grid, items: [...grid.items, { item, ...point }] },
  };
}
export function removeGrid(
  grid: InventoryGrid,
  id: string,
): InventoryResult<{ grid: InventoryGrid; entry: GridItem }> {
  const entry = grid.items.find((e) => e.item.id === id);
  if (!entry) return { ok: false, reason: "Item not found" };
  return {
    ok: true,
    value: {
      entry,
      grid: { ...grid, items: grid.items.filter((e) => e !== entry) },
    },
  };
}
/** Moves/swaps on a candidate copy. Failure returns without mutating either item. */
export function moveGrid(
  grid: InventoryGrid,
  id: string,
  x: number,
  y: number,
): InventoryResult<InventoryGrid> {
  const source = grid.items.find((e) => e.item.id === id);
  if (!source) return { ok: false, reason: "Item not found" };
  const incoming = { item: source.item, x, y },
    targets = grid.items.filter((e) => e !== source && overlap(incoming, e));
  if (targets.length > 1)
    return { ok: false, reason: "Cannot swap multiple items" };
  const candidate = {
    ...grid,
    items: grid.items.filter((e) => e !== source && !targets.includes(e)),
  };
  if (!canPlaceGrid(candidate, source.item, x, y))
    return { ok: false, reason: "Invalid destination" };
  candidate.items.push(incoming);
  const other = targets[0];
  if (other) {
    if (!canPlaceGrid(candidate, other.item, source.x, source.y))
      return { ok: false, reason: "Displaced item does not fit source" };
    candidate.items.push({ item: other.item, x: source.x, y: source.y });
  }
  return { ok: true, value: candidate };
}
export function validateGrid(grid: InventoryGrid): void {
  createGrid(grid.columns, grid.rows);
  if (
    !Array.isArray(grid.items) ||
    grid.items.length > grid.columns * grid.rows ||
    new Set(grid.items.map((e) => e.item.id)).size !== grid.items.length
  )
    throw Error("Invalid grid items");
  for (const entry of grid.items)
    if (!canPlaceGrid(grid, entry.item, entry.x, entry.y, [entry.item.id]))
      throw Error("Invalid grid placement");
}

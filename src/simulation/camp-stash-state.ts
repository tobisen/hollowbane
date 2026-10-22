import { createGrid, validateGrid, type InventoryGrid } from "./inventory-grid";
import { validateGeneratedItem } from "./item-save";

/** Character-local storage, in the same atomic checkpoint as inventory. */
export interface CampStashState {
  version: 1;
  revision: number;
  grid: InventoryGrid;
}
export function newCampStash(): CampStashState {
  return { version: 1, revision: 0, grid: createGrid(10, 8) };
}
function record(value: unknown, fields: string[]): Record<string, unknown> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).sort().join() !== fields.sort().join()
  )
    throw Error("Invalid camp stash fields; original retained");
  return value as Record<string, unknown>;
}
function integer(value: unknown, max = Number.MAX_SAFE_INTEGER): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > max
  )
    throw Error("Invalid camp stash integer");
  return value;
}
export function validateCampStash(value: unknown): CampStashState {
  const s = record(value, ["version", "revision", "grid"]);
  const g = record(s.grid, ["columns", "rows", "items"]);
  if (s.version !== 1 || !Array.isArray(g.items) || g.items.length > 400)
    throw Error("Invalid camp stash version or capacity");
  const grid: InventoryGrid = {
    columns: integer(g.columns, 20),
    rows: integer(g.rows, 20),
    items: g.items.map((value: unknown) => {
      const e = record(value, ["item", "x", "y"]);
      return {
        item: validateGeneratedItem(e.item),
        x: integer(e.x, 19),
        y: integer(e.y, 19),
      };
    }),
  };
  validateGrid(grid);
  return { version: 1, revision: integer(s.revision), grid };
}

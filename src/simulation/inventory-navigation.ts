export type GridDirection = "up" | "down" | "left" | "right";
/** No wrapping across rows; null means the UI must move to an adjacent panel. */
export function inventoryNeighbor(
  x: number,
  y: number,
  direction: GridDirection,
  columns: number,
  rows: number,
): { x: number; y: number } | null {
  const nx = x + (direction === "left" ? -1 : direction === "right" ? 1 : 0);
  const ny = y + (direction === "up" ? -1 : direction === "down" ? 1 : 0);
  return nx >= 0 && ny >= 0 && nx < columns && ny < rows
    ? { x: nx, y: ny }
    : null;
}

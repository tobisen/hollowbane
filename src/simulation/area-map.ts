import type { AreaId, WorldPoint } from "./world";
/** Row-major logical cells, independent of image pixels and isometric projection. */
export interface AreaTerrain {
  readonly width: number;
  readonly height: number;
  readonly cellSize: number;
  readonly origin: WorldPoint;
  readonly cells: readonly ("solid" | "ground")[];
}
export interface AreaObject {
  readonly id: string;
  readonly position: WorldPoint;
  readonly radius: number;
  readonly blocking: boolean;
  /** Original asset identifier, resolved by rendering only. */
  readonly appearance: string;
}
export interface AreaMap {
  readonly area: AreaId;
  readonly seed: number;
  readonly terrain: AreaTerrain;
  readonly objects: readonly AreaObject[];
}
export function validAreaMap(map: AreaMap): boolean {
  const t = map.terrain;
  return (
    Number.isInteger(map.seed) &&
    map.seed >= 0 &&
    map.seed <= 0xffffffff &&
    Number.isSafeInteger(t.width) &&
    t.width > 0 &&
    t.width <= 512 &&
    Number.isSafeInteger(t.height) &&
    t.height > 0 &&
    t.height <= 512 &&
    Number.isFinite(t.cellSize) &&
    t.cellSize > 0 &&
    Number.isFinite(t.origin.x) &&
    Number.isFinite(t.origin.y) &&
    Number.isFinite(t.origin.x + t.width * t.cellSize) &&
    Number.isFinite(t.origin.y + t.height * t.cellSize) &&
    t.cells.length === t.width * t.height &&
    t.cells.every((c) => c === "ground" || c === "solid") &&
    new Set(map.objects.map((o) => o.id)).size === map.objects.length &&
    map.objects.every(
      (o) =>
        o.id.length > 0 &&
        o.appearance.length > 0 &&
        Number.isFinite(o.radius) &&
        o.radius >= 0 &&
        Number.isFinite(o.position.x) &&
        Number.isFinite(o.position.y),
    )
  );
}
/** Conservative circle clearance; touching solid terrain or props is blocked. */
export function areaWalkable(
  map: AreaMap,
  point: WorldPoint,
  radius = 0,
): boolean {
  if (
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y) ||
    !Number.isFinite(radius) ||
    radius < 0
  )
    return false;
  const t = map.terrain;
  const x = point.x - t.origin.x,
    y = point.y - t.origin.y;
  if (
    x - radius < 0 ||
    y - radius < 0 ||
    x + radius >= t.width * t.cellSize ||
    y + radius >= t.height * t.cellSize
  )
    return false;
  // Caller validates the immutable map once during loading, never per movement tick.
  const left = Math.max(0, Math.floor((x - radius) / t.cellSize));
  const right = Math.min(t.width - 1, Math.floor((x + radius) / t.cellSize));
  const top = Math.max(0, Math.floor((y - radius) / t.cellSize));
  const bottom = Math.min(t.height - 1, Math.floor((y + radius) / t.cellSize));
  for (let row = top; row <= bottom; row++)
    for (let col = left; col <= right; col++) {
      if (t.cells[row * t.width + col] === "ground") continue;
      const dx =
        x - Math.max(col * t.cellSize, Math.min(x, (col + 1) * t.cellSize));
      const dy =
        y - Math.max(row * t.cellSize, Math.min(y, (row + 1) * t.cellSize));
      if (dx * dx + dy * dy <= radius * radius) return false;
    }
  return !map.objects.some(
    (o) =>
      o.blocking &&
      Math.hypot(point.x - o.position.x, point.y - o.position.y) <=
        radius + o.radius,
  );
}

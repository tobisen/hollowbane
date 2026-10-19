import type { AreaTerrain } from "./area-map";
import type { WorldPoint } from "./world";
export interface AreaDiscovery {
  version: 1;
  fingerprint: string;
  cells: number[];
}
export function discoveryCell(t: AreaTerrain, p: WorldPoint): number {
  const x = Math.floor((p.x - t.origin.x) / t.cellSize),
    y = Math.floor((p.y - t.origin.y) / t.cellSize);
  return Number.isFinite(x) &&
    Number.isFinite(y) &&
    x >= 0 &&
    y >= 0 &&
    x < t.width &&
    y < t.height
    ? y * t.width + x
    : -1;
}
/** Bounded radial automap reveal. No simulation RNG, collision or world visibility changes. */
export function revealDiscovery(
  t: AreaTerrain,
  center: number,
  known: Set<number>,
  radius = 4,
): number[] {
  if (center < 0 || center >= t.cells.length) return [];
  const cx = center % t.width,
    cy = Math.floor(center / t.width),
    added: number[] = [];
  for (
    let y = Math.max(0, cy - radius);
    y <= Math.min(t.height - 1, cy + radius);
    y++
  )
    for (
      let x = Math.max(0, cx - radius);
      x <= Math.min(t.width - 1, cx + radius);
      x++
    ) {
      if ((x - cx) ** 2 + (y - cy) ** 2 > radius ** 2) continue;
      const index = y * t.width + x;
      if (!known.has(index)) {
        known.add(index);
        added.push(index);
      }
    }
  return added;
}

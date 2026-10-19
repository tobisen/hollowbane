import { areaDefinition, areaSeed, type AreaId } from "./world";
import type { AreaLayout } from "./area-anchors";
/** Original temporary logical floors, replaced by W2 modules; no external assets. */
export function prototypeArea(area: AreaId, seed: number): AreaLayout {
  return {
    map: {
      area,
      seed: areaSeed(seed, area),
      terrain: {
        width: 8,
        height: 8,
        cellSize: 1,
        origin: { x: -4, y: -4 },
        cells: Array.from({ length: 64 }, () => "ground" as const),
      },
      objects: [],
    },
    spawn: { x: 0, y: 0 },
    exits: areaDefinition(area).connections.map((c, i) => ({
      id: c.id,
      trigger: { x: i ? 2.5 : -2.5, y: 0 },
      arrival: { x: i ? 1 : -1, y: 0 },
    })),
  };
}

import { AREA_IDS } from "./world";
import {
  validAreaLayout,
  WORLD_ACTOR_RADIUS,
  EXIT_REACH,
  type AreaLayout,
} from "./area-anchors";
import { areaWalkable } from "./area-map";
import { areaNavigation, segmentWalkable } from "../world/navigation";
const STEPS = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];
/** Checks exact actor clearance and swept edges, not merely adjacent ground labels. */
export function connectedGeneratedArea(layout: AreaLayout): boolean {
  if (!AREA_IDS.includes(layout.map.area) || !validAreaLayout(layout))
    return false;
  const t = layout.map.terrain,
    nav = areaNavigation(layout.map);
  const point = (index: number) => ({
    x: t.origin.x + ((index % t.width) + 0.5) * t.cellSize,
    y: t.origin.y + (Math.floor(index / t.width) + 0.5) * t.cellSize,
  });
  const first =
    Math.floor((layout.spawn.y - t.origin.y) / t.cellSize) * t.width +
    Math.floor((layout.spawn.x - t.origin.x) / t.cellSize);
  const visited = new Set([first]),
    queue = [first];
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const current = queue[cursor]!,
      from = point(current),
      x = current % t.width,
      y = Math.floor(current / t.width);
    for (const step of STEPS) {
      const nx = x + step.x,
        ny = y + step.y,
        next = ny * t.width + nx;
      if (
        nx < 0 ||
        ny < 0 ||
        nx >= t.width ||
        ny >= t.height ||
        visited.has(next)
      )
        continue;
      const to = point(next);
      if (
        areaWalkable(layout.map, to, WORLD_ACTOR_RADIUS) &&
        segmentWalkable(nav, from, to)
      ) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
  const reached = (p: { readonly x: number; readonly y: number }) => {
    const index =
      Math.floor((p.y - t.origin.y) / t.cellSize) * t.width +
      Math.floor((p.x - t.origin.x) / t.cellSize);
    return visited.has(index) && segmentWalkable(nav, point(index), p);
  };
  if (
    !reached(layout.spawn) ||
    !layout.exits.every((e) => reached(e.trigger) && reached(e.arrival))
  )
    return false;
  // Exclude isolated walkable fragments, including pockets around props.
  return t.cells.every(
    (cell, index) =>
      cell !== "ground" ||
      !areaWalkable(layout.map, point(index), WORLD_ACTOR_RADIUS) ||
      visited.has(index),
  );
}

export interface GenerationPlacement {
  readonly id: string;
  readonly position: { readonly x: number; readonly y: number };
  readonly radius: number;
  readonly region?: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
}
/** No renderer approximation: placement circles must fit the actual logical floor. */
export function validGeneratedPlacement(
  layout: AreaLayout,
  placements: readonly GenerationPlacement[] = [],
): boolean {
  if (!connectedGeneratedArea(layout)) return false;
  const map = layout.map,
    ground = { ...map, objects: [] };
  for (const [index, object] of map.objects.entries()) {
    if (!areaWalkable(ground, object.position, object.radius)) return false;
    if (
      object.blocking &&
      map.objects
        .slice(index + 1)
        .some(
          (other) =>
            other.blocking &&
            Math.hypot(
              object.position.x - other.position.x,
              object.position.y - other.position.y,
            ) <=
              object.radius + other.radius,
        )
    )
      return false;
  }
  if (new Set(placements.map((p) => p.id)).size !== placements.length)
    return false;
  for (const [index, p] of placements.entries()) {
    if (
      !p.id ||
      !Number.isFinite(p.radius) ||
      p.radius <= 0 ||
      !areaWalkable(map, p.position, p.radius)
    )
      return false;
    const region = p.region;
    if (
      region &&
      (![region.x, region.y, region.width, region.height].every(
        Number.isFinite,
      ) ||
        region.width <= 0 ||
        region.height <= 0 ||
        p.position.x - p.radius < region.x ||
        p.position.y - p.radius < region.y ||
        p.position.x + p.radius > region.x + region.width ||
        p.position.y + p.radius > region.y + region.height)
    )
      return false;
    if (
      Math.hypot(
        p.position.x - layout.spawn.x,
        p.position.y - layout.spawn.y,
      ) <=
      p.radius + WORLD_ACTOR_RADIUS
    )
      return false;
    if (
      layout.exits.some(
        (e) =>
          Math.hypot(p.position.x - e.trigger.x, p.position.y - e.trigger.y) <=
            p.radius + EXIT_REACH + WORLD_ACTOR_RADIUS ||
          Math.hypot(p.position.x - e.arrival.x, p.position.y - e.arrival.y) <=
            p.radius + WORLD_ACTOR_RADIUS,
      )
    )
      return false;
    if (
      placements
        .slice(index + 1)
        .some(
          (q) =>
            Math.hypot(
              p.position.x - q.position.x,
              p.position.y - q.position.y,
            ) <=
            p.radius + q.radius,
        )
    )
      return false;
  }
  return true;
}

import { areaWalkable, validAreaMap, type AreaMap } from "./area-map";
import { areaDefinition, type WorldPoint } from "./world";
export const WORLD_ACTOR_RADIUS = 0.2;
export const EXIT_REACH = 0.65;
export interface AreaExit {
  readonly id: string;
  readonly trigger: WorldPoint;
  /** Arrival is separate from the trigger to prevent immediate return travel. */
  readonly arrival: WorldPoint;
}
export interface AreaLayout {
  readonly map: AreaMap;
  readonly spawn: WorldPoint;
  readonly exits: readonly AreaExit[];
}
export function exitNear(
  layout: AreaLayout,
  position: WorldPoint,
): AreaExit | null {
  return (
    layout.exits.find(
      (exit) =>
        Math.hypot(exit.trigger.x - position.x, exit.trigger.y - position.y) <=
        EXIT_REACH,
    ) ?? null
  );
}
/** Reject unusable anchors before any live world/character mutation. */
export function validAreaLayout(layout: AreaLayout): boolean {
  if (!validAreaMap(layout.map)) return false;
  const connections = areaDefinition(layout.map.area).connections;
  if (
    layout.exits.length !== connections.length ||
    new Set(layout.exits.map((e) => e.id)).size !== connections.length ||
    !connections.every((c) => layout.exits.some((e) => e.id === c.id))
  )
    return false;
  const arrivals = [layout.spawn, ...layout.exits.map((e) => e.arrival)];
  if (
    ![...arrivals, ...layout.exits.map((e) => e.trigger)].every((p) =>
      areaWalkable(layout.map, p, WORLD_ACTOR_RADIUS),
    )
  )
    return false;
  // All spawns must be outside every interaction zone, including neighboring exits.
  return arrivals.every((p) =>
    layout.exits.every(
      (e) =>
        Math.hypot(p.x - e.trigger.x, p.y - e.trigger.y) >
        EXIT_REACH + WORLD_ACTOR_RADIUS,
    ),
  );
}

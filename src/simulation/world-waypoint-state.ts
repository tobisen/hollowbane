import { AREA_IDS, type AreaId, type WorldPoint } from "./world";
import type { AreaLayout } from "./area-anchors";
export interface WaypointState {
  version: 1;
  revision: number;
  unlocked: AreaId[];
}
export function newWaypoints(): WaypointState {
  return { version: 1, revision: 0, unlocked: [] };
}
export function waypointAreaAvailable(
  area: AreaId,
  contentVersion: number,
): boolean {
  return (
    contentVersion === 2 ||
    (contentVersion === 1 &&
      (area === "ashen-refuge" || area === "haunted-forest"))
  );
}
export function nearWaypoint(
  layout: AreaLayout,
  position: WorldPoint,
): boolean {
  return (
    [position.x, position.y].every(Number.isFinite) &&
    Math.hypot(position.x - layout.spawn.x, position.y - layout.spawn.y) <= 1.2
  );
}
export function validateWaypoints(value: unknown): WaypointState {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Invalid waypoint state");
  const w = value as Record<string, unknown>;
  if (
    Object.keys(w).sort().join() !== "revision,unlocked,version" ||
    w.version !== 1 ||
    !Number.isSafeInteger(w.revision) ||
    (w.revision as number) < 0 ||
    !Array.isArray(w.unlocked) ||
    w.unlocked.length > 4 ||
    w.unlocked.some((id) => !AREA_IDS.includes(id)) ||
    new Set(w.unlocked).size !== w.unlocked.length ||
    (w.revision as number) < w.unlocked.length
  )
    throw Error("Invalid waypoint ledger; original retained");
  return {
    version: 1,
    revision: w.revision as number,
    unlocked: [...w.unlocked] as AreaId[],
  };
}

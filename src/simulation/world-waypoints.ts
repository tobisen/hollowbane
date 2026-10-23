import { AREA_IDS, type AreaId } from "./world";
import {
  newWaypoints,
  validateWaypoints,
  nearWaypoint,
  waypointAreaAvailable,
} from "./world-waypoint-state";
import { worldLayout } from "./world-layout";
import {
  reserveOwned,
  validateSession,
  type InventorySession,
} from "./inventory-world";
import type { InventoryResult } from "./inventory-grid";
import { advanceExpedition, migrateExpedition } from "./world-expedition";
import { advanceQuests } from "./quests";
import { configureWorldRewards } from "./world-rewards";
import type { CombatWorld } from "./combat";
export interface WaypointContext {
  alive: boolean;
  idle: boolean;
  safe: boolean;
}
export function waypointDeparture(
  world: CombatWorld,
  busyEffects = false,
): WaypointContext {
  const p = world.actors[0]!,
    position = p.controller.walker.position;
  return {
    alive: p.hp > 0,
    idle: p.controller.timeline.phase === "idle",
    safe:
      !busyEffects &&
      !world.projectiles.length &&
      !world.actors.some(
        (a) =>
          a.kind === "hostile" &&
          a.hp > 0 &&
          (Math.hypot(
            a.controller.walker.position.x - position.x,
            a.controller.walker.position.y - position.y,
          ) <= 6 ||
            a.controller.timeline.phase !== "idle"),
      ),
  };
}
export interface WaypointIntent {
  destination: AreaId;
  expectedArea: AreaId;
  expectedRevision: number;
}
/** Complete immutable world transition. Inventory/progression/resources are never recreated. */
export function travelByWaypoint(
  s: InventorySession,
  intent: WaypointIntent,
  context: WaypointContext,
): InventoryResult<InventorySession> {
  const w = s.exploration;
  if (!w || w.version !== 6 || !context.alive || !context.idle || !context.safe)
    return {
      ok: false,
      reason:
        "Waypoints require a living, idle character clear of nearby enemies and projectiles.",
    };
  try {
    validateSession(s);
    const state = validateWaypoints(w.waypoints ?? newWaypoints());
    if (
      intent.expectedArea !== w.area ||
      intent.expectedRevision !== state.revision
    )
      return {
        ok: false,
        reason: "Travel changed; select a destination again.",
      };
    if (state.revision >= Number.MAX_SAFE_INTEGER)
      return { ok: false, reason: "Waypoint revision limit reached." };
    if (
      !AREA_IDS.includes(intent.destination) ||
      intent.destination === w.area ||
      !state.unlocked.includes(w.area) ||
      !state.unlocked.includes(intent.destination) ||
      !w.visited.includes(intent.destination) ||
      !waypointAreaAvailable(intent.destination, w.contentVersion) ||
      !nearWaypoint(worldLayout(w.area, w.seed, w.contentVersion), w.position)
    )
      return {
        ok: false,
        reason:
          "Approach an attuned waypoint and choose another unlocked destination.",
      };
    const target = w.areas.find((a) => a.id === intent.destination);
    if (!target)
      return { ok: false, reason: "Destination unavailable; world unchanged." };
    const layout = worldLayout(intent.destination, w.seed, w.contentVersion);
    const expedition = migrateExpedition(w.expedition!);
    const candidate = reserveOwned({
      ...s,
      exploration: {
        ...w,
        area: intent.destination,
        position: { ...layout.spawn },
        waypoints: { ...state, revision: state.revision + 1 },
        expedition:
          expedition.stage === "returning" &&
          intent.destination === "ashen-refuge"
            ? { ...expedition, stage: "complete" }
            : advanceExpedition(expedition, w.area, intent.destination),
        quests: advanceQuests(w.quests!, {
          kind: "travel",
          area: intent.destination,
          id: intent.destination,
        }),
        areas: w.areas.map((a) =>
          a.id === w.area
            ? { ...a, drops: [...s.loot.drops], deaths: [...s.loot.deaths] }
            : a.id === intent.destination
              ? { ...a, drops: [] }
              : a,
        ),
      },
      loot: {
        ...s.loot,
        drops: [...target.drops],
        deaths: new Set(target.deaths),
      },
    });
    if (w.contentVersion === 2)
      configureWorldRewards(candidate.loot, intent.destination);
    validateSession(candidate);
    return { ok: true, value: candidate };
  } catch (error) {
    return {
      ok: false,
      reason:
        error instanceof Error
          ? error.message
          : "Travel rejected; world unchanged.",
    };
  }
}

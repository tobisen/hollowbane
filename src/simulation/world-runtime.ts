import { areaDefinition, areaSeed, type AreaId } from "./world";
import type { AreaLayout } from "./area-anchors";
import { exitNear } from "./area-anchors";
import { WorldTravel } from "./world-travel";
import type { CombatWorld } from "./combat";
import { commandCombat } from "./combat-targeting";
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
/** Caller gates modal/pause state. Never recreates character, resources or progression. */
export function stepWorldTravel(
  travel: WorldTravel,
  world: CombatWorld,
): boolean {
  const player = world.actors[0]!;
  if (
    player.hp <= 0 ||
    player.controller.timeline.phase !== "idle" ||
    !travel.setPosition(player.controller.walker.position)
  )
    return false;
  const exit = exitNear(travel.layout, travel.state.position);
  const edge = areaDefinition(travel.state.area).connections.find(
    (c) => c.id === exit?.id,
  );
  // W1 deliberately exposes only the camp/forest prototype.
  if (
    !edge ||
    (edge.destination !== "ashen-refuge" &&
      edge.destination !== "haunted-forest")
  )
    return false;
  const prepared = travel.prepare(
    edge.id,
    prototypeArea(edge.destination, travel.state.seed),
  );
  if (!prepared || !travel.commit(prepared)) return false;
  player.controller = commandCombat(player.controller, { kind: "stop" });
  player.controller.selected = player.controller.locked = null;
  player.controller.walker.position = { ...travel.state.position };
  world.actors = [player];
  world.projectiles = [];
  world.events = [];
  return true;
}

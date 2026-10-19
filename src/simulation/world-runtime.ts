import { areaDefinition } from "./world";
import { exitNear } from "./area-anchors";
import { WorldTravel } from "./world-travel";
import type { CombatWorld } from "./combat";
import { commandCombat } from "./combat-targeting";
export { prototypeArea } from "./world-prototype";
import { prototypeArea } from "./world-prototype";
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

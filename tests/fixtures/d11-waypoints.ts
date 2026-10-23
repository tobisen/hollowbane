import { createD06Checkpoints } from "./d06-campaign";
import { createCombat } from "../../src/simulation/combat";
import { WorldSession } from "../../src/simulation/world-session";
import {
  deserializeCharacter,
  serializeCharacter,
} from "../../src/simulation/inventory-save";
import { travelByWaypoint } from "../../src/simulation/world-waypoints";
/** Existing timed-duel provenance, followed by ordinary transitions and explicit attunement.
 * Initial poses are constructed before loading, never assigned through a live browser hook. */
export function createD11Checkpoints() {
  const s = deserializeCharacter(createD06Checkpoints().forestNavigation),
    w = new WorldSession(s.exploration),
    combat = createCombat();
  combat.actors = [combat.actors[0]!];
  w.restoreDeaths(s.loot, combat);
  const transition = (id: string) => {
    combat.actors[0]!.controller.walker.position = {
      ...w.travel.layout.exits.find((e) => e.id === id)!.trigger,
    };
    if (!w.transition(combat, s.loot))
      throw Error(`D11 fixture transition ${id}`);
  };
  transition("camp");
  w.attuneWaypoint(w.travel.layout.spawn, true, true, true);
  transition("forest");
  s.exploration = w.capture(w.travel.layout.spawn, s.loot);
  const forest = serializeCharacter(s);
  w.attuneWaypoint(w.travel.layout.spawn, true, true, true);
  s.exploration = w.capture(w.travel.layout.spawn, s.loot);
  const moved = travelByWaypoint(
    s,
    {
      destination: "ashen-refuge",
      expectedArea: "haunted-forest",
      expectedRevision: w.waypoints.revision,
    },
    { alive: true, idle: true, safe: true },
  );
  if (!moved.ok) throw Error(moved.reason);
  return { forest, camp: serializeCharacter(moved.value) };
}

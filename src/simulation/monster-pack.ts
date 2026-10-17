import { segmentWalkable, type Navigation } from "../world/navigation";
import type { CombatActor, CombatWorld } from "./combat";
import { distance } from "./monster-perception";
import { MONSTER_PROFILES, type MonsterBrain } from "./monsters";
/** Alerts carry actual observed positions, cannot propagate through walls or from memory alone. */
export function rallyPacks(
  world: CombatWorld,
  brains: MonsterBrain[],
  nav: Navigation,
): number {
  let alerts = 0;
  const actors = new Map(world.actors.map((a) => [a.id, a]));
  for (const source of brains) {
    const actor = actors.get(source.id),
      target = world.actors.find((a) => a.id === source.threat && a.hp > 0);
    if (
      !actor ||
      actor.hp <= 0 ||
      !target ||
      source.state === "return" ||
      !segmentWalkable(
        nav,
        actor.controller.walker.position,
        target.controller.walker.position,
      ) ||
      distance(
        actor.controller.walker.position,
        target.controller.walker.position,
      ) > MONSTER_PROFILES[source.role].detection
    )
      continue;
    for (const receiver of brains) {
      const other = actors.get(receiver.id);
      if (
        receiver.id === source.id ||
        receiver.pack !== source.pack ||
        receiver.threat !== null ||
        receiver.state === "return" ||
        !other ||
        other.hp <= 0 ||
        distance(
          actor.controller.walker.position,
          other.controller.walker.position,
        ) > (source.role === "support" ? 6 : 4) ||
        !segmentWalkable(
          nav,
          actor.controller.walker.position,
          other.controller.walker.position,
        )
      )
        continue;
      receiver.threat = target.id;
      receiver.lastSeen = { ...target.controller.walker.position };
      receiver.seenAt = world.tick;
      alerts++;
    }
  }
  return alerts;
}
export function meleeSlots(
  world: CombatWorld,
  target: number,
  except: number,
): number {
  return world.actors.filter(
    (a) =>
      a.id !== except &&
      a.hp > 0 &&
      a.kind !== "player" &&
      a.weapon === "melee" &&
      a.controller.locked === target &&
      ["windup", "active", "recovery"].includes(a.controller.timeline.phase),
  ).length;
}
/** Bounded two-pass crowd solver; player and committed/dead actors are never displaced. */
export function separateMonsters(world: CombatWorld, nav: Navigation): number {
  let corrections = 0;
  const actors = world.actors.filter((a) => a.hp > 0);
  const movable = (a: CombatActor) =>
    a.kind !== "player" && a.controller.timeline.phase === "idle";
  for (let pass = 0; pass < 2; pass++)
    for (let i = 0; i < actors.length; i++)
      for (let j = i + 1; j < actors.length; j++) {
        const a = actors[i]!,
          b = actors[j]!,
          p = a.controller.walker.position,
          q = b.controller.walker.position,
          d = distance(p, q);
        if (d >= 0.65 || (!movable(a) && !movable(b))) continue;
        const x = d ? (p.x - q.x) / d : (a.id + b.id) % 2 ? 1 : -1,
          y = d ? (p.y - q.y) / d : 0;
        const scale = Math.min(
          0.15,
          (0.65 - d) / (Number(movable(a)) + Number(movable(b))),
        );
        for (const [actor, sign] of [
          [a, 1],
          [b, -1],
        ] as const) {
          if (!movable(actor)) continue;
          const start = actor.controller.walker.position,
            end = {
              x: start.x + x * scale * sign,
              y: start.y + y * scale * sign,
            };
          if (segmentWalkable(nav, start, end)) {
            actor.controller.walker.position = end;
            corrections++;
          }
        }
      }
  return corrections;
}

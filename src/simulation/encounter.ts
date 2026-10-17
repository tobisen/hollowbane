import type { Point } from "../world/isometric";
import { canWalk, fromGround, type Navigation } from "../world/navigation";
import {
  ARENA_NAV,
  createCombat,
  stepCombat,
  type CombatWorld,
} from "./combat";
import { commandCombat } from "./combat-targeting";
import { stepMonsterAI, transitionMonster, type AIWork } from "./monster-ai";
import { distance } from "./monster-perception";
import { separateMonsters } from "./monster-pack";
import { createMonster, type MonsterBrain, type MonsterRole } from "./monsters";
export const ENCOUNTER_NAV: Navigation = {
  ...ARENA_NAV,
  obstacles: [
    { x: 860, y: 520, rx: 28, ry: 54 },
    { x: 1080, y: 680, rx: 30, ry: 22 },
  ],
};
export interface Encounter {
  combat: CombatWorld;
  brains: MonsterBrain[];
  nextId: number;
  seed: number;
  corpseTicks: number;
  spawned: number;
  despawned: number;
  work: AIWork & { separationCorrections: number };
}
const ROLES: MonsterRole[] = [
  "melee",
  "ranged",
  "caster",
  "support",
  "tank",
  "flanker",
];
export function spawnMonster(
  encounter: Encounter,
  role: MonsterRole,
  position: Point,
  pack: number,
  champion = false,
  nav = ENCOUNTER_NAV,
): number | null {
  if (
    encounter.brains.length >= 50 ||
    !canWalk(nav, position) ||
    encounter.combat.actors.some(
      (a) => a.hp > 0 && distance(a.controller.walker.position, position) < 0.8,
    )
  )
    return null;
  const id = encounter.nextId++;
  const monster = createMonster(
    id,
    role,
    position,
    pack,
    encounter.seed,
    champion,
  );
  encounter.combat.actors.push(monster.actor);
  encounter.brains.push(monster.brain);
  encounter.spawned++;
  return id;
}
export function despawnMonster(encounter: Encounter, id: number): void {
  if (!encounter.brains.some((b) => b.id === id)) return;
  encounter.brains = encounter.brains.filter((b) => b.id !== id);
  const w = encounter.combat;
  w.actors = w.actors.filter((a) => a.id !== id);
  w.projectiles = w.projectiles.filter((p) => p.source !== id);
  for (const actor of w.actors)
    if (actor.controller.selected === id)
      actor.controller = {
        ...commandCombat(actor.controller, { kind: "stop" }),
        selected: null,
      };
  encounter.despawned++;
}
export function createEncounter(count = 5, seed = 42): Encounter {
  if (!Number.isInteger(count) || count < 1 || count > 50)
    throw new RangeError("Encounter count must be 1–50");
  const combat = createCombat(seed);
  combat.actors = combat.actors.slice(0, 1);
  combat.hostilesActive = false;
  combat.actors[0]!.controller.walker.position = fromGround({ x: 520, y: 560 });
  const e: Encounter = {
    combat,
    brains: [],
    nextId: 1,
    seed,
    corpseTicks: 600,
    spawned: 0,
    despawned: 0,
    work: { pathRequests: 0, decisions: 0, separationCorrections: 0 },
  };
  for (let i = 0; i < count; i++) {
    const position = { x: 710 + (i % 8) * 70, y: 330 + Math.floor(i / 8) * 67 };
    let spawned: number | null = null;
    for (const offset of [0, 30, -30, 55, -55, 90, -90]) {
      spawned = spawnMonster(
        e,
        ROLES[i % ROLES.length]!,
        fromGround({ x: position.x, y: position.y + offset }),
        Math.floor(i / 5),
        i === 4,
      );
      if (spawned !== null) break;
      for (const dx of [35, -35, 55, -55]) {
        spawned = spawnMonster(
          e,
          ROLES[i % ROLES.length]!,
          fromGround({ x: position.x + dx, y: position.y + offset }),
          Math.floor(i / 5),
          i === 4,
        );
        if (spawned !== null) break;
      }
      if (spawned !== null) break;
    }
    if (spawned === null) throw new Error("No safe encounter spawn slot");
  }
  return e;
}
/** Lifecycle uses simulation ticks; corpses are visual remnants, never targets or crowd blockers. */
export function finishEncounter(
  encounter: Encounter,
  nav = ENCOUNTER_NAV,
): void {
  const w = encounter.combat;
  for (const brain of [...encounter.brains]) {
    const actor = w.actors.find((a) => a.id === brain.id);
    if (actor && actor.hp <= 0 && brain.deathAt === null) {
      brain.deathAt = w.tick;
      brain.expiresAt = w.tick + encounter.corpseTicks;
      transitionMonster(brain, "dead", w.tick);
    }
    if (brain.expiresAt !== null && w.tick >= brain.expiresAt)
      despawnMonster(encounter, brain.id);
  }
  encounter.work.separationCorrections = separateMonsters(w, nav);
}
export function stepEncounter(
  encounter: Encounter,
  movement: Point = { x: 0, y: 0 },
  inputScale = 1,
  active = true,
): void {
  encounter.work = {
    ...(active
      ? stepMonsterAI(encounter.combat, encounter.brains, ENCOUNTER_NAV)
      : { decisions: 0, pathRequests: 0 }),
    separationCorrections: 0,
  };
  stepCombat(encounter.combat, ENCOUNTER_NAV, movement, inputScale);
  finishEncounter(encounter);
}

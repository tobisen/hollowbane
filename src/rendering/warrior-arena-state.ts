import { createCombat } from "../simulation/combat";
import { commandCombat } from "../simulation/combat-targeting";
import { createMonsterExperience } from "../simulation/monster-experience";
import { DEFAULT_XP_CURVE } from "../simulation/experience";
import {
  allocateSkillRanks,
  createSkillProgression,
} from "../simulation/skill-progression";
import {
  createSkills,
  requestSkill,
  stepSkillCombat,
} from "../simulation/skills";
import { ARENA_NAV } from "../simulation/combat";
import type { Point } from "../world/isometric";
import type { Navigation } from "../world/navigation";
import { recordMotion, type MotionCues } from "./combat-motion";
import {
  warriorPose,
  WARRIOR_DIRECTIONS,
  type WarriorSet,
} from "./warrior-pose";
import type { WarriorAttack } from "./warrior-attack-frame";
import type { WarriorAbility } from "./warrior-ability-frame";
import { observeWarriorHit, type WarriorHitCue } from "./warrior-hit-frame";
export { WARRIOR_DIRECTIONS, type WarriorSet };
import movementManifest from "../../public/dev/warrior-directions/warrior.json";

export const WARRIOR_ARENA_NAV: Navigation = {
  ...ARENA_NAV,
  obstacles: [{ x: 1000, y: 720, rx: 16, ry: 90 }],
};
/** Disposable fixture only. Never binds a character owner, storage or loot runtime. */
export function createWarriorArena() {
  const world = createCombat(42);
  world.experience = createMonsterExperience(DEFAULT_XP_CURVE[11]!);
  world.experience.skills = allocateSkillRanks(
    createSkillProgression("warrior", 12),
    12,
    { "warrior-arms-foundation": 1, "warrior-resolve-foundation": 1 },
  );
  return {
    world,
    skills: createSkills(world),
    cues: {} as MotionCues,
    hit: null as WarriorHitCue | null,
    attack: "primary" as WarriorAttack,
    phase: 0,
  };
}
export type WarriorArena = ReturnType<typeof createWarriorArena>;

export function warriorArenaTarget(arena: WarriorArena): number | null {
  const player = arena.world.actors[0]!;
  const choices = arena.world.actors.filter((a) => a.id !== 0 && a.hp > 0);
  return (
    choices.find((a) => a.id === player.controller.selected)?.id ??
    choices.sort((a, b) => {
      const p = player.controller.walker.position;
      const distance = (q: Point) => Math.hypot(q.x - p.x, q.y - p.y);
      return (
        distance(a.controller.walker.position) -
          distance(b.controller.walker.position) || a.id - b.id
      );
    })[0]?.id ??
    null
  );
}

/** Inputs use the same commands and acceptance rules as existing combat. */
export function warriorArenaAttack(
  arena: WarriorArena,
  attack: WarriorAttack,
): void {
  const player = arena.world.actors[0]!,
    target = warriorArenaTarget(arena);
  if (
    target === null ||
    player.controller.timeline.phase !== "idle" ||
    player.controller.queuedAttack ||
    arena.skills.pending.length
  )
    return;
  arena.attack = attack;
  player.controller = commandCombat(player.controller, {
    kind: "attack",
    target,
    repeat: false,
  });
}

export function warriorArenaAbility(
  arena: WarriorArena,
  skill: WarriorAbility,
): void {
  const player = arena.world.actors[0]!,
    target = warriorArenaTarget(arena);
  if (
    player.controller.timeline.phase !== "idle" ||
    player.controller.queuedAttack ||
    arena.skills.pending.length
  )
    return;
  const p = player.controller.walker.position;
  const q =
    arena.world.actors.find((a) => a.id === target)?.controller.walker
      .position ?? p;
  requestSkill(arena.skills, {
    actor: 0,
    skill,
    target: skill === "iron-fan" ? target : null,
    direction: { x: q.x - p.x, y: q.y - p.y },
  });
}

export function stepWarriorArena(
  arena: WarriorArena,
  movement: Point = { x: 0, y: 0 },
  scale = 1,
): void {
  const walker = arena.world.actors[0]!.controller.walker,
    before = walker.distance;
  stepSkillCombat(arena.skills, WARRIOR_ARENA_NAV, movement, scale);
  const next = arena.world.actors[0]!.controller;
  // Same authored distance cadence as the movement showcase, continuous across facing changes.
  const stride = movementManifest.clips[next.walker.gait].worldStride;
  arena.phase = (arena.phase + (next.walker.distance - before) / stride) % 1;
  arena.hit = observeWarriorHit(arena.hit, next.timeline);
  recordMotion(
    arena.cues,
    arena.world.actors,
    arena.world.events,
    arena.world.tick,
  );
}

/** Read-only pose selection; drawing it any number of times cannot execute gameplay. */
export function warriorArenaPose(arena: WarriorArena): {
  set: WarriorSet;
  frame: number;
  clip: string;
} {
  return warriorPose(
    arena.world.actors[0]!,
    arena.world.tick,
    arena.cues[0]?.deathAt ?? null,
    arena.skills.users[0]!.cast,
    arena,
    arena.attack,
  );
}

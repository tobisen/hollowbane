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
import { warriorAttackFrame, type WarriorAttack } from "./warrior-attack-frame";
import {
  warriorAbilityFrame,
  type WarriorAbility,
} from "./warrior-ability-frame";
import {
  observeWarriorHit,
  warriorHitFrame,
  type WarriorHitCue,
} from "./warrior-hit-frame";
import { warriorDeathFrame } from "./warrior-death-frame";
import movementManifest from "../../public/dev/warrior-directions/warrior.json";

export const WARRIOR_ARENA_NAV: Navigation = {
  ...ARENA_NAV,
  obstacles: [{ x: 1000, y: 720, rx: 16, ry: 90 }],
};
export const WARRIOR_DIRECTIONS = [
  "s",
  "sw",
  "w",
  "nw",
  "n",
  "ne",
  "e",
  "se",
] as const;
export type WarriorSet = "movement" | "attacks" | "abilities" | "hit" | "death";

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
  const player = arena.world.actors[0]!,
    t = player.controller.timeline;
  const death = warriorDeathFrame(
    t,
    arena.world.tick,
    arena.cues[0]?.deathAt ?? null,
  );
  if (death !== null) return { set: "death", frame: death, clip: "death" };
  const hit = warriorHitFrame(t, arena.hit);
  if (hit !== null) return { set: "hit", frame: hit, clip: "hit" };
  const ability = warriorAbilityFrame(t, arena.skills.users[0]!.cast);
  if (ability)
    return {
      set: "abilities",
      frame: (ability.ability === "iron-fan" ? 0 : 12) + ability.frame,
      clip: ability.ability,
    };
  const attack = warriorAttackFrame(t, arena.attack);
  if (attack !== null)
    return { set: "attacks", frame: attack, clip: arena.attack };
  const walker = player.controller.walker;
  return walker.walking
    ? {
        set: "movement",
        frame: (walker.gait === "run" ? 24 : 8) + Math.floor(arena.phase * 16),
        clip: walker.gait,
      }
    : {
        set: "movement",
        frame: Math.floor(arena.world.tick / 24) % 8,
        clip: "idle",
      };
}

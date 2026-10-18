import type { Point } from "../world/isometric";
import { createCombat, type CombatActor } from "./combat";
import { MOVEMENT } from "./locomotion";
export type MonsterState =
  | "idle"
  | "patrol"
  | "alert"
  | "chase"
  | "attack"
  | "retreat"
  | "return"
  | "dead";
export type MonsterRole =
  "melee" | "ranged" | "caster" | "support" | "flanker" | "tank";
export interface MonsterProfile {
  name: string;
  detection: number;
  leash: number;
  memory: number;
  alert: number;
  cooldown: number;
  speed: number;
  range: number;
  attackSpeed: number;
  damage: number;
  health: number;
  retreatAt: number;
  preferred: number;
  projectile: boolean;
}
export const MONSTER_PROFILES: Readonly<
  Record<MonsterRole, Readonly<MonsterProfile>>
> = {
  melee: {
    name: "Cinder raider",
    detection: 6,
    leash: 10,
    memory: 180,
    alert: 12,
    cooldown: 16,
    speed: 2.5,
    range: 1,
    attackSpeed: 20,
    damage: 10,
    health: 90,
    retreatAt: 0.18,
    preferred: 0.8,
    projectile: false,
  },
  ranged: {
    name: "Briar slinger",
    detection: 7,
    leash: 11,
    memory: 210,
    alert: 18,
    cooldown: 40,
    speed: 2.1,
    range: 5,
    attackSpeed: 0,
    damage: 9,
    health: 65,
    retreatAt: 0.25,
    preferred: 3.5,
    projectile: true,
  },
  caster: {
    name: "Ember channeler",
    detection: 7,
    leash: 10,
    memory: 210,
    alert: 24,
    cooldown: 70,
    speed: 1.8,
    range: 5.5,
    attackSpeed: 0,
    damage: 16,
    health: 60,
    retreatAt: 0.35,
    preferred: 4,
    projectile: true,
  },
  support: {
    name: "Ash herald",
    detection: 6,
    leash: 10,
    memory: 240,
    alert: 15,
    cooldown: 90,
    speed: 2,
    range: 4,
    attackSpeed: 0,
    damage: 6,
    health: 80,
    retreatAt: 0.4,
    preferred: 3,
    projectile: true,
  },
  flanker: {
    name: "Thorn runner",
    detection: 6.5,
    leash: 12,
    memory: 150,
    alert: 6,
    cooldown: 26,
    speed: 3.8,
    range: 0.95,
    attackSpeed: 50,
    damage: 8,
    health: 55,
    retreatAt: 0.25,
    preferred: 0.8,
    projectile: false,
  },
  tank: {
    name: "Stonebound",
    detection: 5,
    leash: 9,
    memory: 240,
    alert: 24,
    cooldown: 45,
    speed: 1.5,
    range: 1.2,
    attackSpeed: 0,
    damage: 18,
    health: 200,
    retreatAt: 0,
    preferred: 1,
    projectile: false,
  },
};
export interface MonsterBrain {
  id: number;
  role: MonsterRole;
  pack: number;
  champion: boolean;
  state: MonsterState;
  since: number;
  home: Point;
  goal: Point | null;
  lastSeen: Point | null;
  threat: number | null;
  seenAt: number;
  nextThink: number;
  nextPath: number;
  nextAttack: number;
  retreatUntil: number;
  patrolIndex: number;
  previousHp: number;
  deathAt: number | null;
  expiresAt: number | null;
  pathRequests: number;
  transitions: number;
}
/** Owned serializable data. No engine, clock, DOM or unseeded randomness. */
export function createMonster(
  id: number,
  role: MonsterRole,
  position: Point,
  pack = 0,
  seed = 42,
  champion = false,
): { actor: CombatActor; brain: MonsterBrain } {
  if (
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    !Number.isFinite(position.x) ||
    !Number.isFinite(position.y) ||
    !Number.isSafeInteger(pack)
  )
    throw new RangeError("Invalid monster identity/position");
  const profile = MONSTER_PROFILES[role];
  const actor = createCombat(seed).actors[3]!;
  actor.id = id;
  actor.monsterRole = role;
  actor.name = (champion ? "Champion " : "") + profile.name;
  actor.controller.walker.position = { ...position };
  actor.hp = actor.maxHp = profile.health * (champion ? 1.8 : 1);
  actor.offense.damage = profile.damage * (champion ? 1.25 : 1);
  actor.offense.criticalChance = 0.05;
  actor.weapon = profile.projectile ? "projectile" : "melee";
  actor.range = profile.range;
  actor.attackSpeed = profile.attackSpeed;
  actor.defense.armor = role === "tank" ? 60 : 10;
  actor.movement = {
    ...MOVEMENT,
    walkSpeed: profile.speed,
    runSpeed: profile.speed,
  };
  return {
    actor,
    brain: {
      id,
      role,
      pack,
      champion,
      state: "idle",
      since: 0,
      home: { ...position },
      goal: null,
      lastSeen: null,
      threat: null,
      seenAt: -10000,
      nextThink: ((Math.imul(id, 17) ^ seed) >>> 0) & 7,
      nextPath: 0,
      nextAttack: 0,
      retreatUntil: 0,
      patrolIndex: 0,
      previousHp: actor.hp,
      deathAt: null,
      expiresAt: null,
      pathRequests: 0,
      transitions: 0,
    },
  };
}

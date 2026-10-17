import {
  createEffects,
  stepStatuses,
  stepSkillBolts,
  releaseSkill,
  type Effects,
} from "./skill-effects";
import data from "../content/skills.json";
import {
  validateSkills,
  type ActiveSkill,
  type SkillDefinition,
} from "./skill-content";
import { breakpointFrames } from "./combat-timing";
import { commandCombat, inAttackRange } from "./combat-targeting";
import {
  ARENA_NAV,
  stepCombat,
  type CombatActor,
  type CombatHooks,
  type CombatWorld,
} from "./combat";
import { directionFor } from "./locomotion";
import { onGround, type Navigation } from "../world/navigation";
import type { Point } from "../world/isometric";
export const SKILLS = validateSkills(data);
export const CAST_BREAKPOINTS = [
  { minimum: 0, frames: 100 },
  { minimum: 25, frames: 85 },
  { minimum: 60, frames: 70 },
  { minimum: 100, frames: 55 },
];
export interface SkillIntent {
  actor: number;
  skill: string;
  target: number | null;
  direction: Point;
}
export interface Cast {
  skill: string;
  target: number | null;
  direction: Point;
  sequence: number;
  resolved: boolean;
}
export interface SkillUser {
  actor: number;
  mana: number;
  maxMana: number;
  castSpeed: number;
  cooldowns: Record<string, number>;
  cast: Cast | null;
  passives: string[];
}
export type SkillEvent = {
  tick: number;
  actor: number;
  skill: string;
  kind: "start" | "effect" | "interrupt" | "rejected";
  reason?: string;
  target: number | null;
  direction: Point;
};
export interface SkillRuntime {
  effects: Effects;
  combat: CombatWorld;
  definitions: readonly SkillDefinition[];
  users: SkillUser[];
  pending: SkillIntent[];
  events: SkillEvent[];
}
export function createSkills(
  combat: CombatWorld,
  definitions = SKILLS,
): SkillRuntime {
  return {
    combat,
    effects: createEffects(),
    definitions,
    users: combat.actors.map((a) => ({
      actor: a.id,
      mana: 100,
      maxMana: 100,
      castSpeed: 0,
      cooldowns: {},
      cast: null,
      passives: a.kind === "player" ? ["still-well"] : [],
    })),
    pending: [],
    events: [],
  };
}
export function requestSkill(runtime: SkillRuntime, intent: SkillIntent): void {
  if (
    !Number.isSafeInteger(intent.actor) ||
    ![intent.direction.x, intent.direction.y].every(Number.isFinite)
  )
    return;
  // One command per actor per simulation tick; a held physical button is not a new command.
  if (!runtime.pending.some((p) => p.actor === intent.actor))
    runtime.pending.push({ ...intent, direction: { ...intent.direction } });
}
function event(
  r: SkillRuntime,
  intent: SkillIntent,
  kind: SkillEvent["kind"],
  reason?: string,
): void {
  r.events.push({
    tick: r.combat.tick,
    ...intent,
    kind,
    ...(reason ? { reason } : {}),
  });
  if (r.events.length > 256) r.events.shift();
}
export function activeSkill(
  r: SkillRuntime,
  id: string,
): ActiveSkill | undefined {
  const s = r.definitions.find((s) => s.id === id);
  return s?.kind === "active" ? s : undefined;
}
function validateTarget(
  r: SkillRuntime,
  actor: CombatActor,
  intent: SkillIntent,
  s: ActiveSkill,
  nav: Navigation,
): string | null {
  if (s.shape === "chain" || s.shape === "melee") {
    const target = r.combat.actors.find(
      (a) =>
        a.id === intent.target &&
        a.hp > 0 &&
        (actor.kind === "player" ? a.kind !== "player" : a.kind === "player"),
    );
    if (!target) return "invalid-target";
    if (
      !inAttackRange(
        actor.controller.walker.position,
        target.controller.walker.position,
        s.range,
        nav,
      )
    )
      return "out-of-range";
  }
  if (
    ["projectile", "cone", "line"].includes(s.shape) &&
    Math.hypot(intent.direction.x, intent.direction.y) < 1e-6
  )
    return "invalid-direction";
  return null;
}
export function skillHooks(
  r: SkillRuntime,
  nav: Navigation = ARENA_NAV,
): CombatHooks {
  return {
    controlsActor: (a) => !!r.users.find((u) => u.actor === a.id)?.cast,
    afterTick: () => stepSkillBolts(r, nav),
    beforeTick: () => {
      stepStatuses(r, nav);
      for (const u of r.users) {
        const a = r.combat.actors.find((a) => a.id === u.actor);
        if (!a) continue;
        if (
          u.cast &&
          (a.hp <= 0 ||
            ["hitstun", "dead"].includes(a.controller.timeline.phase) ||
            a.controller.timeline.sequence !== u.cast.sequence)
        ) {
          event(
            r,
            {
              actor: u.actor,
              skill: u.cast.skill,
              target: u.cast.target,
              direction: u.cast.direction,
            },
            "interrupt",
          );
          u.cast = null;
        } else if (u.cast && a.controller.timeline.phase === "idle")
          u.cast = null;
        if (a.hp > 0)
          for (const id of u.passives) {
            const p = r.definitions.find((p) => p.id === id);
            if (p?.kind === "passive")
              u.mana = Math.min(u.maxMana, u.mana + p.manaPerSecond / 60);
          }
      }
      for (const intent of r.pending) {
        const a = r.combat.actors.find((a) => a.id === intent.actor),
          u = r.users.find((u) => u.actor === intent.actor),
          s = activeSkill(r, intent.skill);
        const reason =
          !a || a.hp <= 0 || !u || !s
            ? "unavailable"
            : a.controller.timeline.phase !== "idle" || u.cast
              ? "committed"
              : u.mana < s.mana
                ? "mana"
                : (u.cooldowns[s.id] ?? 0) > r.combat.tick
                  ? "cooldown"
                  : validateTarget(r, a, intent, s, nav);
        if (reason || !a || !u || !s) {
          event(r, intent, "rejected", reason ?? "unavailable");
          continue;
        }
        u.mana -= s.mana;
        u.cooldowns[s.id] = r.combat.tick + s.cooldown;
        const scale = breakpointFrames(u.castSpeed, CAST_BREAKPOINTS) / 100;
        a.controller = commandCombat(a.controller, { kind: "stop" });
        const sequence = a.controller.timeline.sequence + 1;
        a.controller.timeline = {
          phase: "windup",
          remaining: Math.max(1, Math.ceil(s.windup * scale)),
          sequence,
          timing: {
            windup: Math.max(1, Math.ceil(s.windup * scale)),
            active: 1,
            recovery: Math.max(1, Math.ceil(s.recovery * scale)),
          },
        };
        if (Math.hypot(intent.direction.x, intent.direction.y) > 1e-6)
          a.controller.walker.direction = directionFor(intent.direction);
        u.cast = {
          skill: s.id,
          target: intent.target,
          direction: { ...intent.direction },
          sequence,
          resolved: false,
        };
        event(r, intent, "start");
      }
      r.pending = [];
    },
    strike: (a) => {
      const u = r.users.find((u) => u.actor === a.id),
        c = u?.cast;
      if (!c) return false;
      if (!c.resolved) {
        c.resolved = true;
        const s = activeSkill(r, c.skill)!;
        const reason = validateTarget(r, a, { actor: a.id, ...c }, s, nav);
        if (!reason) releaseSkill(r, s, a, c, nav);
        event(
          r,
          { actor: a.id, ...c },
          reason ? "rejected" : "effect",
          reason ?? undefined,
        );
      }
      return true;
    },
  };
}
export function stepSkillCombat(
  r: SkillRuntime,
  nav = ARENA_NAV,
  movement: Point = { x: 0, y: 0 },
  scale = 1,
): void {
  stepCombat(r.combat, nav, movement, scale, skillHooks(r, nav));
}
/** Direction in ground/screen space converts to the existing world coordinate basis. */
export function worldAim(direction: Point): Point {
  return {
    x: (direction.x / 64 + direction.y / 32) / 2,
    y: (direction.y / 32 - direction.x / 64) / 2,
  };
}
export function groundAim(source: Point, target: Point): Point {
  const a = onGround(source),
    b = onGround(target);
  return { x: b.x - a.x, y: b.y - a.y };
}

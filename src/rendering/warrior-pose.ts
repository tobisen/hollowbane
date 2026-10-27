import type { CombatActor } from "../simulation/combat";
import type { Cast } from "../simulation/skills";
import { warriorAttackFrame, type WarriorAttack } from "./warrior-attack-frame";
import { warriorAbilityFrame } from "./warrior-ability-frame";
import {
  observeWarriorHit,
  warriorHitFrame,
  type WarriorHitCue,
} from "./warrior-hit-frame";
import { warriorDeathFrame } from "./warrior-death-frame";

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
export interface WarriorPose {
  set: WarriorSet;
  frame: number;
  clip: string;
}

/** Presentation memory observes every authoritative tick, even while using legacy art. */
export class WarriorMotion {
  phase = 0;
  hit: WarriorHitCue | null = null;
  private distance: number | null = null;
  private tick = -1;
  observe(actor: CombatActor, tick: number): void {
    if (tick === this.tick) return;
    const walker = actor.controller.walker;
    const delta =
      this.distance === null || tick < this.tick
        ? 0
        : walker.distance - this.distance;
    if (delta >= 0)
      this.phase =
        (this.phase +
          delta /
            (walker.gait === "run" ? 1.5783633441429874 : 1.0417198071343716)) %
        1;
    else this.phase = 0;
    this.hit = observeWarriorHit(
      tick < this.tick ? null : this.hit,
      actor.controller.timeline,
    );
    this.distance = walker.distance;
    this.tick = tick;
  }
}

/** Shared read-only selector. Never starts attacks, effects or a second clock. */
export function warriorPose(
  actor: CombatActor,
  tick: number,
  deathAt: number | null,
  cast: Cast | null,
  motion: Pick<WarriorMotion, "phase" | "hit">,
  attack: WarriorAttack = "primary",
): WarriorPose {
  const t = actor.controller.timeline;
  const death = warriorDeathFrame(t, tick, deathAt);
  if (death !== null) return { set: "death", frame: death, clip: "death" };
  const hit = warriorHitFrame(t, motion.hit);
  if (hit !== null) return { set: "hit", frame: hit, clip: "hit" };
  const ability = warriorAbilityFrame(t, cast);
  if (ability)
    return {
      set: "abilities",
      frame: (ability.ability === "iron-fan" ? 0 : 12) + ability.frame,
      clip: ability.ability,
    };
  const strike = warriorAttackFrame(t, attack);
  if (strike !== null) return { set: "attacks", frame: strike, clip: attack };
  const walker = actor.controller.walker;
  return walker.walking
    ? {
        set: "movement",
        frame: (walker.gait === "run" ? 24 : 8) + Math.floor(motion.phase * 16),
        clip: walker.gait,
      }
    : { set: "movement", frame: Math.floor(tick / 24) % 8, clip: "idle" };
}

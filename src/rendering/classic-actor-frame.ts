import type { CombatActor } from "../simulation/combat";
import { WarriorMotion, warriorPose } from "./warrior-pose";

export type ClassicActorKind = "warrior" | "raider" | "runner";
export const CLASSIC_VIEWS = [
  "sw",
  "sw",
  "nw",
  "nw",
  "ne",
  "ne",
  "se",
  "se",
] as const;
export const CLASSIC_SAMPLES = {
  idle: [0],
  walk: [0, 2, 4, 6, 8, 10, 12, 14],
  primary: [0, 2, 4, 5, 6, 8, 10, 11],
  hit: [0, 2, 5],
  death: [0, 3, 6, 9, 12, 15],
} as const;

/** Reuse eight source walk poses at a distance-driven cadence for both gaits.
 * Observes a presentation copy; never changes actual movement or combat state.
 */
export function observeClassicMotion(
  motion: WarriorMotion,
  actor: CombatActor,
  tick: number,
): void {
  motion.observe(
    {
      ...actor,
      controller: {
        ...actor.controller,
        walker: { ...actor.controller.walker, gait: "walk" },
      },
    },
    tick,
  );
}

export function classicActorFrame(
  actor: CombatActor,
  tick: number,
  deathAt: number | null,
  motion: WarriorMotion,
  kind: ClassicActorKind,
) {
  const pose = warriorPose(actor, tick, deathAt, null, motion);
  const clip =
    pose.set === "movement"
      ? actor.controller.walker.walking
        ? "walk"
        : "idle"
      : pose.set === "attacks"
        ? "primary"
        : pose.set === "hit"
          ? "hit"
          : pose.set === "death"
            ? "death"
            : "idle";
  const index =
    pose.set === "movement" && clip === "walk"
      ? pose.frame - (actor.controller.walker.gait === "run" ? 24 : 8)
      : pose.frame;
  const sampled =
    CLASSIC_SAMPLES[clip].filter((sample) => sample <= index).at(-1) ?? 0;
  const view = CLASSIC_VIEWS[actor.controller.walker.direction]!;
  return {
    name: `${kind}-${clip}-${view}-${String(sampled).padStart(2, "0")}`,
    clip,
    view,
    frame: sampled,
    kind,
  };
}

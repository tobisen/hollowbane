import type { BossDefinition, BossState } from "../simulation/boss";
import type { CombatActor } from "../simulation/combat";
/** Readable presentation only; never advances simulation or changes warning timing. */
export function bossPresentation(
  definition: BossDefinition,
  state: BossState,
  actor: Pick<
    CombatActor,
    "hp" | "maxHp" | "controller" | "reactionGuardUntil"
  >,
  tick: number,
) {
  const attack =
    state.telegraph && actor.controller.timeline.phase === "windup"
      ? definition.attacks.find((a) => a.id === state.telegraph!.attack)
      : undefined;
  return {
    name: definition.name,
    health: `${Math.ceil(actor.hp)} / ${actor.maxHp}`,
    phase: state.complete
      ? "Encounter complete"
      : `Phase ${state.phase + 1} · ${definition.phases[state.phase]!.name}`,
    warning: state.complete
      ? "The binding is broken."
      : tick < state.transitionUntil
        ? "The stone shifts · prepare"
        : attack
          ? `${attack.name}${tick < actor.reactionGuardUntil ? " · Resisting interruption" : ""}`
          : "",
  };
}

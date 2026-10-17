import type { Action } from "./actions";
export const SKILL_ACTIONS = [
  "primary",
  "secondary",
  "skill1",
  "skill2",
  "skill3",
  "skill4",
] as const satisfies readonly Action[];
export const SKILL_SLOTS = [
  "ember-lance",
  "rime-ring",
  "storm-thread",
  "iron-fan",
  "oath-echo",
  "briar-edge",
] as const;
/** Press edges only. Holding/releasing a button never causes a second activation. */
export function skillSlot(action: Action): number | null {
  const i = SKILL_ACTIONS.indexOf(action as (typeof SKILL_ACTIONS)[number]);
  return i < 0 ? null : i;
}
export function cycleSkill(selected: number, delta: number): number {
  return (
    (((selected + delta) % SKILL_SLOTS.length) + SKILL_SLOTS.length) %
    SKILL_SLOTS.length
  );
}

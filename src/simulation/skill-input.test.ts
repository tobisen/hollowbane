import { expect, it } from "vitest";
import { actionFrame } from "./actions";
import { cycleSkill, skillSlot, SKILL_ACTIONS } from "./skill-input";
it("maps six semantic slots, wraps selection and ignores held/released edges", () => {
  expect(SKILL_ACTIONS.map(skillSlot)).toEqual([0, 1, 2, 3, 4, 5]);
  expect(skillSlot("pause")).toBeNull();
  expect(cycleSkill(0, -1)).toBe(5);
  expect(cycleSkill(5, 1)).toBe(0);
  const first = actionFrame("gamepad", new Set(["skill1"]), new Set()),
    held = actionFrame("gamepad", new Set(["skill1"]), new Set(["skill1"])),
    released = actionFrame("gamepad", new Set(), new Set(["skill1"]));
  expect(first.actions.skill1.pressed).toBe(true);
  expect(held.actions.skill1.pressed).toBe(false);
  expect(released.actions.skill1.pressed).toBe(false);
});

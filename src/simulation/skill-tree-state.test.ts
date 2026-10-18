import { expect, it } from "vitest";
import {
  CLASS_TREES,
  createSkillProgression,
  chooseSkillClass,
  assignSkill,
  skillBar,
  allocateSkillRanks,
  validateSkillProgression,
} from "./skill-progression";
import { skillNodeState } from "./skill-tree-state";
const node = CLASS_TREES.trees[0]!.branches[0]!.nodes[0]!;
it("presents the allocator verdict for available, learned, maxed and planned nodes", () => {
  const state = createSkillProgression("warrior", 12);
  expect(skillNodeState(state, "warrior", 12, node).status).toBe("available");
  const learned = allocateSkillRanks(state, 12, { [node.id]: 1 });
  expect(skillNodeState(learned, "warrior", 12, node)).toMatchObject({
    status: "learned",
    rank: 1,
    current: { damage: 48 },
    next: { damage: 52.8 },
  });
  expect(
    skillNodeState(
      allocateSkillRanks(state, 12, { [node.id]: 5 }),
      "warrior",
      12,
      node,
    ).status,
  ).toBe("maxed");
  expect(
    skillNodeState(createSkillProgression("warrior"), "warrior", 1, node)
      .canAllocate,
  ).toBe(false);
  expect(
    skillNodeState(
      state,
      "warrior",
      12,
      CLASS_TREES.trees[0]!.branches[0]!.nodes[1]!,
    ).planned,
  ).toBe(true);
});
it("chooses a permanent discipline explicitly and validates optional schema4 bars", () => {
  const legacy = createSkillProgression(null, 12);
  expect(skillBar(legacy).filter(Boolean)).toHaveLength(6);
  const state = chooseSkillClass(legacy, "warrior");
  expect(skillBar(state)).toEqual([null, null, null, null, null, null]);
  expect(() => chooseSkillClass(state, "sorcerer")).toThrow(/permanent/);
  expect(() => assignSkill(state, 0, "iron-fan")).toThrow(/locked/);
  const learned = allocateSkillRanks(state, 12, { [node.id]: 1 });
  const assigned = assignSkill(learned, 0, "iron-fan");
  expect(skillBar(assigned)[0]).toBe("iron-fan");
  expect(
    validateSkillProgression(JSON.parse(JSON.stringify(assigned)), 12),
  ).toEqual(assigned);
  for (const bar of [
    ["iron-fan"],
    ["ember-lance", null, null, null, null, null],
    ["still-well", null, null, null, null, null],
  ])
    expect(() => validateSkillProgression({ ...assigned, bar }, 12)).toThrow();
  expect(learned.bar![0]).toBeNull();
});

import { expect, it } from "vitest";
import {
  allocateSkillRanks,
  createSkillProgression,
  createStarterSkillProgression,
  STARTER_SKILLS,
  skillBar,
  rewardSkillLevels,
  validateSkillProgression,
  CLASS_TREES,
  scaleRankedSkill,
} from "./skill-progression";
import { validateSkillTrees } from "./skill-trees";
import { createCombat, applyCombatHit, ARENA_NAV } from "./combat";
import { createEncounter } from "./encounter";
import {
  createMonsterExperience,
  MONSTER_XP,
  consumeMonsterDeathXp,
} from "./monster-experience";
import { DEFAULT_XP_CURVE } from "./experience";
import {
  actorSkill,
  createSkills,
  requestSkill,
  SKILLS,
  stepSkillCombat,
} from "./skills";
const node = "sorcerer-ember-foundation";
it("keeps the creation grant separate from earned points and rejects forged starter ledgers", () => {
  for (const classId of ["warrior", "sorcerer", "ranger"] as const) {
    const initial = createStarterSkillProgression(classId);
    const starter = STARTER_SKILLS[classId];
    expect(initial).toMatchObject({
      available: 0,
      spent: 0,
      ranks: { [starter.node]: 1 },
    });
    expect(() => allocateSkillRanks(initial, 1, { [starter.node]: 1 })).toThrow(
      /Insufficient/,
    );
    const rewarded = rewardSkillLevels(initial, 2);
    const upgraded = allocateSkillRanks(rewarded, 2, { [starter.node]: 1 });
    expect(upgraded).toMatchObject({
      available: 0,
      spent: 1,
      ranks: { [starter.node]: 2 },
    });
    expect(rewardSkillLevels(upgraded, 2)).toBe(upgraded);
    expect(rewardSkillLevels(upgraded, 99).available).toBe(97);
    expect(
      validateSkillProgression(JSON.parse(JSON.stringify(upgraded)), 2),
    ).toEqual(upgraded);
    for (const invalid of [
      { ...initial, starter: false },
      { ...initial, starter: 2 },
      { ...initial, ranks: {} },
      { ...initial, classId: null },
      { ...initial, spent: 1 },
      { ...initial, available: 1 },
      { ...initial, ranks: { [starter.node]: 2 } },
    ])
      expect(() => validateSkillProgression(invalid, 1)).toThrow();
    const old = createSkillProgression(classId);
    expect(
      validateSkillProgression(JSON.parse(JSON.stringify(old)), 1),
    ).toEqual(old);
    expect(skillBar(old)).toEqual(Array<null>(6).fill(null));
  }
});
it("rewards multiple levels exactly once, separately from attributes, capped at 99", () => {
  const state = createSkillProgression("sorcerer");
  const rewarded = rewardSkillLevels(state, 12);
  expect(rewarded).toMatchObject({ available: 11, spent: 0 });
  expect(rewardSkillLevels(rewarded, 12)).toBe(rewarded);
  expect(rewardSkillLevels(rewarded, 3)).toBe(rewarded);
  expect(rewardSkillLevels(rewarded, 99).available).toBe(98);
  expect(() => rewardSkillLevels(rewarded, 100)).toThrow();
  const world = createEncounter(2).combat;
  world.experience = createMonsterExperience(0, {
    ...MONSTER_XP,
    melee: DEFAULT_XP_CURVE[5]!,
  });
  applyCombatHit(world, world.actors[0]!, world.actors[1]!, ARENA_NAV, {
    damage: 100000,
    guaranteed: true,
    element: "physical",
  });
  expect(world.experience.skills.available).toBe(5);
  expect(world.experience.attributes.available).toBe(25);
  const saved = world.experience.skills;
  consumeMonsterDeathXp(
    world,
    world.events.find((e) => e.kind === "death")!,
  );
  expect(world.experience.skills).toBe(saved);
});
it("allocates multiple ranks atomically and rejects overspending, wrong classes, planned/invalid ranks", () => {
  const state = createSkillProgression("sorcerer", 12);
  const allocated = allocateSkillRanks(state, 12, { [node]: 3 });
  expect(allocated).toMatchObject({
    spent: 3,
    available: 8,
    ranks: { [node]: 3 },
  });
  expect(allocateSkillRanks(allocated, 12, { [node]: 2 }).ranks[node]).toBe(5);
  for (const request of [
    { [node]: 6 },
    { [node]: -1 },
    { [node]: 0 },
    { [node]: 1.5 },
    { unknown: 1 },
    { "warrior-arms-foundation": 1 },
    { "sorcerer-ember-mastery": 1 },
    { [node]: 1, unknown: 1 },
  ])
    expect(() => allocateSkillRanks(state, 12, request)).toThrow();
  expect(() =>
    allocateSkillRanks(createSkillProgression("sorcerer", 2), 2, { [node]: 2 }),
  ).toThrow(/Insufficient/);
  expect(() =>
    allocateSkillRanks(createSkillProgression(), 1, { [node]: 1 }),
  ).toThrow(/Class/);
  expect(state.ranks).toEqual({});
  expect(state.available).toBe(11);
});
it("enforces level/prerequisite ranks and batch order deterministically", () => {
  const raw = structuredClone(CLASS_TREES);
  const mutable = JSON.parse(JSON.stringify(raw));
  mutable.trees[1].branches[0].nodes[1].ability = {
    kind: "existing",
    id: "still-well",
  };
  const trees = validateSkillTrees(mutable, SKILLS);
  const second = "sorcerer-ember-mastery";
  const state = createSkillProgression("sorcerer", 12);
  const first = allocateSkillRanks(
    state,
    12,
    { [node]: 3, [second]: 2 },
    trees,
  );
  expect(first).toEqual(
    allocateSkillRanks(state, 12, { [second]: 2, [node]: 3 }, trees),
  );
  expect(() =>
    allocateSkillRanks(state, 12, { [node]: 2, [second]: 1 }, trees),
  ).toThrow();
  expect(() =>
    allocateSkillRanks(
      createSkillProgression("sorcerer", 11),
      11,
      { [node]: 3, [second]: 1 },
      trees,
    ),
  ).toThrow();
  expect(() =>
    validateSkillProgression({ ...state, available: 12 }, 12),
  ).toThrow();
});
it("gates semantic cast intents and snapshots rank scaling without changing timing/cost", () => {
  const world = createCombat();
  world.hostilesActive = false;
  world.experience = createMonsterExperience(DEFAULT_XP_CURVE[11]!);
  world.experience.skills = createSkillProgression("sorcerer", 12);
  const runtime = createSkills(world);
  const intent = {
    actor: 0,
    skill: "ember-lance",
    target: 1,
    direction: { x: 1, y: 0 },
  };
  requestSkill(runtime, intent);
  stepSkillCombat(runtime);
  expect(runtime.events.at(-1)).toMatchObject({
    kind: "rejected",
    reason: "unavailable",
  });
  expect(runtime.users[0]!.mana).toBe(100);
  world.experience.skills = allocateSkillRanks(world.experience.skills, 12, {
    [node]: 3,
  });
  const base = SKILLS.find((s) => s.id === "ember-lance")!;
  const ranked = actorSkill(runtime, 0, "ember-lance")!;
  expect(ranked.damage).toBeCloseTo(50.4);
  expect({ ...ranked, damage: 42 }).toEqual(base);
  expect(actorSkill(runtime, 0, "iron-fan")).toBeUndefined();
  requestSkill(runtime, intent);
  stepSkillCombat(runtime);
  expect(runtime.users[0]!.mana).toBe(92);
  expect(runtime.users[0]!.cast!.definition!.damage).toBeCloseTo(50.4);
  world.experience.skills = allocateSkillRanks(world.experience.skills, 12, {
    [node]: 2,
  });
  for (let i = 0; i < 9; i++) stepSkillCombat(runtime);
  expect(runtime.effects.bolts[0]!.damage).toBeCloseTo(50.4);
  expect(world.actors[0]!.controller.timeline.phase).toBe("active");
});
it("scales damage, poison and power with configurable coefficients, preserving slow/timings", () => {
  for (const skill of SKILLS) {
    if (skill.kind !== "active") continue;
    expect(scaleRankedSkill(skill, 1)).toEqual(skill);
    const ranked = scaleRankedSkill(skill, 3, {
      damagePerRank: 0.2,
      statusPerRank: 0.25,
    });
    expect(ranked.damage).toBeCloseTo(skill.damage * 1.4);
    expect(ranked.cooldown).toBe(skill.cooldown);
    expect(ranked.windup).toBe(skill.windup);
    expect(ranked.recovery).toBe(skill.recovery);
    if (skill.status)
      expect(ranked.status!.magnitude).toBeCloseTo(
        skill.status.magnitude * (skill.status.kind === "slow" ? 1 : 1.5),
      );
  }
});
it("applies ranked damage and self power through the existing combat effect rules", () => {
  const damageAt = (rank: number) => {
    const world = createCombat();
    world.hostilesActive = false;
    world.experience = createMonsterExperience(DEFAULT_XP_CURVE[11]!);
    world.experience.skills = allocateSkillRanks(
      createSkillProgression("sorcerer", 12),
      12,
      { "sorcerer-rime-foundation": rank },
    );
    const runtime = createSkills(world),
      source = world.actors[0]!,
      target = world.actors[1]!;
    target.controller.walker.position = {
      ...source.controller.walker.position,
      x: source.controller.walker.position.x + 0.5,
    };
    const hp = target.hp;
    requestSkill(runtime, {
      actor: 0,
      skill: "rime-ring",
      target: null,
      direction: { x: 1, y: 0 },
    });
    for (let i = 0; i < 12; i++) stepSkillCombat(runtime);
    expect(
      runtime.effects.statuses.find((s) => s.kind === "slow")!.magnitude,
    ).toBe(0.4);
    return hp - target.hp;
  };
  expect(damageAt(3)).toBeGreaterThan(damageAt(1));
  expect(damageAt(3)).toBe(damageAt(3));
  const world = createCombat();
  world.hostilesActive = false;
  world.experience = createMonsterExperience(DEFAULT_XP_CURVE[11]!);
  world.experience.skills = allocateSkillRanks(
    createSkillProgression("warrior", 12),
    12,
    { "warrior-resolve-foundation": 3 },
  );
  const runtime = createSkills(world);
  requestSkill(runtime, {
    actor: 0,
    skill: "oath-echo",
    target: null,
    direction: { x: 0, y: 0 },
  });
  for (let i = 0; i < 10; i++) stepSkillCombat(runtime);
  expect(
    runtime.effects.statuses.find((s) => s.kind === "power")!.magnitude,
  ).toBeCloseTo(0.36);
});

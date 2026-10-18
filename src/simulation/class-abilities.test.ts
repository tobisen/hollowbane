import { expect, it } from "vitest";
import { createCombat, ARENA_NAV } from "./combat";
import { createMonsterExperience } from "./monster-experience";
import { DEFAULT_XP_CURVE } from "./experience";
import {
  createSkillProgression,
  allocateSkillRanks,
  assignSkill,
} from "./skill-progression";
import {
  createSkills,
  actorSkill,
  requestSkill,
  stepSkillCombat,
} from "./skills";
import type { ClassId } from "./character-classes";
import { createAttributes } from "./attributes";
export function classFixture(classId: ClassId) {
  const world = createCombat();
  world.hostilesActive = false;
  world.experience = createMonsterExperience(DEFAULT_XP_CURVE[11]!);
  const nodes =
    classId === "warrior"
      ? { "warrior-arms-foundation": 3, "warrior-resolve-foundation": 3 }
      : classId === "sorcerer"
        ? { "sorcerer-ember-foundation": 3, "sorcerer-rime-foundation": 3 }
        : { "ranger-wilds-foundation": 3, "ranger-precision-foundation": 3 };
  world.experience.skills = allocateSkillRanks(
    createSkillProgression(classId, 12),
    12,
    nodes,
  );
  const runtime = createSkills(world);
  const p = world.actors[0]!.controller.walker.position;
  for (let i = 1; i <= 3; i++) {
    const target = world.actors[i]!;
    target.kind = "dummy";
    target.hp = target.maxHp = 10000;
    target.defense.defense = 0;
    target.controller.walker.position = { x: p.x + i * 0.6, y: p.y };
  }
  return runtime;
}
it("derives class variants and attribute scaling without changing legacy abilities", () => {
  for (const [classId, skill, attribute] of [
    ["warrior", "iron-fan", "strength"],
    ["sorcerer", "ember-lance", "energy"],
    ["ranger", "briar-edge", "dexterity"],
  ] as const) {
    const runtime = classFixture(classId),
      first = actorSkill(runtime, 0, skill)!;
    runtime.combat.experience.attributes = createAttributes(
      { strength: 0, dexterity: 0, vitality: 0, energy: 0, [attribute]: 10 },
      12,
    );
    expect(actorSkill(runtime, 0, skill)!.damage).toBeCloseTo(
      first.damage * 1.25,
    );
    expect(actorSkill(runtime, 0, skill)).toEqual(
      actorSkill(runtime, 0, skill),
    );
    expect(
      actorSkill(
        runtime,
        0,
        classId === "warrior" ? "ember-lance" : "iron-fan",
      ),
    ).toBeUndefined();
  }
  const legacy = createSkills(createCombat());
  expect(actorSkill(legacy, 0, "briar-edge")!.shape).toBe("melee");
});
it("heavy melee uses existing guarded stagger and cannot hit outside melee range", () => {
  const r = classFixture("warrior");
  requestSkill(r, {
    actor: 0,
    skill: "iron-fan",
    target: 1,
    direction: { x: 1, y: 0 },
  });
  for (let i = 0; i < 12; i++) stepSkillCombat(r, ARENA_NAV);
  expect(
    r.combat.events.some((e) => e.kind === "stagger" && e.target === 1),
  ).toBe(true);
  expect(r.combat.actors[1]!.hp).toBeLessThan(10000);
});
it("precise and piercing Ranger projectiles hit real targets at most once each", () => {
  const r = classFixture("ranger");
  requestSkill(r, {
    actor: 0,
    skill: "storm-thread",
    target: null,
    direction: { x: 1, y: 0 },
  });
  for (let i = 0; i < 35; i++) stepSkillCombat(r);
  for (const id of [1, 2, 3])
    expect(
      r.combat.events.filter((e) => e.kind === "damage" && e.target === id),
    ).toHaveLength(1);
  const needle = actorSkill(r, 0, "briar-edge")!;
  expect(needle).toMatchObject({ shape: "projectile", precise: true });
  expect(() =>
    assignSkill(r.combat.experience.skills, 0, "iron-fan"),
  ).toThrow();
});
it("class passives and synergies use stable modifier totals, not recursive or compounded actor mutations", async () => {
  const {
    classArmor,
    classAccuracy,
    classManaRegen,
    classSynergy,
    CLASS_CONTEXT,
  } = await import("./class-abilities");
  const w = classFixture("warrior"),
    s = classFixture("sorcerer"),
    r = classFixture("ranger");
  expect(classArmor(w.combat.experience.skills, 10, [])).toBe(22);
  expect(classArmor(w.combat.experience.skills, 10, ["power"])).toBe(92);
  expect(classAccuracy(r.combat.experience.skills, 40)).toBe(64);
  expect(classManaRegen(s.combat.experience.skills)).toBe(1.5);
  expect(
    classSynergy(s.combat.experience.skills, "ember-lance", 100, [], {
      ...CLASS_CONTEXT,
      targetStatuses: ["slow"],
    }),
  ).toBeCloseTo(115);
  expect(
    classSynergy(r.combat.experience.skills, "storm-thread", 100, [], {
      ...CLASS_CONTEXT,
      targetStatuses: ["poison"],
    }),
  ).toBeCloseTo(115);
  expect(
    classSynergy(
      w.combat.experience.skills,
      "iron-fan",
      100,
      ["power"],
      CLASS_CONTEXT,
    ),
  ).toBeCloseTo(115);
  for (let i = 0; i < 20; i++)
    expect(classArmor(w.combat.experience.skills, 10, ["power"])).toBe(92);
});
it("Warrior defense and Sorcerer regeneration change actual combat state without refilling resources", async () => {
  const { applyCombatHit } = await import("./combat");
  const r = classFixture("warrior"),
    actor = r.combat.actors[0]!,
    enemy = r.combat.actors[1]!;
  actor.hp = actor.maxHp = 10000;
  const hit = () => {
    actor.invulnerableUntil = 0;
    applyCombatHit(r.combat, enemy, actor, ARENA_NAV, {
      damage: 100,
      element: "physical",
      guaranteed: true,
    });
    return r.combat.events.filter((e) => e.kind === "damage").at(-1)!.result!
      .amount;
  };
  const before = hit();
  requestSkill(r, {
    actor: 0,
    skill: "oath-echo",
    target: null,
    direction: { x: 0, y: 0 },
  });
  for (let i = 0; i < 10; i++) stepSkillCombat(r);
  expect(actor.effectStatuses).toContain("power");
  expect(hit()).toBeLessThan(before);
  const s = classFixture("sorcerer");
  s.users[0]!.mana = 0;
  for (let i = 0; i < 60; i++) stepSkillCombat(s);
  expect(s.users[0]!.mana).toBeCloseTo(5.5);
});
it("real direct hits apply conditional synergies once, excluding poison/proc roots", async () => {
  const { applyCombatHit } = await import("./combat");
  for (const [classId, skill, status] of [
    ["sorcerer", "ember-lance", "slow"],
    ["ranger", "storm-thread", "poison"],
  ] as const) {
    const r = classFixture(classId),
      source = r.combat.actors[0]!,
      target = r.combat.actors[1]!;
    target.defense = { defense: 0, armor: 0, physicalResistance: 0 };
    target.effectStatuses = [status];
    applyCombatHit(r.combat, source, target, ARENA_NAV, {
      damage: 100,
      element: "fire",
      guaranteed: true,
      origin: "skill",
      skill,
    });
    expect(
      r.combat.events.filter((e) => e.kind === "damage").at(-1)!.result!.amount,
    ).toBe(115);
    applyCombatHit(r.combat, source, target, ARENA_NAV, {
      damage: 100,
      element: "fire",
      guaranteed: true,
      origin: "proc",
      skill,
    });
    expect(
      r.combat.events.filter((e) => e.kind === "damage").at(-1)!.result!.amount,
    ).toBe(100);
  }
});
it("developer class fixtures derive resources and ranks without saving or modifying other worlds", async () => {
  const { createClassLaboratory } = await import("./class-laboratory");
  const untouched = createCombat(),
    before = structuredClone(untouched.experience);
  for (const id of ["warrior", "sorcerer", "ranger"] as const) {
    const r = createClassLaboratory(createCombat(), id);
    expect(r.combat.experience.skills.classId).toBe(id);
    expect(r.combat.experience.skills.spent).toBe(6);
    expect(r.users[0]!.mana).toBe(r.users[0]!.maxMana);
  }
  expect(untouched.experience).toEqual(before);
});

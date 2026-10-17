import { expect, it } from "vitest";
import { createEncounter, ENCOUNTER_NAV, finishEncounter } from "./encounter";
import { stepMonsterAI } from "./monster-ai";
import { queueMonsterSkills } from "./monster-skills";
import { createSkills, stepSkillCombat } from "./skills";
function run(seed = 42) {
  const e = createEncounter(5, seed),
    r = createSkills(e.combat);
  e.combat.actors[0]!.invulnerableUntil = 9999;
  for (let i = 0; i < 600; i++) {
    e.work = {
      ...stepMonsterAI(e.combat, e.brains, ENCOUNTER_NAV),
      separationCorrections: 0,
    };
    queueMonsterSkills(r, e.brains, ENCOUNTER_NAV);
    stepSkillCombat(r, ENCOUNTER_NAV);
    finishEncounter(e);
  }
  return { e, r };
}
it("caster/support share timed resource-consuming abilities deterministically", () => {
  const { r } = run();
  expect(
    r.events.some(
      (e) => e.actor !== 0 && e.kind === "start" && e.skill === "ember-lance",
    ),
  ).toBe(true);
  expect(
    r.events.some(
      (e) => e.actor !== 0 && e.kind === "effect" && e.skill === "oath-echo",
    ),
  ).toBe(true);
  expect(r.users.some((u) => u.actor !== 0 && u.mana < 100)).toBe(true);
  expect(run()).toEqual(run());
});
it("cooldown or missing threat preserves normal attacks and no input is consulted", () => {
  const e = createEncounter(5),
    r = createSkills(e.combat),
    brain = e.brains.find((b) => b.role === "caster")!;
  brain.state = "attack";
  brain.threat = null;
  queueMonsterSkills(r, e.brains, ENCOUNTER_NAV);
  expect(r.pending).toEqual([]);
  brain.threat = 0;
  r.users.find((u) => u.actor === brain.id)!.cooldowns["ember-lance"] = 999;
  queueMonsterSkills(r, e.brains, ENCOUNTER_NAV);
  expect(r.pending).toEqual([]);
});

it("spawn/despawn sync drops removed ability owners", () => {
  const e = createEncounter(5),
    r = createSkills(e.combat);
  e.combat.actors = e.combat.actors.slice(0, 2);
  stepSkillCombat(r, ENCOUNTER_NAV);
  expect(r.users.map((u) => u.actor)).toEqual([0, 1]);
});

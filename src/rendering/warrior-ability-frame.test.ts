import { expect, it } from "vitest";
import { createCombat } from "../simulation/combat";
import { createMonsterExperience } from "../simulation/monster-experience";
import { DEFAULT_XP_CURVE } from "../simulation/experience";
import {
  allocateSkillRanks,
  createSkillProgression,
} from "../simulation/skill-progression";
import {
  createSkills,
  requestSkill,
  stepSkillCombat,
} from "../simulation/skills";
import { warriorAbilityFrame } from "./warrior-ability-frame";

function fixture() {
  const combat = createCombat(42);
  combat.hostilesActive = false;
  combat.experience = createMonsterExperience(DEFAULT_XP_CURVE[11]!);
  combat.experience.skills = allocateSkillRanks(
    createSkillProgression("warrior", 12),
    12,
    { "warrior-arms-foundation": 1, "warrior-resolve-foundation": 1 },
  );
  const player = combat.actors[0]!;
  combat.actors[1]!.controller.walker.position = {
    x: player.controller.walker.position.x + 0.6,
    y: player.controller.walker.position.y,
  };
  return createSkills(combat);
}

it.each(["iron-fan", "oath-echo"] as const)(
  "%s pose activation matches actual skill release at all speed breakpoints without changing simulation",
  (skill) => {
    for (const speed of [0, 25, 60, 100]) {
      const runtime = fixture();
      runtime.combat.actors[0]!.attackSpeed = speed;
      runtime.users[0]!.castSpeed = speed;
      requestSkill(runtime, {
        actor: 0,
        skill,
        target: skill === "iron-fan" ? 1 : null,
        direction: { x: 1, y: 0 },
      });
      const baseline = structuredClone(runtime);
      for (let tick = 0; tick < 50; tick++) {
        stepSkillCombat(runtime);
        stepSkillCombat(baseline);
        const pose = warriorAbilityFrame(
          runtime.combat.actors[0]!.controller.timeline,
          runtime.users[0]!.cast,
        );
        const release = runtime.events.some(
          (e) => e.tick === runtime.combat.tick && e.kind === "effect",
        );
        if (release) expect(pose).toEqual({ ability: skill, frame: 5 });
        if (pose?.frame === 5) expect(release).toBe(true);
        expect(runtime).toEqual(baseline);
      }
      expect(runtime.events.filter((e) => e.kind === "effect")).toHaveLength(1);
      expect(runtime.users[0]!.cast).toBeNull();
      expect(
        warriorAbilityFrame(
          runtime.combat.actors[0]!.controller.timeline,
          runtime.users[0]!.cast,
        ),
      ).toBeNull();
    }
  },
);

it("yields immediately to interruption/death, stale sequences and other classes' casts", () => {
  const runtime = fixture();
  requestSkill(runtime, {
    actor: 0,
    skill: "oath-echo",
    target: null,
    direction: { x: 0, y: 0 },
  });
  stepSkillCombat(runtime);
  const timeline = runtime.combat.actors[0]!.controller.timeline;
  const cast = runtime.users[0]!.cast!;
  expect(warriorAbilityFrame(timeline, cast)).not.toBeNull();
  for (const phase of ["hitstun", "dead", "idle"] as const)
    expect(warriorAbilityFrame({ ...timeline, phase }, cast)).toBeNull();
  expect(
    warriorAbilityFrame(timeline, { ...cast, sequence: cast.sequence + 1 }),
  ).toBeNull();
  expect(
    warriorAbilityFrame(timeline, { ...cast, skill: "ember-lance" }),
  ).toBeNull();
  expect(warriorAbilityFrame(timeline, null)).toBeNull();
});

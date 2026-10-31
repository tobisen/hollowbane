import { describe, expect, it } from "vitest";
import { createCombat } from "../simulation/combat";
import { createMonsterExperience } from "../simulation/monster-experience";
import { DEFAULT_XP_CURVE } from "../simulation/experience";
import {
  allocateSkillRanks,
  createSkillProgression,
} from "../simulation/skill-progression";
import { createTimeline, stepTimeline } from "../simulation/combat-timing";
import { WarriorMotion } from "./warrior-pose";
import { classicActorFrame, observeClassicMotion } from "./classic-actor-frame";
import {
  createSkills,
  requestSkill,
  stepSkillCombat,
} from "../simulation/skills";
import manifest from "../../public/dev/classic-visual/actors.json";

describe("bounded classic actor selection", () => {
  it.each(["iron-fan", "oath-echo"] as const)(
    "reuses approved poses for %s across directions and speed breakpoints without extra skill effects",
    (skill) => {
      const names = new Set(manifest.frames.map((f) => f.name));
      for (const speed of [0, 25, 60, 100]) {
        const combat = createCombat();
        combat.hostilesActive = false;
        combat.experience = createMonsterExperience(DEFAULT_XP_CURVE[11]!);
        combat.experience.skills = allocateSkillRanks(
          createSkillProgression("warrior", 12),
          12,
          { "warrior-arms-foundation": 1, "warrior-resolve-foundation": 1 },
        );
        const actor = combat.actors[0]!;
        actor.attackSpeed = speed;
        combat.actors[1]!.controller.walker.position = {
          x: actor.controller.walker.position.x + 0.6,
          y: actor.controller.walker.position.y,
        };
        const runtime = createSkills(combat);
        runtime.users[0]!.castSpeed = speed;
        requestSkill(runtime, {
          actor: 0,
          skill,
          target: skill === "iron-fan" ? 1 : null,
          direction: { x: 1, y: 0 },
        });
        const baseline = structuredClone(runtime);
        const motion = new WarriorMotion();
        for (let tick = 0; tick < 60; tick++) {
          stepSkillCombat(runtime);
          stepSkillCombat(baseline);
          observeClassicMotion(motion, actor, combat.tick);
          const before = structuredClone(actor);
          const cast = runtime.users[0]!.cast;
          for (let direction = 0; direction < 8; direction++) {
            const copy = structuredClone(actor);
            copy.controller.walker.direction = direction;
            const pose = classicActorFrame(
              copy,
              combat.tick,
              null,
              motion,
              "warrior",
              cast,
            );
            expect(names.has(pose.name)).toBe(true);
            if (
              runtime.events.some(
                (e) => e.tick === combat.tick && e.kind === "effect",
              )
            )
              expect(pose).toMatchObject({ clip: "primary", frame: 5 });
          }
          expect(actor).toEqual(before);
          expect(runtime).toEqual(baseline);
        }
        expect(runtime.events.filter((e) => e.kind === "effect")).toHaveLength(
          1,
        );
      }
    },
  );
  it("preserves the actual strike event at every tested windup speed without changing actors", () => {
    for (const windup of [1, 3, 6, 12]) {
      const actor = createCombat().actors[0]!,
        motion = new WarriorMotion();
      actor.controller.timeline = createTimeline({
        windup,
        active: 2,
        recovery: 12,
      });
      let strikes = 0;
      for (let tick = 0; tick < windup + 16; tick++) {
        const result = stepTimeline(
          actor.controller.timeline,
          tick === 0 ? "attack" : "wait",
        );
        actor.controller.timeline = result.state;
        const before = structuredClone(actor);
        observeClassicMotion(motion, actor, tick);
        const frame = classicActorFrame(actor, tick, null, motion, "warrior");
        expect(actor).toEqual(before);
        if (result.events.some((e) => e.kind === "strike")) {
          strikes++;
          expect(frame).toMatchObject({ clip: "primary", frame: 5 });
        }
        if (result.state.phase === "windup")
          expect(frame.frame).toBeLessThan(5);
        if (result.state.phase === "active") expect(frame.frame).toBe(5);
      }
      expect(strikes).toBe(1);
    }
  });
  it("interrupts the attack immediately, samples actual hitstun and holds the terminal death", () => {
    const actor = createCombat().actors[0]!,
      motion = new WarriorMotion();
    actor.controller.timeline = stepTimeline(
      actor.controller.timeline,
      "attack",
    ).state;
    actor.controller.timeline = stepTimeline(
      actor.controller.timeline,
      "hit",
      9,
    ).state;
    observeClassicMotion(motion, actor, 1);
    expect(classicActorFrame(actor, 1, null, motion, "raider")).toMatchObject({
      clip: "hit",
      frame: 0,
    });
    actor.controller.timeline = stepTimeline(
      actor.controller.timeline,
      "kill",
    ).state;
    const seen = new Set<number>();
    for (let tick = 2; tick < 70; tick++) {
      observeClassicMotion(motion, actor, tick);
      const frame = classicActorFrame(actor, tick, 2, motion, "raider");
      expect(frame.clip).toBe("death");
      seen.add(frame.frame);
      if (tick >= 32) expect(frame.frame).toBe(15);
    }
    expect([...seen]).toEqual([0, 3, 6, 9, 12, 15]);
  });
  it("uses matching distance phase for walk and run without mutating actual gait", () => {
    const walk = createCombat().actors[0]!,
      run = structuredClone(walk),
      a = new WarriorMotion(),
      b = new WarriorMotion();
    walk.controller.walker.walking = run.controller.walker.walking = true;
    run.controller.walker.gait = "run";
    for (let tick = 0; tick < 32; tick++) {
      walk.controller.walker.distance = run.controller.walker.distance =
        tick * 0.04;
      observeClassicMotion(a, walk, tick);
      observeClassicMotion(b, run, tick);
      expect(classicActorFrame(walk, tick, null, a, "runner").frame).toBe(
        classicActorFrame(run, tick, null, b, "runner").frame,
      );
      expect(run.controller.walker.gait).toBe("run");
    }
  });
});

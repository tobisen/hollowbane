import { expect, it } from "vitest";
import {
  applyCombatHit,
  ARENA_NAV,
  createCombat,
  stepCombat,
} from "../simulation/combat";
import { commandCombat } from "../simulation/combat-targeting";
import { warriorAttackFrame } from "./warrior-attack-frame";
import {
  createSkills,
  requestSkill,
  stepSkillCombat,
} from "../simulation/skills";
import { warriorAbilityFrame } from "./warrior-ability-frame";
import {
  observeWarriorHit,
  warriorHitFrame,
  type WarriorHitCue,
} from "./warrior-hit-frame";

it.each([0, 25, 60])(
  "fits actual recovery bonus %i, guarded follow-up hits and the exact movement release",
  (bonus) => {
    const w = createCombat(42),
      player = w.actors[0]!,
      enemy = w.actors[1]!;
    w.hostilesActive = false;
    player.recoveryBonus = bonus;
    applyCombatHit(w, enemy, player, ARENA_NAV, {
      damage: 10,
      element: "physical",
      guaranteed: true,
      stagger: true,
    });
    let cue: WarriorHitCue | null = observeWarriorHit(
      null,
      player.controller.timeline,
    );
    const duration = player.controller.timeline.remaining;
    const baseline = structuredClone(w);
    expect(warriorHitFrame(player.controller.timeline, cue)).toBe(0);
    for (let i = 0; i < duration; i++) {
      if (i === 1) {
        applyCombatHit(w, enemy, player, ARENA_NAV, {
          damage: 2,
          element: "physical",
          guaranteed: true,
          stagger: true,
        });
        applyCombatHit(
          baseline,
          baseline.actors[1]!,
          baseline.actors[0]!,
          ARENA_NAV,
          { damage: 2, element: "physical", guaranteed: true, stagger: true },
        );
      }
      stepCombat(w);
      stepCombat(baseline);
      cue = observeWarriorHit(cue, player.controller.timeline);
      if (player.controller.timeline.phase === "hitstun") {
        expect(cue!.duration).toBe(duration);
        expect(
          warriorHitFrame(player.controller.timeline, cue),
        ).toBeGreaterThanOrEqual(0);
        expect(
          warriorHitFrame(player.controller.timeline, cue),
        ).toBeLessThanOrEqual(5);
        if (player.controller.timeline.remaining === 1)
          expect(warriorHitFrame(player.controller.timeline, cue)).toBe(5);
      } else {
        expect(i).toBe(duration - 1);
        expect(player.controller.timeline.phase).toBe("idle");
        expect(warriorHitFrame(player.controller.timeline, cue)).toBeNull();
      }
      expect(w).toEqual(baseline);
    }
    expect(
      w.events.filter((e) => e.kind === "stagger" && e.target === 0),
    ).toHaveLength(1);
  },
);

it.each(["weapon", "ability"] as const)(
  "actual guarded hit interrupts %s before release and death immediately yields",
  (mode) => {
    const w = createCombat(42),
      p = w.actors[0]!,
      e = w.actors[1]!;
    w.hostilesActive = false;
    e.controller.walker.position = {
      x: p.controller.walker.position.x + 0.5,
      y: p.controller.walker.position.y,
    };
    const skills = createSkills(w);
    if (mode === "ability")
      requestSkill(skills, {
        actor: 0,
        skill: "oath-echo",
        target: null,
        direction: { x: 1, y: 0 },
      });
    else
      p.controller = commandCombat(p.controller, {
        kind: "attack",
        target: 1,
        repeat: false,
      });
    stepSkillCombat(skills);
    expect(p.controller.timeline.phase).toBe("windup");
    applyCombatHit(w, e, p, ARENA_NAV, {
      damage: 10,
      element: "physical",
      guaranteed: true,
      stagger: true,
    });
    let cue = observeWarriorHit(null, p.controller.timeline);
    expect(warriorHitFrame(p.controller.timeline, cue)).toBe(0);
    expect(warriorAttackFrame(p.controller.timeline, "primary")).toBeNull();
    expect(
      warriorAbilityFrame(p.controller.timeline, skills.users[0]!.cast),
    ).toBeNull();
    stepSkillCombat(skills);
    expect(skills.events.filter((e) => e.kind === "effect")).toHaveLength(0);
    p.hp = 1;
    applyCombatHit(w, e, p, ARENA_NAV, {
      damage: 1000,
      element: "physical",
      guaranteed: true,
    });
    cue = observeWarriorHit(cue, p.controller.timeline);
    expect(p.controller.timeline.phase).toBe("dead");
    expect(warriorHitFrame(p.controller.timeline, cue)).toBeNull();
  },
);

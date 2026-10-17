import { expect, it } from "vitest";
import { createCombat, stepCombat } from "../simulation/combat";
import { commandCombat } from "../simulation/combat-targeting";
import { combatPose, recordMotion, type MotionCues } from "./combat-motion";
it.each([
  [0, 12],
  [20, 10],
  [50, 8],
  [90, 6],
])("impact at speed %i follows strike tick %i exactly", (speed, frame) => {
  const w = createCombat(),
    a = w.actors[0]!;
  w.hostilesActive = false;
  a.attackSpeed = speed;
  w.actors[1]!.controller.walker.position = {
    ...a.controller.walker.position,
    x: a.controller.walker.position.x + 0.5,
  };
  a.controller = commandCombat(a.controller, {
    kind: "attack",
    target: 1,
    repeat: false,
  });
  const cues: MotionCues = {};
  for (let i = 1; i <= frame; i++) {
    stepCombat(w);
    recordMotion(cues, w.actors, w.events, w.tick);
    expect(combatPose(a, cues[0], w.tick).impact).toBe(i === frame ? 1 : 0);
  }
  expect(cues[0]!.strikeAt).toBe(frame);
});
it("directional recoil and death pose never mutate simulation", () => {
  const w = createCombat(),
    a = w.actors[0]!,
    b = w.actors[1]!,
    cues: MotionCues = {};
  recordMotion(
    cues,
    w.actors,
    [
      {
        tick: 1,
        actor: 0,
        target: 1,
        kind: "damage",
        result: {
          type: "physical",
          outcome: "hit",
          critical: false,
          amount: 5,
          chance: 1,
        },
      },
      { tick: 1, actor: 0, target: 1, kind: "death" },
    ],
    1,
  );
  b.hp = 0;
  const original = JSON.stringify(w);
  expect(cues[1]!.away.x).toBeGreaterThan(0);
  expect(combatPose(b, cues[1], 31).fall).toBe(1);
  expect(combatPose(b, cues[1], 31).alpha).toBeCloseTo(0.45);
  combatPose(a, undefined, 31);
  expect(JSON.stringify(w)).toBe(original);
});
it("interrupted windup produces no fabricated impact", () => {
  const w = createCombat(),
    a = w.actors[0]!,
    cues: MotionCues = {};
  a.controller.timeline.phase = "hitstun";
  a.controller.timeline.remaining = 6;
  for (let i = 0; i < 6; i++) {
    stepCombat(w);
    recordMotion(cues, w.actors, w.events, w.tick);
  }
  expect(combatPose(a, cues[0], w.tick).impact).toBe(0);
});

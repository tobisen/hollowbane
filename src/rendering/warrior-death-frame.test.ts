import { expect, it } from "vitest";
import {
  applyCombatHit,
  ARENA_NAV,
  createCombat,
  stepCombat,
} from "../simulation/combat";
import { recordMotion, type MotionCues } from "./combat-motion";
import { warriorDeathFrame } from "./warrior-death-frame";

it("uses the real lethal event and holds the terminal pose without mutating corpse rules", () => {
  const world = createCombat(42),
    player = world.actors[0]!,
    enemy = world.actors[1]!;
  world.hostilesActive = false;
  const cues: MotionCues = {};
  applyCombatHit(world, enemy, player, ARENA_NAV, {
    damage: 10000,
    element: "physical",
    guaranteed: true,
  });
  recordMotion(cues, world.actors, world.events, world.tick);
  const baseline = structuredClone(world);
  expect(cues[0]!.deathAt).toBe(world.tick);
  expect(
    warriorDeathFrame(player.controller.timeline, world.tick, cues[0]!.deathAt),
  ).toBe(0);
  const frames = [];
  for (let i = 0; i < 90; i++) {
    stepCombat(world);
    stepCombat(baseline);
    recordMotion(cues, world.actors, world.events, world.tick);
    const f = warriorDeathFrame(
      player.controller.timeline,
      world.tick,
      cues[0]!.deathAt,
    );
    frames.push(f);
    if (i >= 29) expect(f).toBe(15);
    expect(world).toEqual(baseline);
  }
  expect(new Set(frames).size).toBe(16);
  expect(
    world.events.filter((e) => e.kind === "death" && e.target === 0),
  ).toHaveLength(1);
  expect(world.actors[0]!.hp).toBe(0);
});

it("yields for every living phase and settles an unobserved corpse rather than replaying", () => {
  const timeline = createCombat().actors[0]!.controller.timeline;
  for (const phase of [
    "idle",
    "windup",
    "active",
    "recovery",
    "hitstun",
  ] as const)
    expect(warriorDeathFrame({ ...timeline, phase }, 100, 0)).toBeNull();
  expect(warriorDeathFrame({ ...timeline, phase: "dead" }, 100, null)).toBe(15);
});

import { describe, expect, it } from "vitest";
import {
  breakpointFrames,
  createTimeline,
  stepTimeline,
  type CombatCommand,
} from "./combat-timing";
const timing = { windup: 3, active: 2, recovery: 4 };
describe("combat timing foundation", () => {
  it("resolves one strike on the exact boundary and completes all commitment frames", () => {
    let state = createTimeline(timing);
    const phases: string[] = [];
    const strikes: number[] = [];
    for (let tick = 0; tick < 9; tick++) {
      const result = stepTimeline(state, "attack");
      state = result.state;
      phases.push(state.phase);
      if (result.events.some((e) => e.kind === "strike")) strikes.push(tick);
    }
    expect(phases).toEqual([
      "windup",
      "windup",
      "active",
      "active",
      "recovery",
      "recovery",
      "recovery",
      "recovery",
      "idle",
    ]);
    expect(strikes).toEqual([2]);
    expect(state.sequence).toBe(1);
    expect(stepTimeline(state, "attack").state.sequence).toBe(2);
  });
  it("rejects movement cancellation in every committed phase", () => {
    let state = createTimeline(timing);
    state = stepTimeline(state, "attack").state;
    for (let tick = 1; tick < 8; tick++) {
      const result = stepTimeline(state, "move");
      expect(result.movementAllowed).toBe(false);
      state = result.state;
    }
    expect(stepTimeline(state, "move").movementAllowed).toBe(true);
  });
  it("interrupts windup before strike and prevents repeated hits extending hitstun", () => {
    let state = stepTimeline(createTimeline(timing), "attack").state;
    for (let tick = 0; tick < 3; tick++) {
      const result = stepTimeline(state, "hit", 3);
      expect(result.events.every((e) => e.kind !== "strike")).toBe(true);
      state = result.state;
    }
    expect(state.phase).toBe("idle");
  });
  it("death takes priority in every phase and is terminal", () => {
    for (const phase of [
      "idle",
      "windup",
      "active",
      "recovery",
      "hitstun",
    ] as const) {
      const dead = stepTimeline(
        { ...createTimeline(timing), phase, remaining: 1 },
        "kill",
      );
      expect(dead.state.phase).toBe("dead");
      for (const command of ["attack", "hit", "move", "wait"] as const)
        expect(stepTimeline(dead.state, command).state).toEqual(dead.state);
    }
  });
  it("replays without mutating snapshots", () => {
    const initial = createTimeline(timing);
    const replay = () =>
      (
        ["attack", "wait", "wait", "hit", "wait", "kill"] as CombatCommand[]
      ).reduce((s, c) => stepTimeline(s, c).state, initial);
    expect(replay()).toEqual(replay());
    expect(initial).toEqual(createTimeline(timing));
  });
  it("uses inclusive discrete thresholds for attack speed and hit recovery", () => {
    const table = [
      { minimum: 0, frames: 8 },
      { minimum: 20, frames: 6 },
      { minimum: 50, frames: 4 },
    ];
    expect(
      [0, 19.99, 20, 49.99, 50, 100].map((x) => breakpointFrames(x, table)),
    ).toEqual([8, 8, 6, 6, 4, 4]);
    for (const value of [NaN, Infinity, -1])
      expect(() => breakpointFrames(value, table)).toThrow();
    expect(() => breakpointFrames(1, [])).toThrow();
    expect(() => breakpointFrames(1, [...table].reverse())).toThrow();
    expect(() => breakpointFrames(1, [{ minimum: 0, frames: 0 }])).toThrow();
  });
  it("validates frame durations and isolates timing configuration", () => {
    for (const value of [0, -1, 1.5, Infinity, NaN])
      expect(() => createTimeline({ ...timing, windup: value })).toThrow();
    const config = { ...timing };
    const state = createTimeline(config);
    config.windup = 99;
    expect(state.timing.windup).toBe(3);
    expect(() => stepTimeline(state, "hit", 0)).toThrow();
  });
});

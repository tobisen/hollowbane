import { describe, expect, it } from "vitest";
import { createRng, project, step, unproject, type Simulation } from "./core";
describe("deterministic foundation", () => {
  it("replays RNG seeds exactly without sharing state", () => {
    const a = createRng(17),
      b = createRng(17),
      c = createRng(18);
    const values = Array.from({ length: 1000 }, () => a());
    expect(values).toEqual(Array.from({ length: 1000 }, () => b()));
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
    expect(c()).not.toBe(values[0]);
  });
  it("replays tick intents and rejects out-of-order input", () => {
    const initial: Simulation = { tick: 0, seed: 42, trace: [] };
    const trace = Array.from({ length: 120 }, (_, tick) => ({
      tick,
      kind: "wait" as const,
    }));
    expect(trace.reduce(step, initial)).toEqual(trace.reduce(step, initial));
    expect(initial.trace).toEqual([]);
    expect(() => step(initial, { tick: 1, kind: "wait" })).toThrow();
  });
  it("round trips positive and negative isometric coordinates", () => {
    for (let x = -10; x <= 10; x++)
      for (let y = -10; y <= 10; y++) {
        const p = project(x, y);
        expect(unproject(p.x, p.y)).toEqual({ x, y });
      }
  });
});

import { describe, expect, it } from "vitest";
import content from "../content/skills.json";
import { validateSkills } from "./skill-content";
describe("skill content", () => {
  it("owns six original active prototypes and a passive without caller aliasing", () => {
    const result = validateSkills(content);
    expect(result.filter((s) => s.kind === "active")).toHaveLength(6);
    expect(result.filter((s) => s.kind === "passive")).toHaveLength(1);
    expect(result).not.toBe(content);
  });
  it("rejects invalid identities, timing, elements and status rules atomically", () => {
    for (const patch of [
      { id: "BAD" },
      { windup: 0 },
      { mana: NaN },
      { element: "water" },
      { radius: Infinity },
      { maxTargets: 51 },
      {
        status: {
          kind: "slow",
          duration: 4,
          interval: 1,
          magnitude: 1,
          stacking: "refresh",
        },
      },
    ])
      expect(() => validateSkills([{ ...content[0], ...patch }])).toThrow();
    expect(() => validateSkills([content[0], content[0]])).toThrow();
    expect(() =>
      validateSkills([
        { kind: "passive", id: "x", name: "X", manaPerSecond: -1 },
      ]),
    ).toThrow();
  });
});

import { expect, it } from "vitest";
import { createTimeline, stepTimeline } from "../simulation/combat-timing";
import { warriorAttackFrame } from "./warrior-attack-frame";

it.each(["primary", "secondary"] as const)(
  "%s impact starts on the real strike event at every authored speed breakpoint",
  (attack) => {
    const offset = attack === "primary" ? 0 : 12;
    for (const windup of [1, 3, 6, 8, 10, 12]) {
      let timeline = createTimeline({
        windup,
        active: 2,
        recovery: windup + 6,
      });
      let strikes = 0;
      for (let tick = 0; tick < windup * 2 + 8; tick++) {
        const result = stepTimeline(timeline, tick === 0 ? "attack" : "wait");
        timeline = result.state;
        const snapshot = structuredClone(timeline);
        const frame = warriorAttackFrame(timeline, attack);
        expect(timeline).toEqual(snapshot);
        if (result.events.some((e) => e.kind === "strike")) {
          strikes++;
          expect(tick).toBe(windup - 1);
          expect(frame).toBe(offset + 5);
        }
        if (timeline.phase === "windup") {
          expect(frame).toBeGreaterThanOrEqual(offset);
          expect(frame).toBeLessThan(offset + 5);
        }
        if (timeline.phase === "active") expect(frame).toBe(offset + 5);
        if (timeline.phase === "recovery") {
          expect(frame).toBeGreaterThanOrEqual(offset + 6);
          expect(frame).toBeLessThanOrEqual(offset + 11);
        }
        if (timeline.phase === "idle") expect(frame).toBeNull();
      }
      expect(strikes).toBe(1);
    }
  },
);

it("interruption and death immediately yield presentation without an impact", () => {
  const initial = createTimeline({ windup: 12, active: 2, recovery: 18 });
  for (const command of ["hit", "kill"] as const) {
    const windup = stepTimeline(initial, "attack").state;
    const interrupted = stepTimeline(windup, command);
    expect(interrupted.events.some((e) => e.kind === "strike")).toBe(false);
    expect(warriorAttackFrame(interrupted.state, "primary")).toBeNull();
    expect(warriorAttackFrame(interrupted.state, "secondary")).toBeNull();
  }
});

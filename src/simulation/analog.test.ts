import { describe, it, expect } from "vitest";
import { processStick, validateStick, DEFAULT_STICK } from "./analog";
describe("radial analog", () => {
  it("rejects drift, bounds diagonal magnitude and preserves full 360-degree heading", () => {
    expect(processStick(0.1, 0.1)).toEqual({ x: 0, y: 0 });
    for (let a = 0; a < 6.28; a += 0.1) {
      const p = processStick(Math.cos(a), Math.sin(a));
      expect(Math.hypot(p.x, p.y)).toBeCloseTo(1);
      expect(Math.atan2(p.y, p.x)).toBeCloseTo(
        Math.atan2(Math.sin(a), Math.cos(a)),
      );
    }
  });
  it("smoothly scales intensity and supports sensitivity/curves independently", () => {
    const low = processStick(0.3, 0),
      high = processStick(0.8, 0);
    expect(low.x).toBeGreaterThan(0);
    expect(high.x).toBeGreaterThan(low.x);
    expect(
      processStick(0.4, 0, { ...DEFAULT_STICK, sensitivity: 2 }).x,
    ).toBeCloseTo(processStick(0.4, 0).x * 2);
    expect(processStick(NaN, 0)).toEqual({ x: 0, y: 0 });
  });
  it("validates all configurable bounds", () => {
    for (const deadzone of [0, 0.6, NaN])
      expect(() => validateStick({ ...DEFAULT_STICK, deadzone })).toThrow();
    expect(() => validateStick({ ...DEFAULT_STICK, outer: 0.1 })).toThrow();
    expect(validateStick(DEFAULT_STICK)).toEqual(DEFAULT_STICK);
  });
});

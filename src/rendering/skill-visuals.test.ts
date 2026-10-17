import { expect, it } from "vitest";
import { conePoints, SPELL_STYLE } from "./skill-visuals";
import { fromGround } from "../world/navigation";
it("six skills have distinct original palettes and bounded lifetimes", () => {
  expect(Object.keys(SPELL_STYLE)).toHaveLength(6);
  expect(new Set(Object.values(SPELL_STYLE).map((s) => s.color)).size).toBe(6);
  expect(Object.values(SPELL_STYLE).every((s) => s.life <= 30)).toBe(true);
});
it("cone preview matches world-space cone range and angular limits", () => {
  const origin = { x: 0, y: 0 },
    points = conePoints(origin, { x: 1, y: 0 }, 1.8, 0.65)
      .slice(1)
      .map(fromGround);
  expect(points).toHaveLength(13);
  for (const p of points) {
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(1.8);
    expect(p.x / 1.8).toBeGreaterThanOrEqual(0.65 - 1e-9);
  }
});

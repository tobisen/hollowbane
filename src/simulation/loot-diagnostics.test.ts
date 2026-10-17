import { it, expect } from "vitest";
import { inspectDropTable, simulateLoot } from "./loot-diagnostics";
it("accounts for base-level gates and unique fallback in expected distributions", () => {
  const low = inspectDropTable(1),
    high = inspectDropTable(30);
  expect(low.expectedConditionalQuality.unique).toBe(0);
  expect(low.expectedConditionalQuality.rare).toBeCloseTo(0.03);
  expect(high.expectedConditionalQuality.unique).toBeGreaterThan(0);
  expect(low.bases.filter((b) => b.eligible)).toHaveLength(4);
  expect(() => inspectDropTable(0)).toThrow();
});
it("replays distribution reports and detects invalid sample sizes", () => {
  const c = { seed: 42, areaLevel: 12, monsterLevel: 12, table: "court" };
  const r = simulateLoot(c, 20000);
  expect(r.distributionValid).toBe(true);
  expect(r.invalidItems).toBe(0);
  expect(simulateLoot(c, 20000)).toEqual(r);
  expect(() => simulateLoot(c, 100001)).toThrow();
});

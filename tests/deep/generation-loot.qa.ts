import { expect, test } from "vitest";
import {
  generateWilderness,
  wildernessConnected,
} from "../../src/simulation/wilderness-layout";
import { simulateLoot } from "../../src/simulation/loot-diagnostics";

for (let batch = 0; batch < 4; batch++) {
  test(`extended deterministic world corpus ${batch}`, () => {
    for (let offset = 0; offset < 16; offset++) {
      const seed = Math.imul(batch * 16 + offset, 2654435761) >>> 0;
      for (const area of ["haunted-forest", "forgotten-graveyard"] as const) {
        const generated = generateWilderness(area, seed);
        expect(wildernessConnected(generated.layout)).toBe(true);
        expect(generateWilderness(area, seed)).toEqual(generated);
      }
    }
  });
}
for (const [seed, level] of [
  [0, 1],
  [42, 12],
  [0xffffffff, 30],
] as const) {
  test(`extended 50000-item loot validation seed ${seed} level ${level}`, () => {
    const context = {
      seed,
      areaLevel: level,
      monsterLevel: level,
      table: "court",
    };
    const report = simulateLoot(context, 50000);
    expect(report.invalidItems).toBe(0);
    expect(report.distributionValid).toBe(true);
    expect(simulateLoot(context, 50000)).toEqual(report);
  });
}

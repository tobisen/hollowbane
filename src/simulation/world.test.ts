import { describe, expect, it } from "vitest";
import {
  AREA_IDS,
  WORLD_AREAS,
  areaDefinition,
  areaSeed,
  validateWorldRegistry,
} from "./world";
describe("world registry", () => {
  it("connects all four areas with reciprocal named arrivals and a safe camp", () => {
    expect(validateWorldRegistry(WORLD_AREAS)).toBe(true);
    expect(areaDefinition("ashen-refuge").safe).toBe(true);
    expect(WORLD_AREAS.filter((a) => a.safe)).toHaveLength(1);
  });
  it("rejects duplicate, missing and mismatched connections", () => {
    expect(validateWorldRegistry([...WORLD_AREAS, WORLD_AREAS[0]!])).toBe(
      false,
    );
    expect(validateWorldRegistry(WORLD_AREAS.slice(1))).toBe(false);
    expect(
      validateWorldRegistry(
        WORLD_AREAS.map((a) =>
          a.id === "ashen-refuge"
            ? {
                ...a,
                connections: [
                  {
                    id: "forest",
                    destination: "haunted-forest",
                    arrival: "absent",
                  },
                ],
              }
            : a,
        ),
      ),
    ).toBe(false);
    expect(
      validateWorldRegistry(
        WORLD_AREAS.map((a) => ({ ...a, connections: [] })),
      ),
    ).toBe(false);
  });
  it("derives reproducible seeds independently of area visit order", () => {
    const seeds = AREA_IDS.map((id) => areaSeed(42, id));
    expect(
      [...AREA_IDS]
        .reverse()
        .map((id) => areaSeed(42, id))
        .reverse(),
    ).toEqual(seeds);
    expect(new Set(seeds).size).toBe(4);
    expect(AREA_IDS.map((id) => areaSeed(43, id))).not.toEqual(seeds);
    expect(areaSeed(0xffffffff, "ancient-crypt")).toBeGreaterThanOrEqual(0);
    for (const seed of [-1, 1.5, NaN, Infinity, 0x100000000])
      expect(() => areaSeed(seed, "ashen-refuge")).toThrow();
  });
});

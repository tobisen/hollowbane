import { snapshotChecksum } from "./inventory-save";
import { expect, it } from "vitest";
import { worldLayout, layoutFingerprint } from "./world-layout";
import { areaNavigation, canWalk, segmentWalkable } from "../world/navigation";
import {
  planWorldEncounters,
  ENCOUNTER_SAFE_RADIUS,
  BIOME_ENCOUNTERS,
} from "./world-encounters";
it("reproduces biome-specific safe packs without changing maps, anchors or seeds", () => {
  const digests = new Set<string>(),
    tiers = new Set<string>();
  for (const area of [
    "haunted-forest",
    "forgotten-graveyard",
    "ancient-crypt",
  ] as const)
    for (const seed of [0, 1, 42, 0xffffffff]) {
      const layout = worldLayout(area, seed, 2),
        before = layoutFingerprint(layout),
        plan = planWorldEncounters(layout),
        nav = areaNavigation(layout.map);
      expect(planWorldEncounters(layout)).toEqual(plan);
      expect(plan.length).toBeGreaterThanOrEqual(
        BIOME_ENCOUNTERS[area].groupSize,
      );
      expect(plan.length).toBeLessThanOrEqual(28);
      expect(new Set(plan.map((p) => p.id)).size).toBe(plan.length);
      for (const spawn of plan) {
        expect(canWalk(nav, spawn.position)).toBe(true);
        expect(BIOME_ENCOUNTERS[area].roles).toContain(spawn.role);
        for (const p of [
          layout.spawn,
          ...layout.exits.flatMap((e) => [e.trigger, e.arrival]),
        ])
          expect(
            Math.hypot(p.x - spawn.position.x, p.y - spawn.position.y),
          ).toBeGreaterThanOrEqual(ENCOUNTER_SAFE_RADIUS);
        const leader = plan.find((p) => p.pack === spawn.pack)!;
        expect(segmentWalkable(nav, leader.position, spawn.position)).toBe(
          true,
        );
        tiers.add(spawn.tier);
      }
      expect(layoutFingerprint(layout)).toBe(before);
      digests.add(JSON.stringify(plan));
    }
  expect(
    snapshotChecksum(
      JSON.stringify(
        ["haunted-forest", "forgotten-graveyard", "ancient-crypt"].map((area) =>
          planWorldEncounters(
            worldLayout(
              area as
                "haunted-forest" | "forgotten-graveyard" | "ancient-crypt",
              42,
              2,
            ),
          ),
        ),
      ),
    ),
  ).toMatchInlineSnapshot(`"ff0768e3"`);
  expect(digests.size).toBe(12);
  expect(tiers).toEqual(new Set(["normal", "champion", "elite"]));
  expect(planWorldEncounters(worldLayout("ashen-refuge", 42, 2))).toEqual([]);
  expect(planWorldEncounters(worldLayout("haunted-forest", 42, 1))).toEqual([]);
});

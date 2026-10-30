import { describe, expect, it } from "vitest";
import { dungeonSliceMap, SLICE_LANDMARKS, SLICE_START } from "./dungeon-slice";
import { areaWalkable, validAreaMap } from "./area-map";
import {
  areaNavigation,
  findPath,
  segmentWalkable,
  slideMovement,
} from "../world/navigation";
import { createWalker, moveTick, retarget } from "./locomotion";

describe("isolated broad dungeon slice", () => {
  it("has deterministic valid geometry and four-cell clear connectors", () => {
    const map = dungeonSliceMap();
    expect(validAreaMap(map)).toBe(true);
    expect(map).toEqual(dungeonSliceMap());
    for (const p of [
      { x: 16, y: 8 },
      { x: 26, y: 16 },
      { x: 16, y: 27 },
      { x: 8, y: 18 },
    ])
      expect(areaWalkable(map, p, 1.79)).toBe(true);
  });
  it("walks the full room loop and chapel with real collision and path following", () => {
    const nav = areaNavigation(dungeonSliceMap());
    let walker = createWalker(SLICE_START);
    for (const target of [
      ...SLICE_LANDMARKS.slice(1),
      SLICE_START,
      { x: 16, y: 17 },
    ]) {
      expect(findPath(nav, walker.position, target).length).toBeGreaterThan(0);
      walker = retarget(walker, nav, target);
      for (let i = 0; i < 1500 && walker.route.length; i++) {
        walker = moveTick(walker, nav);
        expect(areaWalkable(nav.logicalMap!, walker.position, 0.2)).toBe(true);
      }
      expect(
        Math.hypot(walker.position.x - target.x, walker.position.y - target.y),
      ).toBeLessThan(0.001);
    }
  });
  it("slides along perimeter and blocks tomb sweeps without tunneling", () => {
    const nav = areaNavigation(dungeonSliceMap());
    const slid = slideMovement(nav, { x: 3.25, y: 6 }, { x: -1, y: 2 });
    expect(slid.x).toBeGreaterThan(3.2);
    expect(slid.y).toBeCloseTo(8, 5);
    expect(segmentWalkable(nav, { x: 27, y: 28 }, { x: 31, y: 28 })).toBe(
      false,
    );
    const stopped = slideMovement(nav, { x: 27, y: 28 }, { x: 4, y: 0 });
    expect(stopped.x).toBeLessThan(28.01);
    expect(areaWalkable(nav.logicalMap!, stopped, 0.2)).toBe(true);
  });
});

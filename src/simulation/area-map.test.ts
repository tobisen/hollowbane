import { expect, it } from "vitest";
import { areaWalkable, validAreaMap, type AreaMap } from "./area-map";
const map: AreaMap = {
  area: "ashen-refuge",
  seed: 1,
  terrain: {
    width: 3,
    height: 3,
    cellSize: 2,
    origin: { x: -3, y: -3 },
    cells: [
      "ground",
      "ground",
      "ground",
      "ground",
      "solid",
      "ground",
      "ground",
      "ground",
      "ground",
    ],
  },
  objects: [
    {
      id: "rock",
      position: { x: -2, y: -2 },
      radius: 0.2,
      blocking: true,
      appearance: "test-only-rock",
    },
  ],
};
it("validates logical layers and rejects malformed dimensions and duplicate props", () => {
  expect(validAreaMap(map)).toBe(true);
  expect(
    validAreaMap({ ...map, terrain: { ...map.terrain, width: Infinity } }),
  ).toBe(false);
  expect(validAreaMap({ ...map, terrain: { ...map.terrain, cells: [] } })).toBe(
    false,
  );
  expect(
    validAreaMap({ ...map, objects: [...map.objects, ...map.objects] }),
  ).toBe(false);
});
it("blocks terrain, bounds and solid props with actor clearance in logical units", () => {
  expect(areaWalkable(map, { x: 0, y: 0 })).toBe(false);
  expect(areaWalkable(map, { x: 2, y: 2 }, 0.3)).toBe(true);
  expect(areaWalkable(map, { x: 3, y: 2 })).toBe(false);
  expect(areaWalkable(map, { x: 2.9, y: 2 }, 0.2)).toBe(false);
  expect(areaWalkable(map, { x: -1.1, y: 0 }, 0.2)).toBe(false);
  expect(areaWalkable(map, { x: -2, y: -2 })).toBe(false);
  expect(
    areaWalkable(
      { ...map, objects: map.objects.map((o) => ({ ...o, blocking: false })) },
      { x: -2, y: -2 },
    ),
  ).toBe(true);
  expect(areaWalkable(map, { x: NaN, y: 0 })).toBe(false);
  expect(areaWalkable(map, { x: 2, y: 2 }, -1)).toBe(false);
});

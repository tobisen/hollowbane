import { expect, it } from "vitest";
import type { AreaMap } from "../simulation/area-map";
import {
  act1CanopyOverlapsGround,
  act1GroundContours,
  act1Project,
  act1Unproject,
} from "./act1-view";

const map: AreaMap = {
  area: "haunted-forest",
  seed: 1,
  objects: [],
  terrain: {
    width: 3,
    height: 3,
    origin: { x: 0, y: 0 },
    cellSize: 1,
    cells: [
      "solid",
      "solid",
      "solid",
      "solid",
      "ground",
      "solid",
      "solid",
      "solid",
      "solid",
    ],
  },
};

it("round trips both projections without changing horizontal scale or using zoom", () => {
  for (const variant of ["a", "b"] as const)
    for (const point of [
      { x: 0, y: 0 },
      { x: 12.31, y: 29.45 },
      { x: -3, y: 5 },
    ]) {
      const inverse = act1Unproject(act1Project(point, variant), variant);
      expect(inverse.x).toBeCloseTo(point.x, 10);
      expect(inverse.y).toBeCloseTo(point.y, 10);
    }
  expect(act1Project({ x: 1, y: 0 }, "a")).toEqual({ x: 832, y: 544 });
  expect(act1Project({ x: 1, y: 0 }, "b")).toEqual({ x: 832, y: 556 });
});

it("rejects foreground crowns covering the player silhouette and permits rear trees", () => {
  for (const variant of ["a", "b"] as const) {
    expect(
      act1CanopyOverlapsGround(map, { x: 2.2, y: 2.2 }, variant, 110, 140),
    ).toBe(true);
    expect(
      act1CanopyOverlapsGround(map, { x: -1, y: -1 }, variant, 110, 140),
    ).toBe(false);
  }
});

it("traces connected terrain once instead of emitting a polygon for each tile", () => {
  const connected: AreaMap = {
    ...map,
    terrain: {
      ...map.terrain,
      cells: [
        "solid",
        "solid",
        "solid",
        "ground",
        "ground",
        "ground",
        "solid",
        "solid",
        "solid",
      ],
    },
  };
  const contours = act1GroundContours(connected);
  expect(contours).toHaveLength(1);
  expect(contours[0]).toHaveLength(8);
  expect(act1GroundContours(map)[0]).toHaveLength(4);
});

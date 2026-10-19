import { expect, it } from "vitest";
import { createCombat } from "./combat";
import { prototypeArea, stepWorldTravel } from "./world-runtime";
import { WorldTravel } from "./world-travel";
import {
  areaNavigation,
  canWalk,
  findPath,
  segmentWalkable,
} from "../world/navigation";
it("travels and returns without replacing the player or progression", () => {
  const world = createCombat(),
    player = world.actors[0]!,
    xp = world.experience;
  const travel = new WorldTravel(42, prototypeArea("ashen-refuge", 42));
  player.controller.walker.position = { x: -2.5, y: 0 };
  const hp = player.hp;
  expect(stepWorldTravel(travel, world)).toBe(true);
  expect(travel.state.area).toBe("haunted-forest");
  expect(world.actors).toEqual([player]);
  expect(world.experience).toBe(xp);
  expect(player.hp).toBe(hp);
  expect(stepWorldTravel(travel, world)).toBe(false);
  player.controller.walker.position = { x: -2.5, y: 0 };
  expect(stepWorldTravel(travel, world)).toBe(true);
  expect(travel.state.area).toBe("ashen-refuge");
  player.hp = 0;
  player.controller.walker.position = { x: -2.5, y: 0 };
  expect(stepWorldTravel(travel, world)).toBe(false);
});
it("uses logical cells and swept clearance through the existing pathfinder", () => {
  const layout = prototypeArea("ashen-refuge", 42);
  const cells = [...layout.map.terrain.cells];
  cells[4 * 8 + 4] = "solid";
  const nav = areaNavigation({
    ...layout.map,
    terrain: { ...layout.map.terrain, cells },
  });
  expect(canWalk(nav, { x: 0.5, y: 0.5 })).toBe(false);
  expect(segmentWalkable(nav, { x: -1, y: 0.5 }, { x: 2, y: 0.5 })).toBe(false);
  const path = findPath(nav, { x: -1, y: 0.5 }, { x: 2, y: 0.5 });
  expect(path.length).toBeGreaterThan(1);
  let from = { x: -1, y: 0.5 };
  for (const to of path) {
    expect(segmentWalkable(nav, from, to)).toBe(true);
    from = to;
  }
});

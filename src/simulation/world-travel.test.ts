import { expect, it } from "vitest";
import { type AreaLayout } from "./area-anchors";
import { areaDefinition, areaSeed, type AreaId } from "./world";
import { WorldTravel } from "./world-travel";
function layout(area: AreaId, seed = 42): AreaLayout {
  return {
    map: {
      area,
      seed: areaSeed(seed, area),
      terrain: {
        width: 12,
        height: 8,
        cellSize: 1,
        origin: { x: 0, y: 0 },
        cells: Array.from({ length: 96 }, () => "ground" as const),
      },
      objects: [],
    },
    spawn: { x: 4.5, y: 4.5 },
    exits: areaDefinition(area).connections.map((c, i) => ({
      id: c.id,
      trigger: { x: 2.5 + i * 6, y: 2.5 },
      arrival: { x: 2.5 + i * 6, y: 4.5 },
    })),
  };
}
it("prepares without live mutation, commits once and returns to the correct arrival", () => {
  const camp = layout("ashen-refuge"),
    forest = layout("haunted-forest");
  const travel = new WorldTravel(42, camp);
  travel.setPosition(camp.exits[0]!.trigger);
  const before = travel.state;
  const handle = travel.prepare("forest", forest)!;
  expect(travel.state).toBe(before);
  expect(travel.commit(handle)).toBe(true);
  expect(travel.state.area).toBe("haunted-forest");
  expect(travel.state.position).toEqual(forest.exits[0]!.arrival);
  const arrived = travel.state;
  expect(travel.commit(handle)).toBe(false);
  expect(travel.state).toBe(arrived);
  expect(travel.prepare("camp", camp)).toBeNull();
  travel.setPosition(forest.exits[0]!.trigger);
  expect(travel.commit(travel.prepare("camp", camp)!)).toBe(true);
  expect(travel.state.position).toEqual(camp.exits[0]!.arrival);
});
it("rejects invalid, wrong-seed, forged, canceled, cross-session and stale preparations atomically", () => {
  const camp = layout("ashen-refuge"),
    forest = layout("haunted-forest");
  const travel = new WorldTravel(42, camp);
  expect(travel.prepare("forest", forest)).toBeNull();
  travel.setPosition(camp.exits[0]!.trigger);
  const before = travel.state;
  expect(travel.prepare("forest", layout("haunted-forest", 43))).toBeNull();
  expect(travel.prepare("forest", { ...forest, exits: [] })).toBeNull();
  expect(travel.prepare("forest", layout("ancient-crypt"))).toBeNull();
  expect(travel.commit({ destination: "haunted-forest" })).toBe(false);
  expect(travel.state).toBe(before);
  const stale = travel.prepare("forest", forest)!;
  travel.setPosition({ x: 2.6, y: 2.5 });
  expect(travel.commit(stale)).toBe(false);
  const canceled = travel.prepare("forest", forest)!;
  travel.cancel();
  expect(travel.commit(canceled)).toBe(false);
  const other = new WorldTravel(42, camp);
  expect(other.commit(travel.prepare("forest", forest)!)).toBe(false);
  expect(travel.setPosition({ x: NaN, y: 0 })).toBe(false);
});
it("copies validated layouts to protect prepared and loaded state from loader mutation", () => {
  const camp = layout("ashen-refuge"),
    forest = layout("haunted-forest");
  const travel = new WorldTravel(42, camp);
  travel.setPosition(camp.exits[0]!.trigger);
  const handle = travel.prepare("forest", forest)!;
  (forest.map.terrain.cells as string[]).fill("solid");
  (camp.spawn as { x: number }).x = -100;
  expect(travel.commit(handle)).toBe(true);
  expect(travel.layout.map.terrain.cells[0]).toBe("ground");
  expect(Object.isFrozen(travel.layout.exits[0]!.arrival)).toBe(true);
  expect(Object.isFrozen(travel.state.position)).toBe(true);
  expect(() => new WorldTravel(42, layout("ashen-refuge", 1))).toThrow();
});

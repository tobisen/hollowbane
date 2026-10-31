import { expect, it } from "vitest";
import { classicAct1Layout } from "./classic-act1-layout";
import { ACT1_CLEARINGS } from "./act1-readability";
import { areaSeed } from "./world";
import { areaNavigation, findPath, segmentWalkable } from "../world/navigation";
import { validGeneratedPlacement } from "./generation-validation";
import {
  planWorldEncounters,
  validWorldMonsterIdentity,
} from "./world-encounters";
import { planWorldContainers, canOpenContainer } from "./world-containers";
import { nearWaypoint } from "./world-waypoint-state";
import { layoutFingerprint, worldLayout } from "./world-layout";
import { WorldTravel } from "./world-travel";

it("keeps every clearing, exit/arrival, waypoint, encounter and container reachable at actor radius", () => {
  for (const seed of [0, 42, 43, 0xffffffff]) {
    const layout = classicAct1Layout(seed);
    expect(validGeneratedPlacement(layout)).toBe(true);
    const nav = areaNavigation(layout.map);
    const encounters = planWorldEncounters(layout);
    const containers = planWorldContainers(layout);
    expect(encounters).toHaveLength(15);
    expect(new Set(encounters.map((e) => e.pack)).size).toBe(5);
    expect([...new Set(encounters.map((e) => e.role))].sort()).toEqual([
      "flanker",
      "melee",
      "ranged",
    ]);
    expect(
      encounters.every((e) =>
        validWorldMonsterIdentity("haunted-forest", e.id),
      ),
    ).toBe(true);
    expect(containers).toHaveLength(6);
    expect(containers.some((c) => c.rare)).toBe(true);
    expect(nearWaypoint(layout, layout.spawn)).toBe(true);
    for (const target of [
      ...ACT1_CLEARINGS.map(({ x, y }) => ({ x, y })),
      ...layout.exits.flatMap((e) => [e.trigger, e.arrival]),
      ...encounters.map((e) => e.position),
      ...containers.map((c) => c.position),
    ]) {
      if (target.x === layout.spawn.x && target.y === layout.spawn.y) continue;
      const path = findPath(nav, layout.spawn, target);
      expect(path.length, JSON.stringify({ seed, target })).toBeGreaterThan(0);
      let previous = layout.spawn;
      for (const point of path) {
        expect(segmentWalkable(nav, previous, point)).toBe(true);
        previous = point;
      }
      expect(previous).toEqual({ x: target.x, y: target.y });
    }
    for (const container of containers)
      expect(canOpenContainer(layout, container, container.position)).toBe(
        true,
      );
  }
});

it("reproduces candidate content without changing either pinned campaign map or approved geometry", () => {
  const before = [1, 2].map((v) => worldLayout("haunted-forest", 42, v));
  const candidate = classicAct1Layout(42);
  expect(classicAct1Layout(42)).toEqual(candidate);
  expect(candidate.map.seed).toBe(areaSeed(42, "haunted-forest"));
  expect(classicAct1Layout(43).map.terrain).toEqual(candidate.map.terrain);
  expect(layoutFingerprint(candidate)).not.toBe(layoutFingerprint(before[1]!));
  expect([1, 2].map((v) => worldLayout("haunted-forest", 42, v))).toEqual(
    before,
  );
  expect(classicAct1Layout(42).map.terrain.cells).not.toBe(
    candidate.map.terrain.cells,
  );
  expect(() => classicAct1Layout(-1)).toThrow();
});

it("uses existing atomic travel for camp, candidate forest and next-area return arrivals", () => {
  const camp = worldLayout("ashen-refuge", 42, 2);
  const forest = classicAct1Layout(42);
  const graveyard = worldLayout("forgotten-graveyard", 42, 2);
  const travel = new WorldTravel(42, camp);
  for (const [id, destination, arrival] of [
    ["forest", forest, "camp"],
    ["graveyard", graveyard, "forest"],
    ["forest", forest, "graveyard"],
    ["camp", camp, "forest"],
  ] as const) {
    const exit = travel.layout.exits.find((e) => e.id === id)!;
    expect(
      findPath(
        areaNavigation(travel.layout.map),
        travel.state.position,
        exit.trigger,
      ).length,
    ).toBeGreaterThan(0);
    expect(travel.setPosition(exit.trigger)).toBe(true);
    const prepared = travel.prepare(id, destination);
    expect(prepared).not.toBeNull();
    expect(travel.commit(prepared!)).toBe(true);
    expect(travel.state.area).toBe(destination.map.area);
    expect(travel.state.position).toEqual(
      destination.exits.find((e) => e.id === arrival)!.arrival,
    );
    expect(travel.commit(prepared!)).toBe(false);
  }
});

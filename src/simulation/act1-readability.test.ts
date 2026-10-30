import { describe, expect, it } from "vitest";
import {
  areaNavigation,
  findPath,
  segmentWalkable,
  slideMovement,
} from "../world/navigation";
import {
  ACT1_CLEARINGS,
  ACT1_START,
  act1ReadabilityMap,
  createAct1Encounter,
  stepAct1Encounter,
} from "./act1-readability";
import { WORLD_ACTOR_RADIUS } from "./area-anchors";
import { areaWalkable, validAreaMap } from "./area-map";
import { createCombat } from "./combat";
import { commandCombat } from "./combat-targeting";
import { createWalker, moveTick, retarget } from "./locomotion";
import { createMonster } from "./monsters";

const LOOP = [
  ACT1_CLEARINGS[0],
  ACT1_CLEARINGS[2],
  ACT1_CLEARINGS[3],
  ACT1_CLEARINGS[1],
  ACT1_CLEARINGS[0],
];

describe("isolated outdoor readability study", () => {
  it("authors repeatable terrain with at least seven world-unit connectors", () => {
    const map = act1ReadabilityMap();
    expect(validAreaMap(map)).toBe(true);
    expect(map).toEqual(act1ReadabilityMap());
    expect(map.terrain).toMatchObject({ width: 54, height: 48, cellSize: 1 });
    // Terrain width is separate from the authored shrine's local collision.
    const terrainOnly = { ...map, objects: [] };
    for (let i = 1; i < LOOP.length; i++) {
      const start = LOOP[i - 1]!,
        end = LOOP[i]!;
      const count = Math.ceil(Math.hypot(end.x - start.x, end.y - start.y) * 2);
      for (let sample = 0; sample <= count; sample++) {
        const point = {
          x: start.x + ((end.x - start.x) * sample) / count,
          y: start.y + ((end.y - start.y) * sample) / count,
        };
        expect(areaWalkable(terrainOnly, point, 3.5)).toBe(true);
        expect(areaWalkable(map, point, WORLD_ACTOR_RADIUS)).toBe(true);
      }
    }
    expect(7 / (WORLD_ACTOR_RADIUS * 2)).toBe(17.5);
    expect(areaWalkable(map, { x: 1, y: 1 }, WORLD_ACTOR_RADIUS)).toBe(false);
  });

  it("walks the entire loop and shrine approach using actual path following", () => {
    const map = act1ReadabilityMap(),
      nav = areaNavigation(map);
    let walker = createWalker(ACT1_START);
    for (const target of [...LOOP.slice(1), { x: 41.5, y: 12 }]) {
      expect(findPath(nav, walker.position, target).length).toBeGreaterThan(0);
      walker = retarget(walker, nav, target);
      for (let tick = 0; tick < 1500 && walker.route.length; tick++) {
        walker = moveTick(walker, nav);
        expect(areaWalkable(map, walker.position, WORLD_ACTOR_RADIUS)).toBe(
          true,
        );
      }
      expect(
        Math.hypot(walker.position.x - target.x, walker.position.y - target.y),
      ).toBeLessThan(0.001);
    }
  });

  it("keeps the shrine and perimeter collision solid under large sweeps", () => {
    const map = act1ReadabilityMap(),
      nav = areaNavigation(map);
    const start = { x: 41, y: 12 };
    expect(segmentWalkable(nav, start, { x: 45, y: 12 })).toBe(false);
    const shrineStop = slideMovement(nav, start, { x: 4, y: 0 });
    expect(shrineStop.x).toBeCloseTo(42.1, 5);
    expect(areaWalkable(map, shrineStop, WORLD_ACTOR_RADIUS)).toBe(true);
    const edgeStop = slideMovement(nav, ACT1_START, { x: -30, y: 0 });
    expect(edgeStop.x).toBeGreaterThan(2);
    expect(areaWalkable(map, edgeStop, WORLD_ACTOR_RADIUS)).toBe(true);
  });

  it("preserves baseline actors and replays real AI, damage and death deterministically", () => {
    const nav = areaNavigation(act1ReadabilityMap());
    const replay = () => {
      const encounter = createAct1Encounter();
      const player = encounter.combat.actors[0]!;
      expect(player.offense).toEqual(createCombat().actors[0]!.offense);
      expect(player.defense).toEqual(createCombat().actors[0]!.defense);
      expect(player.maxHp).toBe(createCombat().actors[0]!.maxHp);
      for (const brain of encounter.brains) {
        const actor = encounter.combat.actors.find((a) => a.id === brain.id)!;
        const baseline = createMonster(brain.id, brain.role, brain.home).actor;
        expect(actor).toEqual(baseline);
      }
      player.controller = commandCombat(player.controller, {
        kind: "move",
        target: { x: 26, y: 29 },
      });
      for (let tick = 0; tick < 400; tick++) stepAct1Encounter(encounter, nav);
      expect(player.controller.walker.position.x).toBeGreaterThan(24);
      expect(encounter.brains.some((brain) => brain.pathRequests > 0)).toBe(
        true,
      );
      expect(
        encounter.combat.events.some(
          (e) => e.kind === "damage" && e.target === 0,
        ),
      ).toBe(true);
      expect(player.hp).toBeLessThan(player.maxHp);
      player.controller = commandCombat(player.controller, {
        kind: "attack",
        target: 1,
        repeat: true,
      });
      for (let tick = 0; tick < 300; tick++) stepAct1Encounter(encounter, nav);
      expect(
        encounter.combat.events.some(
          (e) => e.kind === "damage" && e.actor === 0,
        ),
      ).toBe(true);
      expect(encounter.brains.find((brain) => brain.id === 1)?.state).toBe(
        "dead",
      );
      for (const actor of encounter.combat.actors)
        expect(
          areaWalkable(
            nav.logicalMap!,
            actor.controller.walker.position,
            WORLD_ACTOR_RADIUS,
          ),
        ).toBe(true);
      return encounter;
    };
    expect(replay()).toEqual(replay());
  });

  it("passes analog scale through existing movement without tuning speeds", () => {
    const nav = areaNavigation(act1ReadabilityMap());
    const full = createAct1Encounter(),
      half = createAct1Encounter();
    for (let tick = 0; tick < 60; tick++) {
      stepAct1Encounter(full, nav, { x: 1, y: 0 }, 1);
      stepAct1Encounter(half, nav, { x: 1, y: 0 }, 0.5);
    }
    expect(full.combat.actors[0]!.controller.walker.distance).toBeCloseTo(3, 8);
    expect(half.combat.actors[0]!.controller.walker.distance).toBeCloseTo(
      1.5,
      8,
    );
    expect(full.combat.hostilesActive).toBe(false);
  });
});

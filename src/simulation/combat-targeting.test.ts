import { describe, expect, it } from "vitest";
import { createWalker } from "./locomotion";
import {
  commandCombat,
  createController,
  hoverTarget,
  inAttackRange,
  stepController,
} from "./combat-targeting";
import type { Navigation } from "../world/navigation";
import { areaNavigation, canWalk, findPath } from "../world/navigation";
import { worldLayout } from "./world-layout";
const nav: Navigation = {
  boundary: [
    { x: -2000, y: -2000 },
    { x: 2000, y: -2000 },
    { x: 2000, y: 2000 },
    { x: -2000, y: 2000 },
  ],
  obstacles: [],
};
const target = { id: 1, position: { x: 3, y: 0 }, alive: true };
describe("targeting and commitment", () => {
  it("approaches a reachable graveyard target when its ideal melee stopping point is obstructed", () => {
    const navigation = areaNavigation(
      worldLayout("forgotten-graveyard", 42, 2).map,
    );
    const start = { x: -12.616476576618242, y: -2.604491011487777 },
      position = { x: -6.6469931795384145, y: -3.187432468835193 };
    const distance = Math.hypot(position.x - start.x, position.y - start.y),
      range = 1.05;
    const goal = {
      x: position.x - ((position.x - start.x) / distance) * (range - 0.2),
      y: position.y - ((position.y - start.y) / distance) * (range - 0.2),
    };
    expect(canWalk(navigation, goal)).toBe(false);
    expect(findPath(navigation, start, position).length).toBeGreaterThan(0);
    let controller = commandCombat(createController(createWalker(start)), {
        kind: "attack",
        target: 3012,
        repeat: true,
      }),
      strikes = 0;
    for (let tick = 0; tick < 300; tick++) {
      const result = stepController(
        controller,
        [{ id: 3012, position, alive: true }],
        navigation,
        range,
      );
      controller = result.controller;
      strikes += result.events.filter(
        (event) => event.kind === "strike",
      ).length;
    }
    expect(strikes).toBeGreaterThan(0);
    expect(
      inAttackRange(controller.walker.position, position, range, navigation),
    ).toBe(true);
  });
  it("approaches, faces and attacks without movement oscillation", () => {
    let c = commandCombat(createController(createWalker({ x: 0, y: 0 })), {
      kind: "attack",
      target: 1,
      repeat: true,
    });
    let strikes = 0;
    for (let i = 0; i < 150; i++) {
      const r = stepController(c, [target], nav, 1);
      c = r.controller;
      strikes += r.events.filter((e) => e.kind === "strike").length;
    }
    expect(strikes).toBeGreaterThan(1);
    expect(c.walker.position.x).toBeGreaterThan(2);
    expect(c.walker.position.x).toBeLessThan(2.2);
    expect(c.walker.walking).toBe(false);
  });
  it("chases moving targets and stops when they die", () => {
    let c = commandCombat(createController(createWalker({ x: 0, y: 0 })), {
      kind: "attack",
      target: 1,
      repeat: true,
    });
    for (let i = 0; i < 30; i++)
      c = stepController(
        c,
        [{ ...target, position: { x: 3 + i / 60, y: 0 } }],
        nav,
        1,
      ).controller;
    expect(c.walker.position.x).toBeGreaterThan(1);
    c = stepController(c, [{ ...target, alive: false }], nav, 1).controller;
    expect(c.selected).toBeNull();
    expect(c.walker.walking).toBe(false);
    expect(c.attacking).toBe(false);
  });
  it("locks committed target and defers movement through recovery", () => {
    let c = commandCombat(createController(createWalker({ x: 2.2, y: 0 })), {
      kind: "attack",
      target: 1,
      repeat: false,
    });
    c = stepController(c, [target], nav, 1).controller;
    c = commandCombat(c, { kind: "move", target: { x: 5, y: 0 } });
    for (let i = 1; i < 32; i++) {
      c = stepController(c, [target], nav, 1).controller;
      expect(c.walker.position.x).toBe(2.2);
    }
    c = stepController(c, [target], nav, 1).controller;
    expect(c.walker.position.x).toBeGreaterThan(2.2);
    expect(c.locked).toBe(1);
  });
  it("does not hit through obstacles or select dead hover targets", () => {
    const blocked = { ...nav, obstacles: [{ x: 800, y: 528, rx: 10, ry: 10 }] };
    expect(inAttackRange({ x: 0, y: 0 }, { x: 1, y: 0 }, 2, blocked)).toBe(
      false,
    );
    expect(hoverTarget({ x: 3, y: -28 }, [target], (p) => p)).toBe(1);
    expect(
      hoverTarget({ x: 3, y: -28 }, [{ ...target, alive: false }], (p) => p),
    ).toBeNull();
    expect(() =>
      stepController(
        createController(createWalker({ x: 0, y: 0 })),
        [],
        nav,
        0,
      ),
    ).toThrow();
  });
  it("release yields exactly one attack and a new selection cannot redirect its strike", () => {
    let c = commandCombat(createController(createWalker({ x: 2.2, y: 0 })), {
      kind: "attack",
      target: 1,
      repeat: true,
    });
    c = stepController(c, [target], nav, 1).controller;
    c = commandCombat(c, { kind: "release" });
    let strikes = 0;
    for (let i = 0; i < 100; i++) {
      const r = stepController(c, [target], nav, 1);
      c = r.controller;
      strikes += r.events.filter((e) => e.kind === "strike").length;
    }
    expect(strikes).toBe(1);
  });
  it("retains one newly queued attack through release during recovery", () => {
    let c = commandCombat(createController(createWalker({ x: 2.2, y: 0 })), {
      kind: "attack",
      target: 1,
      repeat: false,
    });
    for (let i = 0; i < 15; i++)
      c = stepController(c, [target], nav, 1).controller;
    c = commandCombat(c, { kind: "attack", target: 1, repeat: true });
    c = commandCombat(c, { kind: "release" });
    for (let i = 0; i < 100; i++)
      c = stepController(c, [target], nav, 1).controller;
    expect(c.timeline.sequence).toBe(2);
  });
});

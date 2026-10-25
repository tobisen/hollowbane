import { expect, it } from "vitest";
import {
  areaNavigation,
  canWalk,
  onGround,
  slideMovement,
  type Navigation,
} from "../world/navigation";
import { worldToScreen } from "../world/isometric";
import { createWalker, moveTick, retarget, type Walker } from "./locomotion";
import type { AreaMap } from "./area-map";

function corridor(angle: number, width = 4): Navigation {
  const c = Math.cos(angle),
    s = Math.sin(angle);
  return {
    boundary: [
      [-20, 0],
      [20, 0],
      [20, width],
      [-20, width],
    ].map(([x, y]) => onGround({ x: x! * c - y! * s, y: x! * s + y! * c })),
    obstacles: [],
  };
}
for (const degrees of [30, 45, 17])
  it(`projects onto a ${degrees}-degree wall without acceleration or penetration`, () => {
    const angle = (degrees * Math.PI) / 180,
      c = Math.cos(angle),
      s = Math.sin(angle);
    const nav = corridor(angle);
    let p = { x: -s * 0.001, y: c * 0.001 };
    const delta = { x: (c + s) * 0.04, y: (s - c) * 0.04 };
    for (let i = 0; i < 120; i++) {
      const next = slideMovement(nav, p, delta);
      expect(canWalk(nav, next)).toBe(true);
      expect(Math.hypot(next.x - p.x, next.y - p.y)).toBeLessThanOrEqual(
        Math.hypot(delta.x, delta.y) + 1e-9,
      );
      expect(next.x * c + next.y * s).toBeGreaterThan(p.x * c + p.y * s);
      p = next;
    }
    expect(p.x * c + p.y * s).toBeCloseTo(4.8, 4);
    expect(-p.x * s + p.y * c).toBeGreaterThan(0);
  });
it("holds a narrow diagonal passage and stops at simultaneous corner contacts", () => {
  const nav = corridor(Math.PI / 6, 0.5);
  let p = { x: 0, y: 0.25 };
  for (let i = 0; i < 100; i++) {
    p = slideMovement(nav, p, { x: 0.1, y: 0 });
    expect(canWalk(nav, p)).toBe(true);
  }
  expect(p.x).toBeGreaterThan(7);
  const corner = corridor(0);
  p = slideMovement(corner, { x: 19.9, y: 0.1 }, { x: 1, y: -1 });
  expect(p.x).toBeCloseTo(20, 5);
  expect(p.y).toBeCloseTo(0, 5);
  const held = slideMovement(corner, p, { x: 1, y: -1 });
  expect(Math.hypot(held.x - p.x, held.y - p.y)).toBeLessThan(1e-8);
  expect(canWalk(corner, p)).toBe(true);
});
it("resolves terrain, round props and multiple contacts without tunneling", () => {
  const map: AreaMap = {
    area: "haunted-forest",
    seed: 42,
    terrain: {
      width: 8,
      height: 8,
      cellSize: 1,
      origin: { x: 0, y: 0 },
      cells: Array.from({ length: 64 }, (_, i) =>
        i % 8 === 4 ? "solid" : "ground",
      ),
    },
    objects: [
      {
        id: "a",
        position: { x: 2, y: 3 },
        radius: 0.4,
        blocking: true,
        appearance: "test",
      },
      {
        id: "b",
        position: { x: 2, y: 4.2 },
        radius: 0.4,
        blocking: true,
        appearance: "test",
      },
    ],
  };
  const nav = areaNavigation(map);
  let p = { x: 3.79, y: 1 };
  for (let i = 0; i < 80; i++) {
    p = slideMovement(nav, p, { x: 0.1, y: 0.05 });
    expect(canWalk(nav, p)).toBe(true);
    expect(p.x).toBeLessThan(3.8);
  }
  expect(p.y).toBeGreaterThan(4.9);
  p = slideMovement(nav, { x: 1, y: 3.6 }, { x: 2, y: 0 });
  expect(canWalk(nav, p)).toBe(true);
  expect(p.x).toBeLessThanOrEqual(2);
  const around = slideMovement(nav, { x: 1.45, y: 2.7 }, { x: 0.2, y: 0.15 });
  expect(canWalk(nav, around)).toBe(true);
  expect(around.y).toBeLessThan(2.85);
});
it("keyboard and full analog agree; input changes clear queues and click navigation resumes", () => {
  const nav = corridor(Math.PI / 6);
  const initial = {
    ...createWalker({ x: 0, y: 0.01 }),
    route: [{ x: 2, y: 2 }],
    queuedTargets: [{ x: 3, y: 2 }],
  };
  let keyboard = initial,
    analog = initial;
  for (let i = 0; i < 120; i++) {
    keyboard = moveTick(keyboard, nav, { x: 1, y: 0 });
    analog = moveTick(analog, nav, { x: 1, y: 0 }, undefined, 1);
    expect(analog).toEqual(keyboard);
    expect(canWalk(nav, keyboard.position)).toBe(true);
  }
  expect(keyboard.position.x).toBeGreaterThan(1);
  expect(keyboard.route).toEqual([]);
  expect(keyboard.queuedTargets).toEqual([]);
  const goal = { x: 1, y: 2 };
  let routed = retarget(keyboard, nav, goal);
  for (let i = 0; i < 180; i++) routed = moveTick(routed, nav);
  expect(routed.position.x).toBeCloseTo(goal.x);
  expect(routed.position.y).toBeCloseTo(goal.y);
  const input = worldToScreen({ x: 1, y: -0.5 });
  expect(
    moveTick(createWalker({ x: 0, y: 0.01 }), nav, input, undefined, 0.5)
      .distance,
  ).toBeLessThanOrEqual(1.5 / 60);
});

it("settles against the authored boundary at maximum run speed", async () => {
  const { CLOISTER_NAV } = await import("../content/cloister");
  const { fromGround, onGround } = await import("../world/navigation");
  const { movementConfig } = await import("./locomotion");
  let w: Walker = {
    ...createWalker(fromGround({ x: 780, y: 500 })),
    gait: "run" as const,
  };
  const config = movementConfig({ runSpeed: 12 });
  for (let i = 0; i < 600; i++)
    w = moveTick(w, CLOISTER_NAV, { x: 1, y: 0 }, config);
  expect(canWalk(CLOISTER_NAV, w.position)).toBe(true);
  expect(onGround(w.position).x).toBeLessThan(1170);
  expect(w.motion).toBe("idle");
});

it("releasing a shallow run slide cannot restore blocked velocity", () => {
  const nav = corridor(Math.PI / 6);
  let w: Walker = { ...createWalker({ x: 0, y: 0.0001 }), gait: "run" };
  const input = worldToScreen({ x: 0.6, y: -1 });
  for (let i = 0; i < 10; i++) w = moveTick(w, nav, input);
  const actual = Math.hypot(w.velocity.x, w.velocity.y);
  expect(actual).toBeLessThan(1);
  const released = moveTick(w, nav);
  expect(released.speed).toBeLessThanOrEqual(actual);
  expect(released.position).toEqual(w.position);
});

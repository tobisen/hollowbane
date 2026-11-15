import { it, expect } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import source from "../../public/dev/warrior-directions/warrior.json";
import manifest from "../../experiments/warrior-integration/manifest.json";
import { MOVEMENT, createWalker, moveTick } from "../simulation/locomotion";
import {
  visualNavigation,
  visualFromGround,
  visualOnGround,
  VISUAL_SPAWN,
} from "./visual-foundation";
import {
  visualMovement,
  visualSteering,
  VISUAL_WALK_STRIDE,
  VISUAL_WALK_CYCLES,
  visualFacingIndex,
} from "./visual-warrior-motion";
import { WARRIOR_DIRECTIONS } from "../rendering/warrior-pose";
import { screenToWorld } from "./isometric";

it("selects the closest real facing on arbitrary paths and holds it at rest", () => {
  const v = screenToWorld({
    x: Math.cos(Math.PI / 3),
    y: Math.sin(Math.PI / 3),
  });
  expect(visualFacingIndex(v, 7)).toBe(0);
  expect(visualFacingIndex({ x: 0, y: 0 }, 5)).toBe(5);
});

it("calibrates only this prototype to the authored stride; production movement remains unchanged", () => {
  expect(MOVEMENT.walkSpeed).toBe(3);
  expect(visualMovement.walkSpeed / VISUAL_WALK_STRIDE).toBe(
    VISUAL_WALK_CYCLES,
  );
  expect(visualMovement.runSpeed).toBe(MOVEMENT.runSpeed);
  const start = visualFromGround(VISUAL_SPAWN);
  let w = createWalker(start);
  for (let i = 0; i < 60; i++)
    w = moveTick(w, visualNavigation, { x: 1, y: 0 }, visualMovement);
  const p = visualOnGround(w.position);
  expect(p.x - VISUAL_SPAWN.x).toBeCloseTo(113.14285666, 4);
  expect(p.y).toBeCloseTo(VISUAL_SPAWN.y, 8);
});

it("aligns all eight keyboard headings and planted source-foot vectors to the actual ground transform", () => {
  const inputs = [
    { x: 0, y: 1 },
    { x: -1, y: 1 },
    { x: -1, y: 0 },
    { x: -1, y: -1 },
    { x: 0, y: -1 },
    { x: 1, y: -1 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
  ];
  for (const [index, input] of inputs.entries()) {
    const direction = WARRIOR_DIRECTIONS[index]!;
    const intent = visualSteering(input);
    let walker = createWalker(visualFromGround(VISUAL_SPAWN));
    walker = moveTick(walker, visualNavigation, intent, visualMovement);
    const point = visualOnGround(walker.position),
      dx = point.x - VISUAL_SPAWN.x,
      dy = point.y - VISUAL_SPAWN.y;
    const length = Math.hypot(dx, dy),
      view = source.views[direction];
    expect(dx / length).toBeCloseTo(view.facing[0]!, 4);
    expect(dy / length).toBeCloseTo(view.facing[1]!, 4);
    const rootX = (dx / visualMovement.walkSpeed) * 60 * VISUAL_WALK_STRIDE;
    const rootY = (dy / visualMovement.walkSpeed) * 60 * VISUAL_WALK_STRIDE;
    const frames = view.frames.slice(8, 24);
    for (let f = 1; f < 16; f++)
      for (const side of ["L", "R"]) {
        const a = frames[f - 1]!.contacts.find((c) => c.side === side)!,
          b = frames[f]!.contacts.find((c) => c.side === side)!;
        if (a.planted && b.planted)
          expect(
            Math.hypot(
              rootX / 16 + (b.pixel[0]! - a.pixel[0]!) * 0.5,
              rootY / 16 + (b.pixel[1]! - a.pixel[1]!) * 0.5,
            ),
          ).toBeLessThan(0.001);
      }
  }
});

it("retains every source alpha/pivot/cell while deterministically treating existing idle/walk pixels", async () => {
  expect(manifest.records).toHaveLength(8);
  for (const record of manifest.records) {
    const original = readFileSync(
      new URL(
        `../../public/dev/warrior-directions/${record.direction}.png`,
        import.meta.url,
      ),
    );
    expect(createHash("sha256").update(original).digest("hex")).toBe(
      record.sourceSha256,
    );
    const bytes = readFileSync(
      new URL(
        `../../experiments/warrior-integration/${record.file}`,
        import.meta.url,
      ),
    );
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(
      record.sha256,
    );
    const before = await sharp(original)
      .extract({ left: 0, top: 0, width: 2048, height: 792 })
      .ensureAlpha()
      .raw()
      .toBuffer();
    const after = await sharp(bytes).ensureAlpha().raw().toBuffer();
    expect(after.length).toBe(before.length);
    for (let i = 3; i < before.length; i += 4)
      if (before[i] !== after[i])
        throw Error(`Alpha changed: ${record.direction}:${i}`);
  }
  expect(manifest.root).toEqual([128, 210]);
  expect(manifest.scale).toBe(0.5);
});

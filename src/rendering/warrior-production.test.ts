import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createCombat } from "../simulation/combat";
import { createCharacterInventory } from "../simulation/equipment";
import { inventoryItem } from "../simulation/inventory-test-helper";
import { newCharacter } from "../simulation/new-character";
import { WarriorMotion, warriorPose } from "./warrior-pose";
import { warriorRendererSelection } from "./warrior-renderer-selection";
import assets from "./warrior-assets.json";

describe("production Warrior equipment selection", () => {
  it("supports new and historical blades, with fixed cosmetic armor", () => {
    const s = newCharacter("warrior");
    expect(warriorRendererSelection("warrior", s.character.equipment)).toBe(
      "supported",
    );
    for (const version of [2, 3]) {
      const c = createCharacterInventory(40);
      c.equipment.main = inventoryItem("ash-blade", 0, version);
      c.equipment.chest = inventoryItem("woven-coat");
      expect(warriorRendererSelection("warrior", c.equipment)).toBe(
        "supported",
      );
    }
  });
  it("fails closed for bows, staffs, shields, empty hands and other classes without mutating equipment", () => {
    const c = createCharacterInventory(40);
    expect(warriorRendererSelection("warrior", c.equipment)).toBe(
      "empty-main-hand",
    );
    for (const base of ["reed-bow", "cinder-staff"]) {
      c.equipment.main = inventoryItem(base);
      expect(warriorRendererSelection("warrior", c.equipment)).toBe(
        `unsupported-weapon:${base}`,
      );
    }
    c.equipment.main = inventoryItem("ash-blade");
    c.equipment.off = inventoryItem("bark-guard");
    const before = structuredClone(c);
    expect(warriorRendererSelection("warrior", c.equipment)).toBe(
      "unsupported-offhand:bark-guard",
    );
    expect(c).toEqual(before);
    delete c.equipment.off;
    expect(warriorRendererSelection("warrior", c.equipment, true)).toBe(
      "debug-legacy",
    );
    for (const id of ["sorcerer", "ranger", null] as const)
      expect(warriorRendererSelection(id, c.equipment)).toBe("other-class");
  });
});

it("observes displacement across facing/gait changes and yields to hit/death without simulation writes", () => {
  const world = createCombat(),
    a = world.actors[0]!,
    motion = new WarriorMotion();
  motion.observe(a, 0);
  a.controller.walker.distance += 0.5;
  a.controller.walker.walking = true;
  motion.observe(a, 1);
  const phase = motion.phase;
  a.controller.walker.direction = 2;
  motion.observe(a, 2);
  expect(motion.phase).toBe(phase);
  const before = structuredClone(world);
  const pose = warriorPose(a, 2, null, null, motion);
  expect(pose.set).toBe("movement");
  expect(pose.frame).toBeGreaterThanOrEqual(8);
  a.controller.timeline.phase = "hitstun";
  a.controller.timeline.remaining = 9;
  motion.observe(a, 3);
  expect(warriorPose(a, 3, null, null, motion)).toEqual({
    set: "hit",
    frame: 0,
    clip: "hit",
  });
  a.controller.timeline.phase = "dead";
  expect(warriorPose(a, 100, 4, null, motion)).toEqual({
    set: "death",
    frame: 15,
    clip: "death",
  });
  a.controller.timeline = before.actors[0]!.controller.timeline;
  expect(world).toEqual(before);
});

it("production descriptors preserve every approved byte, scale/root and stride", () => {
  let bytes = 0,
    decoded = 0,
    count = 0;
  for (const set of Object.values(assets)) {
    const manifest = JSON.parse(
      readFileSync(`public/dev/${set.source}/warrior.json`, "utf8"),
    );
    expect(set.root).toEqual(manifest.root);
    expect(set.width).toBe(manifest.cellWidth ?? manifest.cell);
    expect(set.height).toBe(manifest.cellHeight ?? manifest.cell);
    for (const [direction, view] of Object.entries(set.views)) {
      const png = readFileSync(`public/dev/${set.source}/${direction}.png`);
      expect(createHash("sha256").update(png).digest("hex")).toBe(view.sha256);
      expect(png.length).toBe(view.bytes);
      expect(view.decodedBytes).toBe(manifest.views[direction].decodedBytes);
      expect(view.file).toMatch(/^assets\/warrior\//);
      bytes += view.bytes;
      decoded += view.decodedBytes;
      count++;
    }
  }
  expect([count, bytes, decoded / 1024 ** 2]).toEqual([40, 23458595, 349.25]);
  const movement = JSON.parse(
    readFileSync("public/dev/warrior-directions/warrior.json", "utf8"),
  );
  const a = createCombat().actors[0]!,
    m = new WarriorMotion();
  m.observe(a, 0);
  a.controller.walker.distance += movement.clips.walk.worldStride / 2;
  m.observe(a, 1);
  expect(m.phase).toBeCloseTo(0.5);
  a.controller.walker.gait = "run";
  a.controller.walker.distance += movement.clips.run.worldStride / 4;
  m.observe(a, 2);
  expect(m.phase).toBeCloseTo(0.75);
});

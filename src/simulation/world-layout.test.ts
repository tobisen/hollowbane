import { expect, it } from "vitest";
import { worldLayout, layoutFingerprint } from "./world-layout";
import { prototypeArea } from "./world-prototype";
import { AREA_IDS } from "./world";
import { validGeneratedPlacement } from "./generation-validation";
import { WorldSession } from "./world-session";
import { createCombat } from "./combat";
import { createInventorySession } from "./inventory-world";
import { serializeCharacter, deserializeCharacter } from "./inventory-save";
import { inventoryItem } from "./inventory-test-helper";
import { validateExploration } from "./world-save";
import { findPath, areaNavigation } from "../world/navigation";
it("pins historical rules and reproduces validated generated worlds independently of visit order", () => {
  for (const area of AREA_IDS) {
    expect(worldLayout(area, 42, 1)).toEqual(prototypeArea(area, 42));
    const a = worldLayout(area, 42, 2);
    expect(worldLayout(area, 42, 2)).toEqual(a);
    expect(validGeneratedPlacement(a)).toBe(true);
    if (area !== "ashen-refuge") {
      expect(a.map.terrain.width).toBeGreaterThan(8);
      expect(layoutFingerprint(worldLayout(area, 43, 2))).not.toBe(
        layoutFingerprint(a),
      );
    }
    for (const exit of a.exits)
      expect(
        findPath(areaNavigation(a.map), a.spawn, exit.trigger).length,
      ).toBeGreaterThan(0);
  }
  expect(
    AREA_IDS.map((area) => [
      layoutFingerprint(worldLayout(area, 42, 1)),
      layoutFingerprint(worldLayout(area, 42, 2)),
    ]),
  ).toMatchInlineSnapshot(`
    [
      [
        "c6920a7c",
        "c6920a7c",
      ],
      [
        "9bf36f92",
        "323b57eb",
      ],
      [
        "80eca026",
        "ca81079f",
      ],
      [
        "7d8ea2e4",
        "460eb973",
      ],
    ]
  `);
  expect(() => worldLayout("haunted-forest", 42, 3)).toThrow();
}, 15_000);
it("roundtrips generated travel, progression and parked items without duplicate ownership or loot reset", () => {
  const session = createInventorySession();
  session.loot.sequence = 123;
  session.loot.drops.push({
    item: inventoryItem("woven-coat"),
    position: { x: 0, y: 0 },
    tick: 1,
    source: -1,
  });
  const combat = createCombat();
  const player = combat.actors[0]!,
    xp = combat.experience;
  let world = new WorldSession();
  for (const id of [
    "forest",
    "graveyard",
    "crypt",
    "graveyard",
    "forest",
    "camp",
  ]) {
    player.controller.walker.position = {
      ...world.travel.layout.exits.find((e) => e.id === id)!.trigger,
    };
    expect(world.transition(combat, session.loot)).toBe(true);
    expect(combat.actors[0]).toBe(player);
    expect(combat.experience).toBe(xp);
    session.exploration = world.capture(
      player.controller.walker.position,
      session.loot,
    );
    const before = layoutFingerprint(world.travel.layout);
    const restored = deserializeCharacter(serializeCharacter(session));
    expect(restored.loot.sequence).toBe(123);
    const drops = restored.loot.drops.concat(
      restored.exploration!.areas.flatMap((a) => a.drops),
    );
    expect(drops).toHaveLength(1);
    world = new WorldSession(restored.exploration);
    expect(layoutFingerprint(world.travel.layout)).toBe(before);
  }
  expect(session.loot.drops).toHaveLength(1);
  const invalid = structuredClone(session.exploration!);
  invalid.areas[1]!.layoutFingerprint = "00000000";
  expect(() => validateExploration(invalid)).toThrow(/fingerprint/);
}, 15_000);

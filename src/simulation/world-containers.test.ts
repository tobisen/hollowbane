import { expect, it } from "vitest";
import { WorldSession } from "./world-session";
import { planWorldContainers } from "./world-containers";
import { worldLayout, layoutFingerprint } from "./world-layout";
import { createInventorySession } from "./inventory-world";
import { serializeCharacter, deserializeCharacter } from "./inventory-save";
import { EQUIPMENT_CONTENT } from "./item-content";
import { validateExploration } from "./world-save";
import { canWalk, areaNavigation, findPath } from "../world/navigation";
it("pins deterministic reachable container positions without changing layouts", () => {
  for (const area of [
    "haunted-forest",
    "forgotten-graveyard",
    "ancient-crypt",
  ] as const) {
    const layout = worldLayout(area, 42, 2),
      fingerprint = layoutFingerprint(layout);
    const plan = planWorldContainers(layout);
    expect(plan.length).toBeGreaterThan(0);
    expect(
      findPath(areaNavigation(layout.map), layout.spawn, plan[0]!.position)
        .length,
    ).toBeGreaterThan(0);
    expect(plan).toEqual(planWorldContainers(worldLayout(area, 42, 2)));
    expect(plan).not.toEqual(planWorldContainers(worldLayout(area, 43, 2)));
    expect(new Set(plan.map((c) => c.id)).size).toBe(plan.length);
    expect(
      plan.every((c) => canWalk(areaNavigation(layout.map), c.position)),
    ).toBe(true);
    expect(layoutFingerprint(layout)).toBe(fingerprint);
  }
});
it("atomically preserves opened state, gold and item ownership across checkpoint reload", () => {
  const s = createInventorySession(),
    world = new WorldSession(undefined, 42, 2, "haunted-forest");
  const c = world.containers[0]!;
  expect(
    world.openContainer(
      c.id,
      { x: 1000, y: 1000 },
      s.loot,
      0,
      EQUIPMENT_CONTENT,
    ),
  ).toBe(false);
  expect(world.containerState.gold).toBe(0);
  expect(
    world.openContainer(c.id, c.position, s.loot, 0, EQUIPMENT_CONTENT),
  ).toBe(true);
  const gold = world.containerState.gold,
    drops = structuredClone(s.loot.drops);
  expect(gold).toBeGreaterThan(0);
  expect(
    world.openContainer(c.id, c.position, s.loot, 0, EQUIPMENT_CONTENT),
  ).toBe(false);
  s.exploration = world.capture(c.position, s.loot);
  const saved = deserializeCharacter(serializeCharacter(s));
  const restored = new WorldSession(saved.exploration);
  expect(restored.containerState.gold).toBe(gold);
  expect(saved.loot.drops).toEqual(drops);
  expect(
    restored.openContainer(c.id, c.position, saved.loot, 0, EQUIPMENT_CONTENT),
  ).toBe(false);
  expect(restored.containerState.gold).toBe(gold);
  const invalid = structuredClone(saved.exploration!);
  invalid.containers!.opened.push(c.id);
  expect(() => validateExploration(invalid)).toThrow();
  const legacy = structuredClone(saved.exploration!);
  legacy.version = 1;
  delete legacy.expedition;
  for (const area of legacy.areas) delete area.discovery;
  delete legacy.containers;
  const migrated = new WorldSession(validateExploration(legacy));
  expect(migrated.containerState).toEqual({ version: 1, gold: 0, opened: [] });
  expect(layoutFingerprint(migrated.travel.layout)).toBe(
    layoutFingerprint(world.travel.layout),
  );
});
it("leaves all state unchanged when an item reward cannot fit", () => {
  const content = {
    ...EQUIPMENT_CONTENT,
    tables: EQUIPMENT_CONTENT.tables.map((t) => ({ ...t, chance: 10000 })),
  };
  const s = createInventorySession(),
    world = new WorldSession(undefined, 42, 2, "haunted-forest"),
    c = world.containers[0]!;
  s.loot.capacity = 0;
  const before = structuredClone(s.loot);
  expect(world.openContainer(c.id, c.position, s.loot, 0, content)).toBe(false);
  expect(world.containerState).toEqual({ version: 1, gold: 0, opened: [] });
  expect(s.loot).toEqual(before);
});

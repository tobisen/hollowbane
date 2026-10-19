import { expect, it } from "vitest";
import { createInventorySession } from "./inventory-world";
import { inventoryItem } from "./inventory-test-helper";
import { WorldSession } from "./world-session";
import { createCombat } from "./combat";
import {
  serializeCharacter,
  deserializeCharacter,
  snapshotChecksum,
  inspectSnapshots,
} from "./inventory-save";
import { InventoryRuntime } from "../rendering/inventory-runtime";
function fixture() {
  const session = createInventorySession();
  session.character.grid.items.push({
    item: inventoryItem("woven-coat"),
    x: 0,
    y: 0,
  });
  session.loot.drops.push({
    item: inventoryItem("copper-band"),
    position: { x: 0, y: 0 },
    tick: 1,
    source: -1,
  });
  session.loot.sequence = 123;
  session.loot.deaths.add(17);
  const world = new WorldSession();
  session.exploration = world.capture({ x: 0, y: 0 }, session.loot);
  return { session, world };
}
type Body = {
  exploration: NonNullable<
    ReturnType<typeof createInventorySession>["exploration"]
  >;
  loot: ReturnType<typeof createInventorySession>["loot"];
  character: ReturnType<typeof createInventorySession>["character"];
};
function alter(text: string, change: (b: Body) => void) {
  const root = JSON.parse(text);
  change(root.body);
  root.checksum = snapshotChecksum(JSON.stringify(root.body));
  return JSON.stringify(root);
}
it("roundtrips world and character together, parks ground items without resetting the loot stream", () => {
  const { session, world } = fixture(),
    combat = createCombat();
  const owned = session.character.grid.items[0]!.item;
  combat.actors[0]!.controller.walker.position = { x: -2.5, y: 0 };
  expect(world.transition(combat, session.loot)).toBe(true);
  expect(session.loot.drops).toHaveLength(0);
  expect(session.loot.sequence).toBe(123);
  session.exploration = world.capture(
    combat.actors[0]!.controller.walker.position,
    session.loot,
  );
  const saved = deserializeCharacter(serializeCharacter(session));
  expect(saved.character.grid.items[0]!.item).toEqual(owned);
  expect(saved.exploration!.area).toBe("haunted-forest");
  const restored = new WorldSession(saved.exploration);
  combat.actors[0]!.controller.walker.position = { x: -2.5, y: 0 };
  expect(restored.transition(combat, saved.loot)).toBe(true);
  expect(saved.loot.drops).toHaveLength(1);
  expect(saved.loot.deaths.has(17)).toBe(true);
  expect(saved.loot.sequence).toBe(123);
});
it("rejects forged seeds, versions, invalid area/position and duplicate cross-area item ownership with recovery", () => {
  const { session } = fixture(),
    text = serializeCharacter(session);
  for (const change of [
    (b: Body) => {
      Object.assign(b.exploration, { area: "missing" });
    },
    (b: Body) => {
      b.exploration.position = { x: 100, y: 0 };
    },
    (b: Body) => {
      b.exploration.areas[0]!.seed++;
    },
    (b: Body) => {
      b.exploration.contentVersion++;
    },
    (b: Body) => {
      b.exploration.areas[1]!.drops = [
        { ...b.loot.drops[0]!, item: b.character.grid.items[0]!.item },
      ];
    },
  ]) {
    const corrupt = alter(text, change);
    expect(() => deserializeCharacter(corrupt)).toThrow();
    expect(inspectSnapshots(corrupt, text).kind).toBe("recoverable");
  }
});
it("migrates schema4 without world safely and restores exit-zone checkpoints away from triggers", () => {
  const { session } = fixture();
  delete session.exploration;
  const root = JSON.parse(serializeCharacter(session));
  root.schema = 4;
  expect(
    deserializeCharacter(JSON.stringify(root)).exploration,
  ).toBeUndefined();
  const world = new WorldSession();
  session.exploration = world.capture({ x: -2.5, y: 0 }, session.loot);
  const restored = new WorldSession(
    deserializeCharacter(serializeCharacter(session)).exploration,
  );
  expect(restored.travel.state.position).toEqual({ x: 0, y: 0 });
});
it("rejects exploration loads on unbound character routes before any character mutation", () => {
  const { session } = fixture(),
    combat = createCombat();
  let loot = createInventorySession().loot;
  const runtime = new InventoryRuntime(
    () => combat.actors[0]!,
    () => undefined,
    () => loot,
    (w) => {
      loot = w;
    },
  );
  const before = runtime.character;
  expect(() => runtime.restore(session)).toThrow(/world route/);
  expect(runtime.character).toBe(before);
});

import { expect, it } from "vitest";
import { createCombat } from "./combat";
import { createInventorySession } from "./inventory-world";
import { inventoryItem } from "./inventory-test-helper";
import { deserializeCharacter, serializeCharacter } from "./inventory-save";
import { WorldSession } from "./world-session";
import { validateExploration } from "./world-save";

it("completes the ordered expedition once and preserves player and item ownership through travel/reload", () => {
  let session = createInventorySession();
  session.character.grid.items.push({
    item: inventoryItem("woven-coat"),
    x: 0,
    y: 0,
  });
  const owned = structuredClone(session.character);
  session.loot.sequence = 123;
  let world = new WorldSession();
  const combat = createCombat(),
    player = combat.actors[0]!;
  const hp = player.hp;
  const travel = (id: string) => {
    player.controller.walker.position = {
      ...world.travel.layout.exits.find((e) => e.id === id)!.trigger,
    };
    expect(world.transition(combat, session.loot)).toBe(true);
    expect(combat.actors[0]).toBe(player);
    expect(player.hp).toBe(hp);
    expect(session.character).toEqual(owned);
    expect(session.loot.sequence).toBe(123);
  };
  expect(world.interactExpedition(combat)).toBe(true);
  expect(world.interactExpedition(combat)).toBe(false);
  travel("forest");
  travel("graveyard");
  travel("crypt");
  expect(world.expedition.reached).toBe(3);
  expect(world.interactExpedition(combat)).toBe(false);
  player.controller.walker.position = { ...world.objectivePosition! };
  player.hp = 0;
  expect(world.interactExpedition(combat)).toBe(false);
  player.hp = hp;
  expect(world.interactExpedition(combat)).toBe(true);
  expect(world.interactExpedition(combat)).toBe(false);
  session.exploration = world.capture(
    player.controller.walker.position,
    session.loot,
  );
  session = deserializeCharacter(serializeCharacter(session));
  world = new WorldSession(session.exploration);
  expect(world.expedition.stage).toBe("returning");
  travel("graveyard");
  travel("forest");
  travel("camp");
  const completed = world.expedition;
  expect(completed.stage).toBe("complete");
  travel("forest");
  travel("camp");
  expect(world.expedition).toEqual(completed);
  expect(world.interactExpedition(combat)).toBe(false);
  session.exploration = world.capture(
    player.controller.walker.position,
    session.loot,
  );
  expect(
    new WorldSession(
      deserializeCharacter(serializeCharacter(session)).exploration,
    ).expedition,
  ).toEqual(completed);
});
it("migrates prior discovery snapshots without awarding completion and rejects forged expedition data", () => {
  const session = createInventorySession(),
    world = new WorldSession();
  const saved = world.capture(world.travel.state.position, session.loot);
  const legacy = structuredClone(saved);
  legacy.version = 3;
  delete legacy.expedition;
  expect(new WorldSession(legacy).expedition.stage).toBe("ready");
  for (const change of [
    { id: "forged" },
    { stage: ["ready"] },
    { stage: "complete", reached: 0 },
    { reached: 3 },
    { version: 3 },
  ]) {
    const invalid = structuredClone(saved);
    Object.assign(invalid.expedition!, change);
    expect(() => validateExploration(invalid)).toThrow();
  }
});
it("does not complete aborted trips or grant an objective from an unstarted crypt save", () => {
  const session = createInventorySession(),
    combat = createCombat();
  const isolated = new WorldSession(undefined, 42, 2, "ancient-crypt");
  combat.actors[0]!.controller.walker.position = {
    ...isolated.objectivePosition!,
  };
  expect(isolated.interactExpedition(combat)).toBe(false);
  const world = new WorldSession();
  for (const id of [
    "forest",
    "graveyard",
    "crypt",
    "graveyard",
    "forest",
    "camp",
  ]) {
    combat.actors[0]!.controller.walker.position = {
      ...world.travel.layout.exits.find((e) => e.id === id)!.trigger,
    };
    expect(world.transition(combat, session.loot)).toBe(true);
  }
  expect(world.expedition).toMatchObject({ stage: "outbound", reached: 3 });
});

import { expect, it } from "vitest";
import { WorldEncounterRuntime } from "./world-encounter-runtime";
import { WorldSession } from "./world-session";
import { createCombat } from "./combat";
import { createInventorySession } from "./inventory-world";
import { createLootWorld, consumeLootDeaths } from "./world-loot";
import { consumeMonsterDeathXp } from "./monster-experience";
import { serializeCharacter, deserializeCharacter } from "./inventory-save";
import { areaNavigation } from "../world/navigation";
it("defers whole packs near the restored player and never respawns activated identities", () => {
  const world = new WorldSession(undefined, 42, 2, "haunted-forest"),
    combat = createCombat();
  combat.actors = combat.actors.slice(0, 1);
  const runtime = new WorldEncounterRuntime(
    combat,
    world.travel.layout,
    new Set(),
  );
  const leader = runtime.plan[0]!;
  combat.actors[0]!.controller.walker.position = { ...leader.position };
  runtime.activate();
  expect(combat.actors.some((a) => a.id === leader.id)).toBe(false);
  combat.actors[0]!.controller.walker.position = {
    ...world.travel.layout.spawn,
  };
  runtime.activate();
  expect(combat.actors.some((a) => a.id === leader.id)).toBe(true);
  const ids = combat.actors.map((a) => a.id);
  runtime.activate();
  expect(combat.actors.map((a) => a.id)).toEqual(ids);
});
it("persists defeated identities with XP and one loot sequence across reload and return", () => {
  const session = createInventorySession(),
    combat = createCombat(),
    world = new WorldSession(undefined, 42, 2, "haunted-forest");
  session.loot = createLootWorld(42);
  combat.actors = combat.actors.slice(0, 1);
  combat.actors[0]!.controller.walker.position = {
    ...world.travel.layout.spawn,
  };
  const runtime = new WorldEncounterRuntime(
    combat,
    world.travel.layout,
    session.loot.deaths,
  );
  runtime.activate();
  const target = combat.actors[1]!;
  target.hp = 0;
  const death = {
    kind: "death" as const,
    actor: 0,
    target: target.id,
    tick: 1,
  };
  consumeMonsterDeathXp(combat, death);
  consumeLootDeaths(
    session.loot,
    combat,
    areaNavigation(world.travel.layout.map),
    [death],
  );
  const earned = combat.experience.character.totalXp;
  expect(earned).toBeGreaterThan(0);
  expect(session.loot.sequence).toBe(1);
  session.character = {
    ...session.character,
    level: combat.experience.character.level,
  };
  session.progression = {
    curve: "xp-v1",
    character: combat.experience.character,
    attributes: combat.experience.attributes,
    skills: combat.experience.skills,
  };
  session.exploration = world.capture(
    combat.actors[0]!.controller.walker.position,
    session.loot,
  );
  const saved = deserializeCharacter(serializeCharacter(session)),
    restored = new WorldSession(saved.exploration),
    loaded = createCombat();
  loaded.actors = loaded.actors.slice(0, 1);
  loaded.actors[0]!.controller.walker.position = {
    ...restored.travel.state.position,
  };
  loaded.experience.character = saved.progression!.character;
  restored.restoreDeaths(saved.loot, loaded);
  const encounter = new WorldEncounterRuntime(
    loaded,
    restored.travel.layout,
    saved.loot.deaths,
  );
  encounter.activate();
  expect(loaded.actors.some((a) => a.id === target.id)).toBe(false);
  loaded.actors.push(target);
  consumeMonsterDeathXp(loaded, death);
  consumeLootDeaths(
    saved.loot,
    loaded,
    areaNavigation(restored.travel.layout.map),
    [death],
  );
  expect(loaded.experience.character.totalXp).toBe(earned);
  expect(saved.loot.sequence).toBe(1);
  for (const exit of ["camp", "forest"]) {
    loaded.actors[0]!.controller.walker.position = {
      ...restored.travel.layout.exits.find((e) => e.id === exit)!.trigger,
    };
    expect(restored.transition(loaded, saved.loot)).toBe(true);
  }
  const returned = new WorldEncounterRuntime(
    loaded,
    restored.travel.layout,
    saved.loot.deaths,
  );
  returned.activate();
  expect(loaded.actors.some((a) => a.id === target.id)).toBe(false);
});

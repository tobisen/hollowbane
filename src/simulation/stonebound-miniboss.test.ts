import { expect, it } from "vitest";
import {
  CAIRNWARDEN,
  CAIRNWARDEN_XP,
  cairnwardenSpawn,
} from "./stonebound-miniboss";
import { bossHooks, selectBossAttack, validateBoss } from "./boss";
import { createCombat, applyCombatHit, stepCombat } from "./combat";
import { WorldSession } from "./world-session";
import { WorldEncounterRuntime } from "./world-encounter-runtime";
import { worldLayout } from "./world-layout";
import { planWorldEncounters } from "./world-encounters";
import { areaNavigation } from "../world/navigation";
import { consumeLootDeaths } from "./world-loot";
import { createInventorySession } from "./inventory-world";
import { serializeCharacter, deserializeCharacter } from "./inventory-save";
import { consumeMonsterDeathXp } from "./monster-experience";
import { itemContentForVersion } from "./item-content";

function fixture() {
  const session = new WorldSession(undefined, 42, 2, "forgotten-graveyard");
  const world = createCombat(42);
  world.actors = world.actors.slice(0, 1);
  world.actors[0]!.controller.walker.position = {
    ...session.travel.layout.spawn,
  };
  const inventory = createInventorySession();
  const runtime = new WorldEncounterRuntime(
    world,
    session.travel.layout,
    inventory.loot.deaths,
  );
  runtime.activate();
  const boss = runtime.boss!;
  const actor = world.actors.find((a) => a.id === boss.state.actor)!;
  world.actors = [world.actors[0]!, actor];
  const nav = areaNavigation(session.travel.layout.map);
  const tick = () =>
    stepCombat(
      world,
      nav,
      { x: 0, y: 0 },
      1,
      bossHooks(world, boss.definition, boss.state, boss.arena, nav),
    );
  return { session, world, inventory, runtime, boss, actor, nav, tick };
}

it("upgrades one stable graveyard Stonebound without changing generated packs or other areas", () => {
  validateBoss(CAIRNWARDEN);
  for (const seed of [0, 1, 17, 42, 255, 0xffffffff]) {
    const layout = worldLayout("forgotten-graveyard", seed, 2),
      plan = planWorldEncounters(layout);
    const chosen = cairnwardenSpawn(layout, plan)!;
    expect(chosen.role).toBe("tank");
    expect(cairnwardenSpawn(layout, plan)).toEqual(chosen);
    expect(planWorldEncounters(layout)).toEqual(plan);
    const world = createCombat();
    world.actors = world.actors.slice(0, 1);
    world.actors[0]!.controller.walker.position = { ...layout.spawn };
    const runtime = new WorldEncounterRuntime(world, layout, new Set());
    runtime.activate();
    expect(runtime.boss?.state.actor).toBe(chosen.id);
    expect(runtime.encounter.brains.some((b) => b.id === chosen.id)).toBe(
      false,
    );
    const oldSave = new WorldEncounterRuntime(
      createCombat(),
      layout,
      new Set([chosen.id]),
    );
    oldSave.encounter.combat.actors = oldSave.encounter.combat.actors.slice(
      0,
      1,
    );
    oldSave.encounter.combat.actors[0]!.controller.walker.position = {
      ...layout.spawn,
    };
    oldSave.activate();
    expect(oldSave.boss).toBeNull();
    expect(
      oldSave.encounter.combat.actors.some((a) => a.id === chosen.id),
    ).toBe(false);
  }
  expect(
    cairnwardenSpawn(worldLayout("ancient-crypt", 42, 2), []),
  ).toBeUndefined();
});

it("changes real phase behavior at half health, preserves warning time and permits free escape/reset", () => {
  const f = fixture(),
    player = f.world.actors[0]!;
  player.controller.walker.position = { ...f.boss.arena.home };
  f.tick();
  expect(f.boss.state.engaged).toBe(true);
  expect(selectBossAttack(CAIRNWARDEN, f.boss.state, () => 0).id).toBe(
    "cairn-cleave",
  );
  applyCombatHit(f.world, player, f.actor, f.nav, {
    damage: 260,
    element: "physical",
    guaranteed: true,
  });
  for (let i = 0; i < 30 && f.boss.state.phase === 0; i++) f.tick();
  expect(f.boss.state.phase).toBe(1);
  expect(f.boss.state.transitionUntil - f.world.tick).toBe(120);
  expect(selectBossAttack(CAIRNWARDEN, f.boss.state, () => 0.99).id).toBe(
    "broken-binding",
  );
  for (let i = 0; i < 180 && !f.boss.state.telegraph; i++) f.tick();
  const warning = f.boss.state.telegraph!;
  const attack = CAIRNWARDEN.attacks.find((a) => a.id === warning.attack)!;
  expect(warning.strikeAt - warning.started).toBe(attack.timing.windup - 1);
  expect(attack.timing.windup).toBeGreaterThanOrEqual(60);
  // The arena has no blocking walls; leaving is a reset, never completion/reward.
  player.controller.walker.position = { ...f.session.travel.layout.spawn };
  f.tick();
  expect(f.boss.state.engaged).toBe(false);
  expect(f.boss.state.complete).toBe(false);
  expect(f.actor.hp).toBe(CAIRNWARDEN.health);
  expect(f.inventory.loot.deaths.size).toBe(0);
});

it("records one real death, exact XP and deterministic loot with save/reload and quest compatibility", () => {
  const run = () => {
    const f = fixture(),
      player = f.world.actors[0]!;
    const quests = f.session.quests;
    player.controller.walker.position = { ...f.boss.arena.home };
    f.tick();
    applyCombatHit(f.world, player, f.actor, f.nav, {
      damage: 9999,
      element: "physical",
      guaranteed: true,
    });
    const death = f.world.events.find((e) => e.kind === "death")!;
    f.session.consumeQuestDeaths(f.world);
    consumeLootDeaths(
      f.inventory.loot,
      f.world,
      f.nav,
      f.world.events,
      itemContentForVersion(3),
    );
    f.tick();
    expect(f.boss.state.complete).toBe(true);
    expect(f.world.experience.character.totalXp).toBe(CAIRNWARDEN_XP);
    expect(f.inventory.loot.sequence).toBe(1);
    expect(f.session.quests).toEqual(quests);
    f.inventory.character.level = f.world.experience.character.level;
    f.inventory.progression = {
      curve: "xp-v1",
      character: f.world.experience.character,
      attributes: f.world.experience.attributes,
      skills: f.world.experience.skills,
    };
    f.inventory.exploration = f.session.capture(
      player.controller.walker.position,
      f.inventory.loot,
    );
    const saved = deserializeCharacter(serializeCharacter(f.inventory));
    const restored = new WorldSession(saved.exploration),
      world = createCombat();
    world.actors = [world.actors[0]!, f.actor];
    world.actors[0]!.controller.walker.position = {
      ...restored.travel.layout.spawn,
    };
    world.experience.character = saved.progression!.character;
    restored.restoreDeaths(saved.loot, world);
    consumeMonsterDeathXp(world, death);
    consumeLootDeaths(
      saved.loot,
      world,
      f.nav,
      [death],
      itemContentForVersion(3),
    );
    expect(world.experience.character.totalXp).toBe(CAIRNWARDEN_XP);
    expect(saved.loot.sequence).toBe(1);
    world.actors = world.actors.slice(0, 1);
    const runtime = new WorldEncounterRuntime(
      world,
      restored.travel.layout,
      saved.loot.deaths,
    );
    runtime.activate();
    expect(runtime.boss).toBeNull();
    expect(world.actors.some((a) => a.id === f.actor.id)).toBe(false);
    return { loot: saved.loot, progression: saved.progression };
  };
  expect(run()).toEqual(run());
});

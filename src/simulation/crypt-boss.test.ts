import { expect, it } from "vitest";
import {
  CRYPT_BOSS,
  CRYPT_BOSS_XP,
  cryptBossSpawn,
  installCryptBossTrial,
} from "./crypt-boss";
import { bossDangerContains, bossHooks } from "./boss";
import { createCombat, stepCombat, applyCombatHit } from "./combat";
import { commandCombat } from "./combat-targeting";
import { createSkills, skillHooks, SKILLS } from "./skills";
import { applyStatus, stepStatuses } from "./skill-effects";
import { worldLayout, layoutFingerprint } from "./world-layout";
import {
  planWorldEncounters,
  validWorldMonsterIdentity,
} from "./world-encounters";
import { WorldEncounterRuntime } from "./world-encounter-runtime";
import { areaWalkable } from "./area-map";
import { areaNavigation, canWalk, findPath } from "../world/navigation";

// Immutable real generated fixtures; no repeated save-validation/layout work.
const layouts = new Map(
  [0, 1, 17, 42, 255, 0xffffffff].map((seed) => [
    seed,
    worldLayout("ancient-crypt", seed, 2),
  ]),
);
function fixture(seed = 42) {
  const layout = layouts.get(seed)!;
  const world = createCombat(seed);
  const boss = installCryptBossTrial(world, layout);
  const actor = world.actors[1]!,
    player = world.actors[0]!;
  const nav = areaNavigation(layout.map),
    skills = createSkills(world);
  const definition = structuredClone(CRYPT_BOSS);
  const tick = () =>
    stepCombat(
      world,
      nav,
      { x: 0, y: 0 },
      1,
      bossHooks(
        world,
        definition,
        boss.state,
        boss.arena,
        nav,
        skillHooks(skills, nav),
      ),
    );
  const until = (predicate: () => boolean, frames = 600) => {
    for (let i = 0; i < frames && !predicate(); i++) tick();
    expect(predicate()).toBe(true);
  };
  return {
    world,
    boss,
    actor,
    player,
    nav,
    skills,
    definition,
    tick,
    until,
    layout,
  };
}

it.each([...layouts.values()])(
  "places one reachable crypt boss with clear counterplay and stable identity for map seed $map.seed",
  (layout) => {
    const before = layoutFingerprint(layout),
      plan = planWorldEncounters(layout);
    const spawn = cryptBossSpawn(layout, plan)!;
    expect(spawn).toEqual(cryptBossSpawn(layout, plan));
    expect(validWorldMonsterIdentity("ancient-crypt", spawn.id)).toBe(true);
    expect(areaWalkable(layout.map, spawn.position, 2.4)).toBe(true);
    expect(
      findPath(areaNavigation(layout.map), layout.spawn, spawn.position).length,
    ).toBeGreaterThan(0);
    const world = createCombat();
    world.actors = world.actors.slice(0, 1);
    world.actors[0]!.controller.walker.position = { ...layout.spawn };
    const runtime = new WorldEncounterRuntime(world, layout, new Set());
    runtime.activate();
    expect(runtime.boss?.definition.id).toBe(CRYPT_BOSS.id);
    expect(runtime.encounter.brains.some((b) => b.id === spawn.id)).toBe(false);
    const old = new WorldEncounterRuntime(world, layout, new Set([spawn.id]));
    world.actors = world.actors.slice(0, 1);
    old.activate();
    expect(old.boss).toBeNull();
    expect(layoutFingerprint(layout)).toBe(before);
    expect(planWorldEncounters(layout)).toEqual(plan);
  },
);

it.each(CRYPT_BOSS.attacks)(
  "$id locks its real warning, deals its element once, and can be escaped through navigation",
  (attack) => {
    for (const dodge of [false, true]) {
      const f = fixture();
      f.definition.phases[0]!.attacks = [attack.id];
      f.until(() => !!f.boss.state.telegraph);
      const warning = structuredClone(f.boss.state.telegraph!);
      expect(warning.shape).toEqual(attack.shape);
      expect(warning.strikeAt - warning.started).toBe(attack.timing.windup - 1);
      const hp = f.player.hp;
      if (dodge) {
        const safe = {
          x: f.boss.arena.home.x + 2.2,
          y: f.boss.arena.home.y,
        };
        // Circle escape; narrow lines/cones escape sideways on the same clear floor.
        if (attack.shape.kind !== "circle")
          Object.assign(safe, {
            x: f.boss.arena.home.x + 0.5,
            y: f.boss.arena.home.y + 2.2,
          });
        expect(canWalk(f.nav, safe)).toBe(true);
        expect(bossDangerContains(warning, safe)).toBe(false);
        f.player.controller = commandCombat(f.player.controller, {
          kind: "move",
          target: safe,
        });
      }
      while (f.world.tick < warning.strikeAt - 1) {
        f.tick();
        expect(f.player.hp).toBe(hp);
      }
      expect(f.boss.state.telegraph).toEqual(warning);
      f.tick();
      const hits = f.world.events.filter(
        (e) => e.kind === "damage" && e.actor === f.actor.id,
      );
      expect(hits).toHaveLength(dodge ? 0 : 1);
      if (!dodge) {
        expect(f.player.hp).toBeLessThan(hp);
        expect(hits[0]).toMatchObject({ result: { type: attack.element } });
      }
      const after = f.player.hp;
      for (let i = 0; i < attack.timing.active + 5; i++) f.tick();
      expect(f.player.hp).toBe(after);
    }
  },
);

it("changes both attack pools at half health and grants the complete preparation window", () => {
  const f = fixture();
  f.tick();
  f.player.offense.criticalChance = 0;
  applyCombatHit(f.world, f.player, f.actor, f.nav, {
    damage: 400,
    element: "physical",
    guaranteed: true,
  });
  f.until(() => f.boss.state.phase === 1);
  expect(f.actor.hp).toBeGreaterThan(0);
  expect(f.boss.state.transitionUntil - f.world.tick).toBe(150);
  for (let i = 0; i < 149; i++) {
    f.tick();
    expect(f.boss.state.telegraph).toBeNull();
  }
  f.until(() => !!f.boss.state.telegraph);
  expect(CRYPT_BOSS.phases[1]!.attacks).toContain(
    f.boss.state.telegraph!.attack,
  );
  expect(CRYPT_BOSS.phases[0]!.attacks).not.toContain(
    f.boss.state.telegraph!.attack,
  );
});

it("uses existing elemental resistance, vulnerability, slow expiration and stagger interruption", () => {
  const f = fixture();
  f.player.offense.criticalChance = 0;
  applyCombatHit(f.world, f.player, f.actor, f.nav, {
    damage: 100,
    element: "fire",
    guaranteed: true,
  });
  expect(f.actor.hp).toBe(370);
  applyCombatHit(f.world, f.player, f.actor, f.nav, {
    damage: 100,
    element: "cold",
    guaranteed: true,
  });
  expect(f.actor.hp).toBe(295);
  const base = f.actor.movement!.walkSpeed;
  const rime = SKILLS.find((s) => s.id === "rime-ring")!;
  if (rime.kind !== "active") throw Error("Expected active Rime Ring");
  expect(applyStatus(f.skills, rime, f.player, f.actor)).toBe(true);
  stepStatuses(f.skills, f.nav);
  expect(f.actor.movement!.walkSpeed).toBeCloseTo(base * 0.6);
  f.until(() => !!f.boss.state.telegraph);
  const strikeAt = f.boss.state.telegraph!.strikeAt,
    hp = f.player.hp;
  applyCombatHit(f.world, f.player, f.actor, f.nav, {
    damage: 30,
    element: "fire",
    guaranteed: true,
    stagger: true,
  });
  f.tick();
  expect(f.boss.state.telegraph).toBeNull();
  expect(f.boss.state.events.some((e) => e.kind === "interrupt")).toBe(true);
  while (f.world.tick <= strikeAt) f.tick();
  expect(f.player.hp).toBe(hp);
  f.world.tick = 181;
  stepStatuses(f.skills, f.nav);
  expect(f.actor.movement!.walkSpeed).toBe(base);
});

it("resets living encounters on escape/death and emits one terminal completion with normal XP", () => {
  const f = fixture();
  f.tick();
  f.actor.hp = 100;
  f.player.controller.walker.position = { ...f.layout.spawn };
  f.tick();
  expect(f.boss.state.engaged).toBe(false);
  expect(f.actor.hp).toBe(CRYPT_BOSS.health);
  expect(f.boss.state.complete).toBe(false);
  f.player.controller.walker.position = { ...f.boss.arena.home };
  f.tick();
  f.player.hp = 0;
  f.tick();
  expect(f.boss.state.engaged).toBe(false);
  f.player.hp = f.player.maxHp;
  applyCombatHit(f.world, f.player, f.actor, f.nav, {
    damage: 9999,
    element: "physical",
    guaranteed: true,
  });
  for (let i = 0; i < 200; i++) f.tick();
  expect(f.boss.state.events.filter((e) => e.kind === "complete")).toHaveLength(
    1,
  );
  expect(f.boss.state.events.filter((e) => e.kind === "death")).toHaveLength(1);
  expect(f.world.experience.character.totalXp).toBe(CRYPT_BOSS_XP);
});

it("replays the complete two-phase timeline identically for three seeds", () => {
  const run = (seed: number) => {
    const f = fixture(seed);
    for (let i = 0; i < 600; i++) {
      if (i === 240) f.actor.hp = 230;
      f.tick();
    }
    return {
      state: f.boss.state,
      events: f.world.events,
      seed: f.world.seed,
      actors: f.world.actors,
    };
  };
  for (const seed of [0, 17, 42]) expect(run(seed)).toEqual(run(seed));
});

import { expect, test } from "vitest";
import { ARENA_NAV, applyCombatHit, createCombat, stepCombat } from "./combat";
import { CHARACTER_CLASSES, classEquipmentBase } from "./character-classes";
import { newCharacter } from "./new-character";
import {
  applyEquipment,
  captureEquipmentBase,
  deriveEquipment,
} from "./equipment-stats";
import { WorldEncounterRuntime } from "./world-encounter-runtime";
import { worldLayout } from "./world-layout";
import { createMonster, MONSTER_PROFILES } from "./monsters";
import { stepMonsterAI } from "./monster-ai";
import { commandCombat } from "./combat-targeting";
import { createSkills, skillHooks } from "./skills";
import { OpeningRecovery, OPENING_BALANCE } from "./opening-balance";
import { fromGround } from "../world/navigation";
import { consumeLootDeaths } from "./world-loot";
import { configureWorldRewards } from "./world-rewards";
import { registeredContentForTable } from "./item-registry";
import { serializeCharacter, deserializeCharacter } from "./inventory-save";

test("forest tuning preserves seeded identities, reward tiers and later monster stats", () => {
  for (const area of [
    "haunted-forest",
    "forgotten-graveyard",
    "ancient-crypt",
  ] as const) {
    const layout = worldLayout(area, 42, 2),
      world = createCombat();
    world.actors = world.actors.slice(0, 1);
    world.actors[0]!.controller.walker.position = { ...layout.spawn };
    const runtime = new WorldEncounterRuntime(world, layout, new Set());
    runtime.activate();
    expect(world.actors.length).toBe(runtime.plan.length + 1);
    expect(runtime.attackLimit).toBe(area === "haunted-forest" ? 2 : undefined);
    for (const spawn of runtime.plan) {
      const actor = world.actors.find((a) => a.id === spawn.id)!;
      if (area === "haunted-forest") {
        expect(actor.maxHp).toBe(MONSTER_PROFILES[spawn.role].health);
        expect(actor.offense.damage).toBeCloseTo(
          MONSTER_PROFILES[spawn.role].damage,
        );
        expect(actor.encounterDamageScale).toBe(0.65);
        expect(actor.xpReward).toBe(
          Math.round(
            25 *
              (spawn.tier === "elite"
                ? 1.5
                : spawn.tier === "champion"
                  ? 1.25
                  : 1),
          ),
        );
      } else if (!runtime.boss || actor.id !== runtime.boss.state.actor) {
        const original = createMonster(
          spawn.id,
          spawn.role,
          spawn.position,
          spawn.pack,
          world.seed,
          spawn.tier !== "normal",
        ).actor;
        const scale = 1 + (area === "forgotten-graveyard" ? 2 : 4) * 0.12;
        expect(actor.offense.damage).toBe(
          original.offense.damage * scale * (spawn.tier === "elite" ? 1.2 : 1),
        );
        expect(actor.encounterDamageScale).toBeUndefined();
      }
    }
  }
});

test("forest power reduces both weapon and monster skill hits without a global multiplier", () => {
  const damage = (power: number, skill: boolean) => {
    const world = createCombat();
    const source = world.actors[3]!,
      player = world.actors[0]!;
    source.encounterDamageScale = power;
    // Real skill status processing must not erase the biome's damage scale.
    stepCombat(
      world,
      ARENA_NAV,
      { x: 0, y: 0 },
      1,
      skillHooks(createSkills(world)),
    );
    source.offense.damage = 20;
    source.offense.criticalChance = 0;
    const hp = player.hp;
    applyCombatHit(
      world,
      source,
      player,
      ARENA_NAV,
      skill
        ? { damage: 20, element: "fire", guaranteed: true }
        : {
            damage: 20,
            element: "physical",
            guaranteed: true,
            origin: "weapon",
          },
    );
    return hp - player.hp;
  };
  for (const skill of [false, true])
    expect(damage(0.65, skill) / damage(1, skill)).toBeGreaterThanOrEqual(0.6);
  for (const skill of [false, true])
    expect(damage(0.65, skill) / damage(1, skill)).toBeLessThanOrEqual(0.7);
});

test("forest attack budget includes ranged and queued attacks and releases slots on death", () => {
  const world = createCombat();
  world.actors = world.actors.slice(0, 1);
  const monsters = [1, 2, 3].map((id) =>
    createMonster(id, "ranged", fromGround({ x: 340 - id * 10, y: 560 })),
  );
  world.actors.push(...monsters.map((m) => m.actor));
  for (const { brain } of monsters) {
    brain.nextThink = 0;
    brain.state = "chase";
  }
  stepMonsterAI(
    world,
    monsters.map((m) => m.brain),
    ARENA_NAV,
    2,
    2,
  );
  expect(monsters.filter((m) => m.actor.controller.queuedAttack)).toHaveLength(
    2,
  );
  expect(monsters[2]!.actor.controller.queuedAttack).toBe(false);
  monsters[0]!.actor.hp = monsters[1]!.actor.hp = 0;
  world.tick = 12;
  stepMonsterAI(
    world,
    monsters.map((m) => m.brain),
    ARENA_NAV,
    2,
    2,
  );
  expect(monsters[2]!.actor.controller.queuedAttack).toBe(true);
});

for (const baseline of [true, false])
  for (const definition of CHARACTER_CLASSES)
    test(`${definition.id} level-one starter defeats a forest pack (${baseline ? "previous balance" : "opening balance"})`, () => {
      const session = newCharacter(definition.id),
        world = createCombat();
      const layout = worldLayout("haunted-forest", 42, 2);
      world.actors = world.actors.slice(0, 1);
      const player = world.actors[0]!;
      player.controller.walker.position = { ...layout.spawn };
      world.experience.character = session.progression!.character;
      world.experience.attributes = session.progression!.attributes;
      world.experience.skills = session.progression!.skills;
      world.hostilesActive = false;
      const runtime = new WorldEncounterRuntime(world, layout, new Set());
      runtime.activate();
      const pack = runtime.plan[0]!.pack;
      const brains = runtime.encounter.brains.filter((b) => b.pack === pack);
      world.actors = world.actors.filter(
        (a) => a.id === 0 || brains.some((b) => b.id === a.id),
      );
      if (baseline)
        for (const actor of world.actors.filter((a) => a.id !== 0)) {
          const spawn = runtime.plan.find((s) => s.id === actor.id)!;
          const original = createMonster(
            spawn.id,
            spawn.role,
            spawn.position,
            spawn.pack,
            world.seed,
            spawn.tier !== "normal",
          ).actor;
          actor.hp = actor.maxHp = Math.round(
            original.maxHp * (spawn.tier === "elite" ? 1.5 : 1),
          );
          actor.offense.damage =
            original.offense.damage * (spawn.tier === "elite" ? 1.2 : 1);
          delete actor.encounterDamageScale;
        }
      // Isolated authored pack on the existing open mechanics floor; no navigation AI.
      player.controller.walker.position = fromGround({ x: 650, y: 560 });
      for (const [index, brain] of brains.entries()) {
        const actor = world.actors.find((a) => a.id === brain.id)!;
        actor.controller.walker.position = fromGround({
          x: 700 + index * 30,
          y: 560,
        });
        brain.home = { ...actor.controller.walker.position };
      }
      const skills = createSkills(world),
        user = skills.users[0]!;
      applyEquipment(
        deriveEquipment(
          session.character,
          classEquipmentBase(definition, captureEquipmentBase(player)),
        ),
        player,
        user,
      );
      player.hp = player.maxHp;
      user.mana = user.maxMana;
      const startHp = player.hp;
      let maximum = 0;
      configureWorldRewards(session.loot, "haunted-forest");
      for (
        let tick = 0;
        tick < 2400 &&
        player.hp > 0 &&
        world.actors.some((a) => a.id && a.hp > 0);
        tick++
      ) {
        const target = world.actors.find((a) => a.id && a.hp > 0)!;
        if (player.controller.timeline.phase === "idle")
          player.controller = commandCombat(player.controller, {
            kind: "attack",
            target: target.id,
            repeat: true,
          });
        stepMonsterAI(
          world,
          brains,
          ARENA_NAV,
          2,
          baseline ? undefined : runtime.attackLimit,
        );
        maximum = Math.max(
          maximum,
          world.actors.filter(
            (a) =>
              a.id &&
              a.hp > 0 &&
              (a.controller.queuedAttack ||
                ["windup", "active", "recovery"].includes(
                  a.controller.timeline.phase,
                )),
          ).length,
        );
        stepCombat(world, ARENA_NAV, { x: 0, y: 0 }, 1, skillHooks(skills));
        consumeLootDeaths(
          session.loot,
          world,
          ARENA_NAV,
          world.events.filter((e) => e.tick === world.tick),
          registeredContentForTable(session.loot.table, 9),
        );
      }
      const metrics = {
        classId: definition.id,
        baseline,
        ticks: world.tick,
        startHp,
        hp: player.hp,
        xp: world.experience.character.totalXp,
        loot: session.loot.sequence,
        maximum,
      };
      console.log("Opening stationary pack", JSON.stringify(metrics));
      expect(
        world.actors.filter((a) => a.id && a.hp > 0),
        JSON.stringify(metrics),
      ).toHaveLength(0);
      expect(player.hp).toBeGreaterThan(0);
      expect(maximum).toBeLessThanOrEqual(baseline ? 3 : 2);
      expect(session.loot.sequence).toBe(3);
      expect(world.experience.character.totalXp).toBeGreaterThanOrEqual(75);
      expect(session.character.equipment.main?.base).toBe(
        definition.starterWeapon,
      );
      expect(
        serializeCharacter(deserializeCharacter(serializeCharacter(session))),
      ).toBe(serializeCharacter(session));
    });

test("recovery waits five safe seconds, resets on danger, clamps resources and never revives or reaches later areas", () => {
  const world = createCombat();
  world.actors = world.actors.slice(0, 1);
  const p = world.actors[0]!,
    skills = createSkills(world),
    user = skills.users[0]!,
    recovery = new OpeningRecovery();
  p.hp = 50;
  user.mana = 20;
  const step = (
    count: number,
    area = "haunted-forest" as "haunted-forest" | "ancient-crypt",
  ) => {
    for (let i = 0; i < count; i++) {
      world.tick++;
      recovery.step(world, skills, area);
    }
  };
  step(OPENING_BALANCE.recoveryDelay);
  expect(p.hp).toBe(50);
  expect(user.mana).toBe(20);
  step(60);
  expect(p.hp).toBeCloseTo(53);
  expect(user.mana).toBeCloseTo(26);
  const enemy = createMonster(9, "melee", {
    ...p.controller.walker.position,
  }).actor;
  world.actors.push(enemy);
  step(400);
  expect(p.hp).toBeCloseTo(53);
  enemy.hp = 0;
  step(300);
  expect(p.hp).toBeCloseTo(53);
  step(1, "ancient-crypt");
  step(300);
  expect(p.hp).toBeCloseTo(53);
  p.hp = p.maxHp - 0.01;
  user.mana = user.maxMana - 0.01;
  step(1);
  expect(p.hp).toBe(p.maxHp);
  expect(user.mana).toBe(user.maxMana);
  p.hp = 0;
  step(600);
  expect(p.hp).toBe(0);
});

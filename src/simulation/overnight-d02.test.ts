import { expect, it } from "vitest";
import { createCombat } from "./combat";
import { WorldSession } from "./world-session";
import { createInventorySession } from "./inventory-world";
import { serializeCharacter, deserializeCharacter } from "./inventory-save";
import { EXPEDITION_REWARD } from "./world-expedition";
import { validateExploration } from "./world-save";
import { WorldEncounterRuntime } from "./world-encounter-runtime";
import {
  CHARACTER_CLASSES,
  classEquipmentBase,
  createClassFoundation,
} from "./character-classes";
import {
  createMonsterExperience,
  consumeMonsterDeathXp,
} from "./monster-experience";
import { DEFAULT_XP_CURVE } from "./experience";
import { createCharacterInventory } from "./equipment";
import {
  captureEquipmentBase,
  deriveEquipment,
  applyEquipment,
} from "./equipment-stats";
import {
  createSkillProgression,
  allocateSkillRanks,
} from "./skill-progression";
import {
  createSkills,
  requestSkill,
  stepSkillCombat,
  actorSkill,
} from "./skills";
import { commandCombat } from "./combat-targeting";
import { stepMonsterAI } from "./monster-ai";
import { areaNavigation, canWalk, segmentWalkable } from "../world/navigation";
import { allocateAttributes, attributeValues } from "./attributes";

function fixture() {
  const world = new WorldSession(),
    combat = createCombat(),
    session = createInventorySession();
  const travel = (exit: string) => {
    combat.actors[0]!.controller.walker.position = {
      ...world.travel.layout.exits.find((e) => e.id === exit)!.trigger,
    };
    expect(world.transition(combat, session.loot)).toBe(true);
  };
  for (const exit of ["forest", "graveyard", "crypt"]) travel(exit);
  combat.actors[0]!.controller.walker.position = {
    ...world.objectivePosition!,
  };
  return { world, combat, session, travel };
}

it("claims the objective XP/gold and point budgets together, then preserves the ledger through completion/reload/re-entry", () => {
  const { world, combat, session, travel } = fixture();
  const before = structuredClone(session.character);
  expect(world.interactExpedition(combat)).toBe(true);
  expect(world.containerState.gold).toBe(EXPEDITION_REWARD.gold);
  expect(combat.experience.character.totalXp).toBe(EXPEDITION_REWARD.xp);
  expect(combat.experience.attributes.available).toBe(5);
  expect(combat.experience.skills.available).toBe(1);
  expect(world.interactExpedition(combat)).toBe(false);
  for (const exit of ["graveyard", "forest", "camp"]) travel(exit);
  session.character = { ...before, level: combat.experience.character.level };
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
  const restored = deserializeCharacter(serializeCharacter(session));
  const loaded = new WorldSession(restored.exploration);
  expect(loaded.expedition).toMatchObject({
    stage: "complete",
    reward: "claimed",
  });
  expect(loaded.interactExpedition(combat)).toBe(false);
  expect(restored.progression).toEqual(session.progression);
  expect(restored.character.grid).toEqual(before.grid);
  expect(restored.loot).toEqual(
    deserializeCharacter(serializeCharacter(session)).loot,
  );
  expect(loaded.containerState.gold).toBe(EXPEDITION_REWARD.gold);
});

it("rejects gold overflow without changing XP, objective, points or the reward ledger", () => {
  const { world, combat, session } = fixture();
  world.containerState.gold = Number.MAX_SAFE_INTEGER;
  const before = world.capture(
    combat.actors[0]!.controller.walker.position,
    session.loot,
  );
  const xp = structuredClone(combat.experience);
  expect(world.interactExpedition(combat)).toBe(false);
  expect(
    world.capture(combat.actors[0]!.controller.walker.position, session.loot),
  ).toEqual(before);
  expect(combat.experience).toEqual(xp);
});

it("migrates previously attuned/completed expeditions without retroactive rewards and rejects contradictory reward ledgers", () => {
  const { world, combat, session, travel } = fixture();
  world.interactExpedition(combat);
  for (const exit of ["graveyard", "forest", "camp"]) travel(exit);
  const saved = world.capture(
    combat.actors[0]!.controller.walker.position,
    session.loot,
  );
  for (const stage of ["returning", "complete"] as const) {
    const legacy = structuredClone(saved);
    legacy.expedition = {
      version: 1,
      id: world.expedition.id,
      stage,
      reached: 3,
    };
    expect(new WorldSession(legacy).expedition).toMatchObject({
      version: 2,
      reward: "legacy",
      stage,
    });
  }
  for (const reward of ["pending", "forged", ["claimed"]]) {
    const invalid = structuredClone(saved);
    Object.assign(invalid.expedition!, { reward });
    expect(() => validateExploration(invalid)).toThrow();
  }
});

it("increases generated monster XP with area/tier while retaining deterministic packs and replay protection", () => {
  const totals: number[] = [];
  for (const area of [
    "haunted-forest",
    "forgotten-graveyard",
    "ancient-crypt",
  ] as const) {
    const world = new WorldSession(undefined, 42, 2, area),
      combat = createCombat();
    combat.actors = combat.actors.slice(0, 1);
    combat.actors[0]!.controller.walker.position = {
      ...world.travel.layout.spawn,
    };
    const runtime = new WorldEncounterRuntime(
      combat,
      world.travel.layout,
      new Set(),
    );
    runtime.activate();
    totals.push(
      combat.actors.slice(1).reduce((sum, a) => sum + a.xpReward!, 0),
    );
    const target = combat.actors[1]!;
    target.hp = 0;
    const event = {
      kind: "death" as const,
      actor: 0,
      target: target.id,
      tick: 1,
    };
    consumeMonsterDeathXp(combat, event);
    consumeMonsterDeathXp(combat, event);
    expect(combat.experience.character.totalXp).toBe(target.xpReward);
    expect(runtime.plan).toEqual(
      new WorldEncounterRuntime(createCombat(), world.travel.layout, new Set())
        .plan,
    );
  }
  expect(totals[1]).toBeGreaterThan(totals[0]!);
  expect(totals[2]).toBeGreaterThan(totals[1]!);
});

it.each(CHARACTER_CLASSES)(
  "level-three $name defeats seeded representatives in each biome using timed combat/skills and live AI",
  (definition) => {
    const metrics: unknown[] = [];
    for (const area of [
      "haunted-forest",
      "forgotten-graveyard",
      "ancient-crypt",
    ] as const) {
      const world = new WorldSession(undefined, 42, 2, area),
        combat = createCombat(42);
      const player = combat.actors[0]!;
      combat.actors = [player];
      player.controller.walker.position = { ...world.travel.layout.spawn };
      const runtime = new WorldEncounterRuntime(
        combat,
        world.travel.layout,
        new Set(),
      );
      runtime.activate();
      const target = combat.actors[1]!,
        brain = runtime.encounter.brains.find((b) => b.id === target.id)!;
      combat.actors = [player, target];
      const nav = areaNavigation(world.travel.layout.map),
        p = target.controller.walker.position;
      const nearby = (definition.id === "warrior" ? [0.8] : [4, 3, 2, 1.2])
        .flatMap((spacing) =>
          Array.from({ length: 16 }, (_, i) => ({
            x: p.x + Math.cos((i * Math.PI) / 8) * spacing,
            y: p.y + Math.sin((i * Math.PI) / 8) * spacing,
          })),
        )
        .find((point) => canWalk(nav, point) && segmentWalkable(nav, point, p));
      expect(nearby).toBeDefined();
      player.controller.walker.position = { ...nearby! };
      const totalXp = DEFAULT_XP_CURVE[2]!;
      combat.experience = createMonsterExperience(totalXp);
      combat.experience.attributes = createClassFoundation(
        definition,
        totalXp,
      ).attributes;
      combat.experience.attributes = allocateAttributes(
        combat.experience.attributes,
        definition.id === "warrior"
          ? { strength: 4, vitality: 6 }
          : definition.id === "sorcerer"
            ? { energy: 6, vitality: 4 }
            : { dexterity: 6, vitality: 4 },
      );
      const [node, skill] =
        definition.id === "warrior"
          ? ["warrior-arms-foundation", "iron-fan"]
          : definition.id === "sorcerer"
            ? ["sorcerer-ember-foundation", "ember-lance"]
            : ["ranger-wilds-foundation", "briar-edge"];
      combat.experience.skills = allocateSkillRanks(
        createSkillProgression(definition.id, 3),
        3,
        { [node!]: 1 },
      );
      const skills = createSkills(combat),
        user = skills.users[0]!;
      applyEquipment(
        deriveEquipment(createCharacterInventory(3), {
          ...classEquipmentBase(
            definition,
            captureEquipmentBase(player),
            totalXp,
          ),
          attributes: attributeValues(combat.experience.attributes),
        }),
        player,
        user,
      );
      player.hp = player.maxHp;
      user.mana = user.maxMana;
      let ticks = 0;
      for (; ticks < 3600 && target.hp > 0 && player.hp > 0; ticks++) {
        stepMonsterAI(combat, [brain], nav);
        if (
          !user.cast &&
          player.controller.timeline.phase === "idle" &&
          (user.cooldowns[skill!] ?? 0) <= combat.tick &&
          user.mana >= actorSkill(skills, 0, skill!)!.mana
        ) {
          const from = player.controller.walker.position,
            to = target.controller.walker.position;
          requestSkill(skills, {
            actor: 0,
            skill: skill!,
            target: target.id,
            direction: { x: to.x - from.x, y: to.y - from.y },
          });
        } else if (!user.cast && player.controller.timeline.phase === "idle") {
          if (definition.id === "warrior")
            player.controller = commandCombat(player.controller, {
              kind: "attack",
              target: target.id,
              repeat: true,
            });
          else if (!player.controller.walker.walking) {
            const from = player.controller.walker.position,
              to = target.controller.walker.position;
            const distance = (point: { x: number; y: number }) =>
              Math.hypot(point.x - to.x, point.y - to.y);
            if (distance(from) < 3.5) {
              const retreat = Array.from({ length: 16 }, (_, i) => ({
                x: from.x + Math.cos((i * Math.PI) / 8) * 1.5,
                y: from.y + Math.sin((i * Math.PI) / 8) * 1.5,
              }))
                .filter(
                  (point) =>
                    canWalk(nav, point) &&
                    segmentWalkable(nav, from, point) &&
                    Math.hypot(point.x - brain.home.x, point.y - brain.home.y) <
                      8,
                )
                .sort((a, b) => distance(b) - distance(a))[0];
              if (retreat && distance(retreat) > distance(from) + 0.5)
                player.controller = commandCombat(player.controller, {
                  kind: "move",
                  target: retreat,
                });
            }
          }
        }
        stepSkillCombat(skills, nav);
      }
      metrics.push({
        class: definition.id,
        area,
        ticks,
        hp: player.hp,
        mana: user.mana,
      });
      expect(target.hp, JSON.stringify(metrics)).toBe(0);
      expect(player.hp).toBeGreaterThan(0);
      expect(combat.experience.character.totalXp).toBe(
        totalXp + target.xpReward!,
      );
    }
    console.log("D02 class fixtures", JSON.stringify(metrics));
  },
  20000,
);

import { expect, it } from "vitest";
import { createCombat } from "../../src/simulation/combat";
import {
  commandCombat,
  inAttackRange,
} from "../../src/simulation/combat-targeting";
import { stepMonsterAI } from "../../src/simulation/monster-ai";
import {
  createSkills,
  requestSkill,
  stepSkillCombat,
} from "../../src/simulation/skills";
import { WorldEncounterRuntime } from "../../src/simulation/world-encounter-runtime";
import { worldLayout } from "../../src/simulation/world-layout";
import { areaNavigation } from "../../src/world/navigation";

const position = { x: -7.55256719768197, y: -3.3650172484208247 };
const target = { x: -6.661087138594195, y: -3.5264083023559656 };
const layout = worldLayout("forgotten-graveyard", 42, 2);
const navigation = areaNavigation(layout.map);

/** Isolated mechanics fixture, not a replay of the whole campaign or pack. */
function setup() {
  const combat = createCombat(42);
  combat.hostilesActive = false;
  const player = combat.actors[0]!;
  combat.actors = [player];
  player.controller.walker.position = { ...layout.spawn };
  const world = new WorldEncounterRuntime(combat, layout, new Set());
  world.activate();
  const tank = combat.actors.find((a) => a.id === 3010)!;
  const brain = world.encounter.brains.find((b) => b.id === 3010)!;
  expect(tank.name).toBe("Stonebound");
  expect(tank.hp).toBe(248);
  expect(player.hp).toBe(300);
  expect(player.invulnerableUntil).toBe(0);
  combat.actors = [player, tank];
  player.controller.walker.position = { ...position };
  player.controller.walker.gait = "run";
  tank.controller.walker.position = { ...target };
  brain.home = { ...target };
  return { combat, player, tank, brain, runtime: createSkills(combat) };
}

it("preserves recorded Stonebound windup damage and cast interruption without a mana refund", () => {
  const { combat, player, tank, runtime } = setup();
  tank.controller = commandCombat(tank.controller, {
    kind: "attack",
    target: 0,
    repeat: false,
  });
  // The first ordinary hit builds stagger; the next hit interrupts the cast.
  for (let tick = 0; tick < 50; tick++) stepSkillCombat(runtime, navigation);
  expect(player.stagger).toBeGreaterThan(0);
  tank.controller = commandCombat(tank.controller, {
    kind: "attack",
    target: 0,
    repeat: false,
  });
  stepSkillCombat(runtime, navigation);
  stepSkillCombat(runtime, navigation);
  expect(inAttackRange(position, target, tank.range, navigation)).toBe(true);
  requestSkill(runtime, {
    actor: 0,
    skill: "iron-fan",
    target: 3010,
    direction: { x: target.x - position.x, y: target.y - position.y },
  });
  for (let tick = 0; tick < 14; tick++) stepSkillCombat(runtime, navigation);
  expect(player.hp).toBeLessThan(player.maxHp);
  expect(
    combat.events.some(
      (e) => e.kind === "damage" && e.actor === 3010 && e.target === 0,
    ),
  ).toBe(true);
  expect(runtime.events.some((e) => e.kind === "start" && e.actor === 0)).toBe(
    true,
  );
  expect(
    runtime.events.some((e) => e.kind === "interrupt" && e.actor === 0),
  ).toBe(true);
  expect(runtime.events.some((e) => e.kind === "effect" && e.actor === 0)).toBe(
    false,
  );
  expect(runtime.users.find((u) => u.actor === 0)!.mana).toBeLessThan(100);
  expect(tank.hp).toBe(248);
});

it("rechecks range at impact after ordinary movement and permits a legal countercast", () => {
  function replay() {
    const result = setup();
    const { combat, player, tank, runtime } = result;
    tank.controller = commandCombat(tank.controller, {
      kind: "attack",
      target: 0,
      repeat: false,
    });
    stepSkillCombat(runtime, navigation);
    stepSkillCombat(runtime, navigation);
    // Fixed, walkable recorded-position geometry; no tactical planner or threat policy.
    const dx = position.x - target.x,
      dy = position.y - target.y,
      distance = Math.hypot(dx, dy);
    player.controller = commandCombat(player.controller, {
      kind: "move",
      target: {
        x: position.x + (dx / distance) * 0.7,
        y: position.y + (dy / distance) * 0.7,
      },
    });
    for (let tick = 0; tick < 14; tick++) stepSkillCombat(runtime, navigation);
    expect(player.hp).toBe(player.maxHp);
    expect(
      combat.events.some((e) => e.actor === 3010 && e.kind === "whiff"),
    ).toBe(true);
    expect(
      inAttackRange(player.controller.walker.position, target, 1.8, navigation),
    ).toBe(true);
    requestSkill(runtime, {
      actor: 0,
      skill: "iron-fan",
      target: 3010,
      direction: {
        x: target.x - player.controller.walker.position.x,
        y: target.y - player.controller.walker.position.y,
      },
    });
    for (let tick = 0; tick < 12; tick++) stepSkillCombat(runtime, navigation);
    expect(runtime.events.some((e) => e.kind === "effect")).toBe(true);
    expect(runtime.events.some((e) => e.kind === "rejected")).toBe(false);
    expect(tank.hp).toBeLessThan(248);
    return { combat, runtime };
  }
  expect(replay()).toEqual(replay());
});

it("defeats the generated full-health Stonebound through deterministic real basic attacks while remaining vulnerable", () => {
  function replay() {
    const { combat, player, tank, brain, runtime } = setup();
    player.controller = commandCombat(player.controller, {
      kind: "attack",
      target: 3010,
      repeat: true,
    });
    for (let tick = 0; tick < 2400 && player.hp > 0 && tank.hp > 0; tick++) {
      stepMonsterAI(combat, [brain], navigation);
      stepSkillCombat(runtime, navigation);
    }
    expect(tank.hp).toBe(0);
    expect(player.hp).toBeGreaterThan(0);
    expect(player.hp).toBeLessThan(player.maxHp);
    expect(
      combat.events.filter((e) => e.kind === "death" && e.target === 3010),
    ).toHaveLength(1);
    return { combat, runtime };
  }
  expect(replay()).toEqual(replay());
});

import { expect, it } from "vitest";
import { applyCombatHit, ARENA_NAV, type CombatEvent } from "./combat";
import { createEncounter } from "./encounter";
import { createXpCurve, DEFAULT_XP_CURVE } from "./experience";
import {
  consumeMonsterDeathXp,
  createMonsterExperience,
  MONSTER_XP,
} from "./monster-experience";

function fixture() {
  const world = createEncounter(2).combat;
  const player = world.actors[0]!;
  const monster = world.actors[1]!;
  const kill = () =>
    applyCombatHit(world, player, monster, ARENA_NAV, {
      damage: 100000,
      element: "physical",
      guaranteed: true,
    });
  return { world, player, monster, kill };
}
function death(world: ReturnType<typeof fixture>["world"]): CombatEvent {
  return world.events.find((e) => e.kind === "death")!;
}

it("awards configured monster XP from the real lethal combat event", () => {
  const { world, monster, kill } = fixture();
  world.experience = createMonsterExperience(0, { ...MONSTER_XP, melee: 47 });
  kill();
  expect(monster.hp).toBe(0);
  expect(world.experience.character).toEqual({
    level: 1,
    totalXp: 47,
    nextLevelXp: 100,
  });
  expect(death(world)).toMatchObject({ actor: 0, target: monster.id });
});

it("ignores duplicate death events and repeated hits even after log eviction", () => {
  const { world, kill } = fixture();
  kill();
  const event = death(world);
  consumeMonsterDeathXp(world, event);
  world.events = [];
  kill();
  consumeMonsterDeathXp(world, event);
  expect(world.experience.character.totalXp).toBe(MONSTER_XP.melee);
  expect(world.experience.deaths.size).toBe(1);
});

it("supports multiple level-ups from one monster using the configured XP curve", () => {
  const { world, kill } = fixture();
  const curve = createXpCurve(Array<number>(98).fill(10));
  world.experience = createMonsterExperience(
    5,
    { ...MONSTER_XP, melee: 37 },
    curve,
  );
  kill();
  expect(world.experience.character).toEqual({
    level: 5,
    totalXp: 42,
    nextLevelXp: 50,
  });
});

it("caps monster rewards at 99 without overflow", () => {
  const { world, kill } = fixture();
  const max = DEFAULT_XP_CURVE[98]!;
  world.experience = createMonsterExperience(max - 1, {
    ...MONSTER_XP,
    melee: Number.MAX_SAFE_INTEGER,
  });
  kill();
  expect(world.experience.character).toEqual({
    level: 99,
    totalXp: max,
    nextLevelXp: null,
  });
  const second = world.actors[2]!;
  applyCombatHit(world, world.actors[0]!, second, ARENA_NAV, {
    damage: 100000,
    element: "physical",
    guaranteed: true,
  });
  expect(world.experience.character.totalXp).toBe(max);
});

it("rejects environmental, non-player, training, living and unknown targets", () => {
  for (const scenario of [
    "environment",
    "monster",
    "training",
    "living",
    "missing",
    "player",
  ] as const) {
    const { world, monster } = fixture();
    monster.hp = scenario === "living" ? 1 : 0;
    if (scenario === "training") delete monster.monsterRole;
    if (scenario === "player") monster.kind = "player";
    const event: CombatEvent = {
      kind: "death",
      tick: 0,
      actor: scenario === "environment" ? -1 : scenario === "monster" ? 2 : 0,
      target: scenario === "missing" ? 999 : monster.id,
    };
    consumeMonsterDeathXp(world, event);
    expect(world.experience.character.totalXp).toBe(0);
    if (scenario === "environment" || scenario === "monster") {
      consumeMonsterDeathXp(world, { ...event, actor: 0 });
      expect(world.experience.character.totalXp).toBe(0);
    }
  }
  expect(() =>
    createMonsterExperience(0, { ...MONSTER_XP, melee: NaN }),
  ).toThrow(RangeError);
});

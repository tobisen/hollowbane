import { describe, expect, it } from "vitest";
import { ARENA_NAV, applyCombatHit, createCombat, stepCombat } from "./combat";
import { createMonster } from "./monsters";
import { fromGround, onGround } from "../world/navigation";
import {
  bossDangerContains,
  bossHooks,
  createBoss,
  selectBossAttack,
  validateBoss,
  type BossDefinition,
} from "./boss";
import { createRng } from "./core";
const home = fromGround({ x: 790, y: 560 });
const arena = { center: home, home, radius: 6 };
export const definition: BossDefinition = {
  id: "fixture",
  name: "Boss fixture",
  health: 300,
  defense: {
    defense: 0,
    armor: 0,
    physicalResistance: 0.2,
    resistances: { fire: 0.5 },
  },
  attacks: [
    {
      id: "sweep",
      name: "Sweep",
      timing: { windup: 30, active: 2, recovery: 36 },
      shape: { kind: "cone", radius: 2, halfAngle: Math.PI / 3 },
      damage: 20,
      element: "physical",
      weight: 1,
    },
    {
      id: "pulse",
      name: "Pulse",
      timing: { windup: 48, active: 2, recovery: 48 },
      shape: { kind: "circle", radius: 2.5 },
      damage: 30,
      element: "physical",
      weight: 1,
    },
    {
      id: "fault",
      name: "Fault",
      timing: { windup: 42, active: 2, recovery: 42 },
      shape: { kind: "line", length: 4, width: 0.8 },
      damage: 24,
      element: "physical",
      weight: 1,
    },
  ],
  phases: [
    {
      name: "Bound",
      healthAtMost: 1,
      attacks: ["sweep", "pulse", "fault"],
      transitionFrames: 30,
    },
    {
      name: "Unbound",
      healthAtMost: 0.5,
      attacks: ["pulse", "fault"],
      transitionFrames: 60,
    },
  ],
};
function fixture(seed = 42) {
  const world = createCombat(seed);
  const nav = structuredClone(ARENA_NAV);
  const player = world.actors[0]!;
  player.controller.walker.position = { x: home.x + 0.8, y: home.y };
  const actor = createMonster(100, "tank", home).actor;
  world.actors = [player, actor];
  const state = createBoss(actor, definition, arena, nav);
  const tick = () =>
    stepCombat(
      world,
      nav,
      { x: 0, y: 0 },
      1,
      bossHooks(world, definition, state, arena, nav),
    );
  const until = (predicate: () => boolean) => {
    for (let i = 0; i < 600 && !predicate(); i++) tick();
    expect(predicate()).toBe(true);
  };
  return { world, actor, player, state, tick, until, nav };
}
describe("boss combat adapter", () => {
  it("uses weighted seeded choices, phase pools and avoids immediate repeats", () => {
    const run = () => {
      const f = fixture();
      const random = createRng(42);
      return Array.from({ length: 50 }, () => {
        const a = selectBossAttack(definition, f.state, random);
        expect(a.id).not.toBe(f.state.previous);
        f.state.previous = a.id;
        return a.id;
      });
    };
    expect(run()).toEqual(run());
    expect(new Set(run()).size).toBe(3);
    const f = fixture();
    f.state.phase = 1;
    for (let i = 0; i < 20; i++)
      expect(selectBossAttack(definition, f.state, createRng(i)).id).not.toBe(
        "sweep",
      );
  });
  it("locks a visible warning before the exact strike tick and applies damage once", () => {
    const f = fixture();
    f.until(() => !!f.state.telegraph);
    const t = structuredClone(f.state.telegraph!);
    const hp = f.player.hp;
    while (f.world.tick < t.strikeAt - 1) {
      f.tick();
      expect(f.player.hp).toBe(hp);
    }
    f.tick();
    expect(f.player.hp).toBeLessThan(hp);
    expect(f.state.events.find((e) => e.kind === "strike")!.tick).toBe(
      t.strikeAt,
    );
    const after = f.player.hp;
    for (let i = 0; i < 20; i++) f.tick();
    expect(f.player.hp).toBe(after);
  });
  it("allows dodging the frozen danger area", () => {
    const f = fixture();
    f.until(() => !!f.state.telegraph);
    const t = f.state.telegraph!;
    f.player.controller.walker.position = { x: home.x - 3, y: home.y };
    expect(bossDangerContains(t, f.player.controller.walker.position)).toBe(
      false,
    );
    const hp = f.player.hp;
    while (f.world.tick <= t.strikeAt) f.tick();
    expect(f.player.hp).toBe(hp);
  });
  it("blocks damage across terrain introduced between warning and strike", () => {
    const f = fixture();
    f.until(() => !!f.state.telegraph);
    const t = f.state.telegraph!;
    const hp = f.player.hp;
    const p = onGround({ x: home.x + 0.4, y: home.y });
    f.nav.obstacles.push({ x: p.x, y: p.y, rx: 8, ry: 18 });
    while (f.world.tick <= t.strikeAt) f.tick();
    expect(f.player.hp).toBe(hp);
    expect(f.state.events.some((e) => e.kind === "strike")).toBe(true);
  });
  it("supports encounter-state phase triggers independently of health", () => {
    const f = fixture();
    const d = structuredClone(definition);
    d.phases[1]!.attacksAtLeast = 1;
    f.state.attacks = 1;
    stepCombat(
      f.world,
      f.nav,
      { x: 0, y: 0 },
      1,
      bossHooks(f.world, d, f.state, arena, f.nav),
    );
    expect(f.state.phase).toBe(1);
    expect(f.actor.hp).toBe(300);
  });
  it("transitions once after commitment, honors transition safety and never regresses", () => {
    const f = fixture();
    f.until(() => !!f.state.telegraph);
    f.actor.hp = 140;
    f.tick();
    expect(f.state.phase).toBe(0);
    f.until(() => f.state.phase === 1);
    expect(f.state.telegraph).toBeNull();
    for (let i = 0; i < 59; i++) {
      f.tick();
      expect(f.state.telegraph).toBeNull();
    }
    f.actor.hp = 300;
    f.tick();
    expect(f.state.phase).toBe(1);
    expect(f.state.events.filter((e) => e.kind === "phase")).toHaveLength(1);
  });
  it("uses normal resistance and stagger rules; interrupted windups cannot strike", () => {
    const f = fixture();
    f.until(() => !!f.state.telegraph);
    const t = f.state.telegraph!,
      hp = f.player.hp;
    applyCombatHit(f.world, f.player, f.actor, ARENA_NAV, {
      damage: 60,
      element: "fire",
      guaranteed: true,
      stagger: true,
    });
    expect(f.actor.hp).toBe(270);
    f.tick();
    expect(f.state.telegraph).toBeNull();
    expect(f.state.events.filter((e) => e.kind === "interrupt")).toHaveLength(
      1,
    );
    while (f.world.tick <= t.strikeAt) f.tick();
    expect(f.player.hp).toBe(hp);
  });
  it("emits one death/completion and normal XP, surviving bounded event history", () => {
    const f = fixture();
    applyCombatHit(f.world, f.player, f.actor, ARENA_NAV, {
      damage: 9999,
      element: "physical",
      guaranteed: true,
    });
    for (let i = 0; i < 350; i++) f.tick();
    expect(f.state.complete).toBe(true);
    expect(f.state.events.filter((e) => e.kind === "complete")).toHaveLength(1);
    expect(f.state.events.filter((e) => e.kind === "death")).toHaveLength(1);
    expect(f.world.experience.deaths.has(100)).toBe(true);
  });
  it("resets on free arena exit/player death without granting completion", () => {
    const f = fixture();
    f.until(() => !!f.state.telegraph);
    f.actor.hp = 10;
    f.player.controller.walker.position = { x: home.x + 7, y: home.y };
    f.tick();
    expect(f.actor.hp).toBe(300);
    expect(f.state.engaged).toBe(false);
    expect(f.state.telegraph).toBeNull();
    expect(f.state.complete).toBe(false);
    f.player.controller.walker.position = { x: home.x + 1, y: home.y };
    f.tick();
    f.player.hp = 0;
    f.tick();
    expect(f.state.engaged).toBe(false);
  });
  it("replays 50 seeds identically through the real combat timeline", () => {
    const run = (seed: number) => {
      const f = fixture(seed);
      for (let i = 0; i < 240; i++) f.tick();
      return { state: f.state, world: f.world };
    };
    for (let seed = 0; seed < 50; seed++) expect(run(seed)).toEqual(run(seed));
  });
  it("rejects unsafe timing/phase data and matches circle/cone/line boundaries", () => {
    const d = structuredClone(definition);
    d.attacks[0]!.timing.windup = 1;
    expect(() => validateBoss(d)).toThrow();
    const t = {
      attack: "x",
      origin: { x: 0, y: 0 },
      direction: { x: 1, y: 0 },
      started: 0,
      strikeAt: 30,
      shape: { kind: "line" as const, length: 3, width: 1 },
    };
    expect(bossDangerContains(t, { x: 3, y: 0.5 })).toBe(true);
    expect(bossDangerContains(t, { x: -0.1, y: 0 })).toBe(false);
    expect(bossDangerContains(t, { x: 1, y: 0.51 })).toBe(false);
  });
});

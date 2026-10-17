import { describe, expect, it } from "vitest";
import { ARENA_NAV, createCombat } from "./combat";
import { resolveDamage } from "./damage";
import {
  activeSkill,
  createSkills,
  requestSkill,
  stepSkillCombat,
} from "./skills";
import { applyStatus, skillTargets } from "./skill-effects";
import { fromGround } from "../world/navigation";
const setup = () => {
  const w = createCombat();
  w.hostilesActive = false;
  w.actors = w.actors.slice(0, 3);
  for (const a of w.actors) {
    a.kind = a.id === 0 ? "player" : "dummy";
    a.hp = a.maxHp = 1000;
    a.offense.criticalChance = 0;
    a.defense = { defense: 0, armor: 0, physicalResistance: 0 };
    a.controller.walker.position = fromGround({ x: 650 + a.id * 32, y: 560 });
  }
  return createSkills(w);
};
const ticks = (r: ReturnType<typeof setup>, n: number) => {
  for (let i = 0; i < n; i++) stepSkillCombat(r);
};
const command = (r: ReturnType<typeof setup>, skill: string) =>
  requestSkill(r, { actor: 0, skill, target: 1, direction: { x: 1, y: 0 } });
describe("deterministic skill effects", () => {
  it("elemental damage bypasses physical armor but respects caps and vulnerability", () => {
    const o = {
        damage: 40,
        accuracy: 100,
        criticalChance: 0,
        criticalMultiplier: 1,
      },
      d = {
        defense: 0,
        armor: 100,
        physicalResistance: 0,
        resistances: { fire: 0.5, cold: -0.5, lightning: 9 },
      };
    expect(resolveDamage(o, d, () => 0, undefined, "physical").amount).toBe(20);
    expect(resolveDamage(o, d, () => 0, undefined, "fire").amount).toBe(20);
    expect(resolveDamage(o, d, () => 0, undefined, "cold").amount).toBe(60);
    expect(resolveDamage(o, d, () => 0, undefined, "lightning").amount).toBe(
      10,
    );
  });
  it("launches a traveling projectile at release and applies only at collision", () => {
    const r = setup();
    r.combat.actors[1]!.controller.walker.position = {
      ...r.combat.actors[0]!.controller.walker.position,
      x: r.combat.actors[0]!.controller.walker.position.x + 2,
    };
    command(r, "ember-lance");
    ticks(r, 10);
    expect(r.effects.bolts).toHaveLength(1);
    expect(r.combat.actors[1]!.hp).toBe(1000);
    ticks(r, 30);
    expect(
      r.combat.events.some(
        (e) => e.kind === "damage" && e.result.type === "fire",
      ),
    ).toBe(true);
  });
  it("nova damages several targets, slows their movement and restores base speed on expiry", () => {
    const r = setup();
    command(r, "rime-ring");
    ticks(r, 13);
    expect(r.combat.actors.slice(1).every((a) => a.hp < 1000)).toBe(true);
    expect(r.effects.statuses).toHaveLength(2);
    expect(r.combat.actors[1]!.movement?.walkSpeed).toBeCloseTo(1.8);
    ticks(r, 180);
    expect(r.effects.statuses).toHaveLength(0);
    expect(r.combat.actors[1]!.movement?.walkSpeed).toBe(3);
  });
  it("chain hits unique nearest targets in stable ID order", () => {
    const r = setup();
    command(r, "storm-thread");
    ticks(r, 12);
    expect(
      r.combat.events.filter((e) => e.kind === "damage").map((e) => e.target),
    ).toEqual([1, 2]);
  });
  it("melee applies six poison intervals and refresh never accelerates the next tick", () => {
    const r = setup();
    command(r, "briar-edge");
    ticks(r, 10);
    expect(r.effects.statuses[0]?.kind).toBe("poison");
    const s = activeSkill(r, "briar-edge")!,
      a = r.combat.actors[0]!,
      b = r.combat.actors[1]!;
    const next = r.effects.statuses[0]!.next;
    applyStatus(r, s, a, b);
    expect(r.effects.statuses[0]!.next).toBe(next);
    ticks(r, 180);
    expect(
      r.combat.events.filter(
        (e) => e.kind === "damage" && e.result.type === "poison",
      ),
    ).toHaveLength(6);
  });
  it("strongest slow rejects weaker refresh; power buff expires without stat drift", () => {
    const r = setup(),
      s = activeSkill(r, "rime-ring")!,
      a = r.combat.actors[0]!,
      b = r.combat.actors[1]!;
    applyStatus(r, s, a, b);
    const expiry = r.effects.statuses[0]!.expires;
    applyStatus(
      r,
      { ...s, status: { ...s.status!, magnitude: 0.1, duration: 999 } },
      a,
      b,
    );
    expect(r.effects.statuses[0]!.expires).toBe(expiry);
    command(r, "oath-echo");
    ticks(r, 11);
    expect(a.powerMultiplier).toBe(1.3);
    expect(b.powerMultiplier).toBe(1);
    ticks(r, 240);
    expect(a.powerMultiplier).toBe(1);
  });
  it("cone and line geometry exclude behind/side targets and respect LOS", () => {
    const r = setup(),
      a = r.combat.actors[0]!,
      s = activeSkill(r, "iron-fan")!,
      c = {
        skill: s.id,
        target: 1,
        direction: { x: 1, y: 0 },
        sequence: 1,
        resolved: false,
      };
    a.controller.walker.position = { x: 0, y: 0 };
    r.combat.actors[1]!.controller.walker.position = { x: 1, y: 0 };
    r.combat.actors[2]!.controller.walker.position = { x: 0, y: 1 };
    expect(skillTargets(r, s, a, c, ARENA_NAV).map((a) => a.id)).toEqual([1]);
    expect(
      skillTargets(
        r,
        { ...s, shape: "line", radius: 0.2 },
        a,
        c,
        ARENA_NAV,
      ).map((a) => a.id),
    ).toEqual([1]);
    const wall = {
      ...ARENA_NAV,
      obstacles: [{ x: 800, y: 528, rx: 12, ry: 32 }],
    };
    expect(skillTargets(r, s, a, c, wall)).toHaveLength(0);
  });
  it("invalid or moved targets at active frame consume commitment but do no damage", () => {
    const r = setup();
    command(r, "briar-edge");
    ticks(r, 1);
    r.combat.actors[1]!.hp = 0;
    ticks(r, 9);
    expect(r.events.at(-1)?.reason).toBe("invalid-target");
    expect(r.combat.events.some((e) => e.kind === "damage")).toBe(false);
    expect(r.combat.actors[0]!.controller.timeline.phase).toBe("active");
  });
  it("death interrupts casts and invulnerability blocks elemental damage/status", () => {
    const r = setup();
    command(r, "ember-lance");
    ticks(r, 1);
    r.combat.actors[0]!.hp = 0;
    ticks(r, 15);
    expect(r.events.some((e) => e.kind === "interrupt")).toBe(true);
    expect(r.effects.bolts).toHaveLength(0);
    const q = setup();
    q.combat.actors[1]!.invulnerableUntil = 100;
    command(q, "rime-ring");
    ticks(q, 12);
    expect(q.combat.actors[1]!.hp).toBe(1000);
    expect(q.effects.statuses.some((s) => s.actor === 1)).toBe(false);
  });
});

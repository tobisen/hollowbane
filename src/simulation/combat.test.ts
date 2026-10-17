import { describe, expect, it } from "vitest";
import { applyCombatHit, ARENA_NAV, createCombat, stepCombat } from "./combat";
import { commandCombat } from "./combat-targeting";
function duel() {
  const w = createCombat();
  w.actors = w.actors.slice(0, 2);
  w.actors[1]!.controller.walker.position = {
    ...w.actors[0]!.controller.walker.position,
    x: w.actors[0]!.controller.walker.position.x + 0.8,
  };
  w.actors[0]!.controller = commandCombat(w.actors[0]!.controller, {
    kind: "attack",
    target: 1,
    repeat: true,
  });
  return w;
}
describe("combat resolution and reactions", () => {
  it("applies damage only at strike frames and replays complete serializable worlds", () => {
    const a = duel(),
      b = structuredClone(a);
    const hp = a.actors[1]!.hp;
    for (let i = 0; i < 11; i++) {
      stepCombat(a);
      expect(a.actors[1]!.hp).toBe(hp);
    }
    stepCombat(a);
    expect(a.actors[1]!.hp).toBeLessThan(hp);
    for (let i = 12; i < 100; i++) stepCombat(a);
    for (let i = 0; i < 100; i++) stepCombat(b);
    expect(a).toEqual(b);
  });
  it("rechecks range at impact when targets move away", () => {
    const w = duel();
    stepCombat(w);
    w.actors[1]!.controller.walker.position.x += 3;
    for (let i = 0; i < 11; i++) stepCombat(w);
    expect(w.actors[1]!.hp).toBe(160);
    expect(w.events.some((e) => e.kind === "whiff")).toBe(true);
  });
  it("death terminates attacks and stops dead-target pursuit", () => {
    const w = duel();
    w.actors[1]!.hp = 1;
    for (let i = 0; i < 50; i++) stepCombat(w);
    expect(w.actors[1]!.controller.timeline.phase).toBe("dead");
    expect(w.actors[0]!.controller.selected).toBeNull();
    expect(w.events.filter((e) => e.kind === "death")).toHaveLength(1);
  });
  it("interrupts windup, guards reactions without granting damage immunity, supports invulnerability", () => {
    const w = duel(),
      a = w.actors[0]!,
      b = w.actors[1]!;
    b.controller = commandCombat(b.controller, {
      kind: "attack",
      target: 0,
      repeat: true,
    });
    stepCombat(w);
    applyCombatHit(w, a, b, ARENA_NAV);
    expect(b.controller.timeline.phase).toBe("hitstun");
    const hp = b.hp,
      guard = b.reactionGuardUntil;
    applyCombatHit(w, a, b, ARENA_NAV);
    expect(b.hp).toBeLessThan(hp);
    expect(b.reactionGuardUntil).toBe(guard);
    b.invulnerableUntil = 100;
    const protectedHp = b.hp;
    applyCombatHit(w, a, b, ARENA_NAV);
    expect(b.hp).toBe(protectedHp);
  });
  it("applies swept knockback and attack/recovery breakpoints", () => {
    const w = duel(),
      a = w.actors[0]!,
      b = w.actors[1]!;
    a.knockback = 0.2;
    a.attackSpeed = 50;
    const x = b.controller.walker.position.x;
    for (let i = 0; i < 8; i++) stepCombat(w);
    expect(b.controller.walker.position.x).toBeGreaterThan(x);
    expect(a.controller.timeline.timing.windup).toBe(8);
  });
});

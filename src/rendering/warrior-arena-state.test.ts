import { describe, expect, it } from "vitest";
import {
  createWarriorArena,
  stepWarriorArena,
  warriorArenaAttack,
  warriorArenaAbility,
  warriorArenaPose,
  WARRIOR_ARENA_NAV,
} from "./warrior-arena-state";
import { commandCombat } from "../simulation/combat-targeting";
import { fromGround, canWalk, onGround } from "../world/navigation";

const advance = (a: ReturnType<typeof createWarriorArena>, n: number) => {
  for (let i = 0; i < n; i++) stepWarriorArena(a);
};
const closeTarget = () => {
  const a = createWarriorArena();
  a.world.hostilesActive = false;
  a.world.actors = a.world.actors.slice(0, 2);
  const p = a.world.actors[0]!.controller.walker.position;
  a.world.actors[1]!.controller.walker.position = { x: p.x + 0.8, y: p.y };
  return a;
};
const incomingStrike = (
  a: ReturnType<typeof createWarriorArena>,
  lethal = false,
) => {
  const enemy = a.world.actors[1]!;
  enemy.kind = "hostile";
  enemy.offense = {
    ...enemy.offense,
    accuracy: 1e9,
    damage: lethal ? 10000 : 30,
    criticalChance: 0,
  };
  enemy.stagger = 1;
  enemy.controller = commandCombat(enemy.controller, {
    kind: "attack",
    target: 0,
    repeat: false,
  });
  // Put a real enemy one tick before active; stepCombat remains the only strike resolver.
  enemy.controller.timeline = {
    ...enemy.controller.timeline,
    phase: "windup",
    remaining: 1,
  };
  enemy.controller.locked = 0;
};

describe("disposable playable Warrior", () => {
  for (const variant of ["primary", "secondary"] as const)
    it(`${variant}: approaches a real target, strikes once at the impact frame and recovers`, () => {
      const a = createWarriorArena();
      a.world.hostilesActive = false;
      a.world.actors = a.world.actors.slice(0, 2);
      warriorArenaAttack(a, variant);
      const start = a.world.actors[0]!.controller.walker.distance;
      let impacts = 0;
      for (let i = 0; i < 150; i++) {
        stepWarriorArena(a);
        if (
          a.world.events.some(
            (e) =>
              e.tick === a.world.tick &&
              e.kind === "phase" &&
              e.actor === 0 &&
              e.phase === "active",
          )
        ) {
          impacts++;
          expect(warriorArenaPose(a)).toEqual({
            set: "attacks",
            clip: variant,
            frame: variant === "primary" ? 5 : 17,
          });
        }
      }
      expect(a.world.actors[0]!.controller.walker.distance).toBeGreaterThan(
        start,
      );
      expect(a.world.actors[1]!.hp).toBeLessThan(160);
      expect(impacts).toBe(1);
      expect(a.world.actors[0]!.controller.timeline.phase).toBe("idle");
    });

  for (const skill of ["iron-fan", "oath-echo"] as const)
    it(`${skill}: presentation reads one real activation without extra damage or effects`, () => {
      const a = closeTarget();
      warriorArenaAbility(a, skill);
      let saw = false;
      for (let i = 0; i < 60; i++) {
        stepWarriorArena(a);
        if (warriorArenaPose(a).set === "abilities") saw = true;
        const before = JSON.stringify(a.skills);
        for (let draw = 0; draw < 10; draw++) warriorArenaPose(a);
        expect(JSON.stringify(a.skills)).toBe(before);
      }
      expect(saw).toBe(true);
      expect(a.skills.events.filter((e) => e.kind === "effect")).toHaveLength(
        1,
      );
      expect(a.skills.users[0]!.mana).toBeLessThan(a.skills.users[0]!.maxMana);
    });

  for (const action of ["attack", "ability"] as const)
    for (const lethal of [false, true])
      it(`real enemy ${lethal ? "death" : "hit"} interrupts ${action}, with no fabricated release`, () => {
        const a = closeTarget();
        if (action === "attack") warriorArenaAttack(a, "primary");
        else warriorArenaAbility(a, "oath-echo");
        incomingStrike(a, lethal);
        stepWarriorArena(a);
        expect(a.world.actors[0]!.hp).toBeLessThan(300);
        expect(warriorArenaPose(a).set).toBe(lethal ? "death" : "hit");
        advance(a, 45);
        expect(a.skills.events.filter((e) => e.kind === "effect")).toHaveLength(
          0,
        );
        expect(
          a.world.events.filter(
            (e) => e.actor === 0 && e.kind === "phase" && e.phase === "active",
          ),
        ).toHaveLength(0);
        if (lethal) {
          const position = { ...a.world.actors[0]!.controller.walker.position };
          for (let i = 0; i < 60; i++) {
            warriorArenaAttack(a, "secondary");
            warriorArenaAbility(a, "iron-fan");
            stepWarriorArena(a, { x: 1, y: 1 });
            expect(warriorArenaPose(a)).toEqual({
              set: "death",
              clip: "death",
              frame: 15,
            });
          }
          expect(a.world.actors[0]!.controller.walker.position).toEqual(
            position,
          );
          expect(createWarriorArena().world.actors[0]!.hp).toBe(300);
        } else expect(warriorArenaPose(a).set).toBe("movement");
      });

  it("moving hit yields to recovery; rapidly switching direction preserves displacement phase", () => {
    const a = closeTarget();
    stepWarriorArena(a, { x: 1, y: 0 });
    expect(warriorArenaPose(a).clip).toBe("walk");
    incomingStrike(a);
    stepWarriorArena(a, { x: -1, y: 0 });
    expect(warriorArenaPose(a).set).toBe("hit");
    advance(a, 20);
    for (const vector of [
      { x: 1, y: 0 },
      { x: 0, y: -1 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
    ]) {
      stepWarriorArena(a, vector);
      expect(warriorArenaPose(a).clip).toBe("walk");
      expect(a.phase).toBeGreaterThanOrEqual(0);
      expect(a.phase).toBeLessThan(1);
    }
  });

  it("wall sliding keeps navigation valid and animation follows actual travel", () => {
    const a = createWarriorArena();
    a.world.hostilesActive = false;
    a.world.actors = a.world.actors.slice(0, 1);
    const walker = a.world.actors[0]!.controller.walker;
    walker.position = fromGround({ x: 958, y: 690 });
    for (let i = 0; i < 30; i++) stepWarriorArena(a, { x: 1, y: 1 });
    const next = a.world.actors[0]!.controller.walker;
    expect(canWalk(WARRIOR_ARENA_NAV, next.position)).toBe(true);
    expect(onGround(next.position).y).toBeGreaterThan(690);
    expect(next.distance).toBeGreaterThan(0);
  });

  it("repeated inputs cannot change a committed variant or create duplicate strikes", () => {
    const a = closeTarget();
    warriorArenaAttack(a, "secondary");
    for (let i = 0; i < 30; i++) {
      stepWarriorArena(a);
      warriorArenaAttack(a, "primary");
      warriorArenaAbility(a, "iron-fan");
    }
    expect(a.attack).toBe("secondary");
    expect(
      a.world.events.filter(
        (e) => e.kind === "phase" && e.actor === 0 && e.phase === "active",
      ),
    ).toHaveLength(1);
    expect(a.skills.events.filter((e) => e.kind === "effect")).toHaveLength(0);
  });

  it("different render frequencies leave identical combat outcomes", () => {
    const a = closeTarget(),
      b = closeTarget();
    warriorArenaAttack(a, "secondary");
    warriorArenaAttack(b, "secondary");
    for (let i = 0; i < 80; i++) {
      stepWarriorArena(a);
      stepWarriorArena(b);
      for (let draw = 0; draw < 5; draw++) warriorArenaPose(b);
    }
    expect(a).toEqual(b);
  });
});

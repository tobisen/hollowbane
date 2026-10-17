import { describe, expect, it } from "vitest";
import { launchProjectile, projectileContact } from "./projectiles";
import { createCombat, stepCombat } from "./combat";
import { commandCombat } from "./combat-targeting";
function shot() {
  const w = createCombat();
  w.actors = w.actors.slice(0, 2);
  const a = w.actors[0]!,
    b = w.actors[1]!;
  a.weapon = "projectile";
  a.range = 6;
  b.controller.walker.position = {
    x: a.controller.walker.position.x + 3,
    y: a.controller.walker.position.y,
  };
  a.controller = commandCombat(a.controller, {
    kind: "attack",
    target: 1,
    repeat: false,
  });
  return w;
}
describe("projectile foundation", () => {
  it("launches at strike and delays damage until swept contact", () => {
    const w = shot();
    for (let i = 0; i < 12; i++) stepCombat(w);
    expect(w.projectiles).toHaveLength(1);
    expect(w.actors[1]!.hp).toBe(160);
    for (let i = 0; i < 20; i++) stepCombat(w);
    expect(w.actors[1]!.hp).toBeLessThan(160);
    expect(w.projectiles).toHaveLength(0);
    expect(w.events.filter((e) => e.kind === "impact")).toHaveLength(1);
  });
  it("can miss a moving target and expires without homing", () => {
    const w = shot();
    for (let i = 0; i < 12; i++) stepCombat(w);
    w.actors[1]!.controller.walker.position.y += 1;
    for (let i = 0; i < 190; i++) stepCombat(w);
    expect(w.actors[1]!.hp).toBe(160);
    expect(w.projectiles).toHaveLength(0);
  });
  it("finds earliest intersection without tunneling and handles degenerate segments", () => {
    expect(
      projectileContact({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 0 }),
    ).toBeCloseTo(0.475);
    expect(
      projectileContact({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }),
    ).toBe(0);
    expect(
      projectileContact({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 5, y: 0 }),
    ).toBeNull();
    expect(() =>
      launchProjectile(0, 0, { x: 0, y: 0 }, { x: 0, y: 0 }),
    ).toThrow();
  });
  it("stops at boundaries and does not damage dead targets", () => {
    const w = shot();
    for (let i = 0; i < 12; i++) stepCombat(w);
    w.actors[1]!.hp = 0;
    for (let i = 0; i < 190; i++) stepCombat(w);
    expect(w.events.filter((e) => e.kind === "damage")).toHaveLength(0);
    expect(w.projectiles).toHaveLength(0);
  });
  it("lets the first opposing body intercept a shot at another target", () => {
    const w = shot(),
      extra = createCombat().actors[4]!;
    extra.controller.walker.position = {
      x: w.actors[0]!.controller.walker.position.x + 1.5,
      y: w.actors[0]!.controller.walker.position.y,
    };
    w.actors.push(extra);
    for (let i = 0; i < 40; i++) stepCombat(w);
    expect(extra.hp).toBeLessThan(extra.maxHp);
    expect(w.actors[1]!.hp).toBe(160);
    expect(w.events.find((e) => e.kind === "impact")).toMatchObject({
      target: 4,
    });
  });
});

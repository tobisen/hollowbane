import { describe, expect, it } from "vitest";
import { createCombat } from "./combat";
import { commandCombat } from "./combat-targeting";
import { createSkills, requestSkill, stepSkillCombat } from "./skills";
const setup = () => {
  const w = createCombat();
  w.hostilesActive = false;
  return createSkills(w);
};
const cast = (r: ReturnType<typeof setup>, skill = "ember-lance") =>
  requestSkill(r, { actor: 0, skill, target: 1, direction: { x: 1, y: 0 } });
describe("shared skill execution", () => {
  it("charges once, respects frame windup and recovery and never instant-damages", () => {
    const r = setup();
    cast(r);
    cast(r);
    stepSkillCombat(r);
    expect(r.users[0]!.mana).toBeCloseTo(92);
    expect(r.events.map((e) => e.kind)).toEqual(["start"]);
    for (let i = 0; i < 8; i++) stepSkillCombat(r);
    expect(r.events.some((e) => e.kind === "effect")).toBe(false);
    stepSkillCombat(r);
    expect(r.events.filter((e) => e.kind === "effect")).toHaveLength(1);
    cast(r);
    stepSkillCombat(r);
    expect(r.events.at(-1)?.reason).toBe("committed");
    const a = r.combat.actors[0]!;
    a.controller = commandCombat(a.controller, {
      kind: "move",
      target: { x: 20, y: 20 },
    });
    stepSkillCombat(r);
    expect(a.controller.timeline.phase).toBe("recovery");
  });
  it("rejects resources, cooldown and invalid targets without spending", () => {
    const r = setup();
    r.users[0]!.mana = 0;
    cast(r);
    stepSkillCombat(r);
    expect(r.events.at(-1)?.reason).toBe("mana");
    r.users[0]!.mana = 100;
    r.users[0]!.cooldowns["ember-lance"] = 999;
    cast(r);
    stepSkillCombat(r);
    expect(r.events.at(-1)?.reason).toBe("cooldown");
    cast(r, "briar-edge");
    stepSkillCombat(r);
    expect(r.events.at(-1)?.reason).toBe("out-of-range");
  });
  it("interrupts through the existing hitstun/death rules without refund or release", () => {
    const r = setup();
    cast(r);
    stepSkillCombat(r);
    r.combat.actors[0]!.controller.timeline.phase = "hitstun";
    stepSkillCombat(r);
    expect(r.events.at(-1)?.kind).toBe("interrupt");
    expect(r.users[0]!.cast).toBeNull();
    expect(r.users[0]!.mana).toBeLessThan(93);
    expect(r.events.some((e) => e.kind === "effect")).toBe(false);
  });
  it("uses discrete cast breakpoints and deterministic replay", () => {
    const a = setup(),
      b = setup();
    a.users[0]!.castSpeed = b.users[0]!.castSpeed = 60;
    cast(a);
    cast(b);
    for (let i = 0; i < 7; i++) {
      stepSkillCombat(a);
      stepSkillCombat(b);
    }
    expect(a.events.some((e) => e.kind === "effect")).toBe(true);
    expect(a).toEqual(b);
  });
  it("physical abilities use attack speed while elemental casts use separate breakpoints", () => {
    const r = setup();
    r.combat.actors[1]!.controller.walker.position = {
      ...r.combat.actors[0]!.controller.walker.position,
      x: r.combat.actors[0]!.controller.walker.position.x + 0.5,
    };
    r.combat.actors[0]!.attackSpeed = 90;
    cast(r, "briar-edge");
    stepSkillCombat(r);
    expect(r.combat.actors[0]!.controller.timeline.timing.windup).toBe(5);
  });
  it.each([
    [24, 10],
    [25, 9],
    [59, 9],
    [60, 7],
    [99, 7],
    [100, 6],
  ])("cast speed %i has authored windup %i", (speed, frames) => {
    const r = setup();
    r.users[0]!.castSpeed = speed;
    cast(r);
    stepSkillCombat(r);
    expect(r.combat.actors[0]!.controller.timeline.timing.windup).toBe(frames);
  });
});

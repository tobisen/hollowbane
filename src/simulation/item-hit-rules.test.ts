import { expect, it } from "vitest";
import { createCombat, applyCombatHit, ARENA_NAV } from "./combat";
import {
  createSkills,
  requestSkill,
  stepSkillCombat,
  activeSkill,
} from "./skills";
import { applyStatus } from "./skill-effects";
import { createCharacterInventory } from "./equipment";
import {
  captureEquipmentBase,
  deriveEquipment,
  applyEquipment,
} from "./equipment-stats";
import { ADVANCED_CONTENT, AFFIX_ITEM_CONTENT } from "./item-registry";
import { generateLoot, type GeneratedItem } from "./loot";
import { identifyItem } from "./item-save";
import { fromGround } from "../world/navigation";
function unique(sequence: number) {
  return identifyItem(
    generateLoot(
      { seed: 42, sequence, areaLevel: 12, monsterLevel: 12, table: "sanctum" },
      ADVANCED_CONTENT,
    )!,
  );
}
function setup() {
  const w = createCombat();
  w.hostilesActive = false;
  const a = w.actors[0]!,
    t = w.actors[1]!;
  a.offense.criticalChance = 0;
  t.hp = t.maxHp = 1000;
  t.defense = { defense: 0, armor: 0, physicalResistance: 0 };
  t.controller.walker.position = fromGround({ x: 682, y: 560 });
  return createSkills(w);
}
function damage(r: ReturnType<typeof setup>) {
  const e = r.combat.events.filter((e) => e.kind === "damage").at(-1);
  if (e?.kind !== "damage") throw Error("Missing hit");
  return e.result.amount;
}
it("evaluates actual low-health armor at each hit boundary without stale displayed totals", () => {
  const r = setup(),
    a = r.combat.actors[0]!,
    c = createCharacterInventory();
  c.equipment.helmet = unique(1739);
  applyEquipment(deriveEquipment(c, captureEquipmentBase(a)), a);
  applyCombatHit(r.combat, r.combat.actors[1]!, a, ARENA_NAV, {
    damage: 100,
    element: "physical",
    guaranteed: true,
  });
  const healthy = damage(r);
  a.hp = 100;
  applyCombatHit(r.combat, r.combat.actors[1]!, a, ARENA_NAV, {
    damage: 100,
    element: "physical",
    guaranteed: true,
  });
  expect(damage(r)).toBeLessThan(healthy);
});
it("uses actual poison status context for conditional weapon damage without double counting", () => {
  let item: GeneratedItem | null = null;
  for (let sequence = 0; sequence < 100000 && !item; sequence++) {
    const i = generateLoot(
      { seed: 42, sequence, areaLevel: 40, monsterLevel: 40, table: "sanctum" },
      AFFIX_ITEM_CONTENT,
    );
    if (i?.base === "ash-blade" && i.advanced?.affixes?.includes("mire-hunter"))
      item = identifyItem(i);
  }
  if (!item) throw Error("Missing conditional fixture");
  const r = setup(),
    a = r.combat.actors[0]!,
    t = r.combat.actors[1]!,
    c = createCharacterInventory(40);
  c.equipment.main = item;
  applyEquipment(deriveEquipment(c, captureEquipmentBase(a)), a);
  const hit = () =>
    applyCombatHit(r.combat, a, t, ARENA_NAV, {
      damage: a.offense.damage,
      element: "physical",
      origin: "weapon",
      guaranteed: true,
    });
  hit();
  const before = damage(r);
  expect(before).toBe(Math.floor(a.offense.damage));
  applyStatus(r, activeSkill(r, "briar-edge")!, a, t);
  expect(t.effectStatuses).toContain("poison");
  hit();
  expect(damage(r)).toBeGreaterThan(before);
});
it("makes generated skill rank bonuses increase real spell damage at unchanged timing/cost", () => {
  const run = (equipped: boolean) => {
    const r = setup(),
      a = r.combat.actors[0]!,
      c = createCharacterInventory();
    r.users[0]!.passives = []; // Isolate resource cost from capped passive regeneration.
    if (equipped) c.equipment.amulet = unique(380035);
    applyEquipment(deriveEquipment(c, captureEquipmentBase(a)), a, r.users[0]);
    requestSkill(r, {
      actor: 0,
      skill: "ember-lance",
      target: 1,
      direction: { x: 1, y: -1 },
    });
    for (let i = 0; i < 90; i++) stepSkillCombat(r);
    const e = r.combat.events.find((e) => e.kind === "damage");
    if (e?.kind !== "damage") throw Error("No spell hit");
    return { amount: e.result.amount, tick: e.tick, mana: r.users[0]!.mana };
  };
  const normal = run(false),
    boosted = run(true);
  expect(boosted.amount).toBeGreaterThan(normal.amount);
  expect(boosted.tick).toBe(normal.tick);
  expect(boosted.mana).toBe(normal.mana);
});
it("increases actual poison ticks through skill ranks and DoT potency without changing duration/interval", () => {
  const run = (equipped: boolean) => {
    const r = setup(),
      a = r.combat.actors[0]!,
      c = createCharacterInventory();
    if (equipped) c.equipment.ring1 = unique(312426);
    applyEquipment(deriveEquipment(c, captureEquipmentBase(a)), a, r.users[0]);
    requestSkill(r, {
      actor: 0,
      skill: "briar-edge",
      target: 1,
      direction: { x: 1, y: 0 },
    });
    for (let i = 0; i < 210; i++) stepSkillCombat(r);
    return r.combat.events
      .filter((e) => e.kind === "damage" && e.result.type === "poison")
      .map((e) => ({
        tick: e.tick,
        amount: e.kind === "damage" ? e.result.amount : 0,
      }));
  };
  const plain = run(false),
    boosted = run(true);
  expect(plain).toHaveLength(6);
  expect(boosted.map((e) => e.tick)).toEqual(plain.map((e) => e.tick));
  expect(boosted.every((e, i) => e.amount > plain[i]!.amount)).toBe(true);
});
it("keeps triggered elemental damage free of weapon and skill amplification", () => {
  const r = setup(),
    a = r.combat.actors[0]!,
    t = r.combat.actors[1]!,
    c = createCharacterInventory();
  c.equipment.main = unique(5634);
  c.equipment.amulet = unique(380035);
  applyEquipment(deriveEquipment(c, captureEquipmentBase(a)), a);
  applyCombatHit(r.combat, a, t, ARENA_NAV, {
    damage: 10,
    element: "fire",
    origin: "proc",
    skill: "ember-lance",
    guaranteed: true,
  });
  expect(damage(r)).toBe(10);
});
it("applies elemental affixes only to matching skill damage and preserves existing arcane hits", () => {
  let item: GeneratedItem | null = null;
  for (let sequence = 0; sequence < 100000 && !item; sequence++) {
    const i = generateLoot(
      { seed: 42, sequence, areaLevel: 40, monsterLevel: 40, table: "sanctum" },
      AFFIX_ITEM_CONTENT,
    );
    if (
      i?.base === "copper-band" &&
      i.advanced?.affixes?.includes("ember-accord")
    )
      item = identifyItem(i);
  }
  if (!item) throw Error("Missing elemental fixture");
  const r = setup(),
    a = r.combat.actors[0]!,
    t = r.combat.actors[1]!,
    c = createCharacterInventory(40);
  c.equipment.ring1 = item;
  applyEquipment(deriveEquipment(c, captureEquipmentBase(a)), a);
  for (const element of ["fire", "cold", "arcane"] as const) {
    applyCombatHit(r.combat, a, t, ARENA_NAV, {
      damage: 100,
      element,
      guaranteed: true,
      origin: "skill",
    });
    if (element === "fire") expect(damage(r)).toBeGreaterThan(100);
    else expect(damage(r)).toBe(100);
  }
});

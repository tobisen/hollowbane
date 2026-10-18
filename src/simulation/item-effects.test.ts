import { expect, it } from "vitest";
import { createCombat, applyCombatHit, ARENA_NAV } from "./combat";
import { createSkills, stepSkillCombat } from "./skills";
import { prepareItemEffects, resolveItemEffects } from "./item-effects";
import { createItemHitRules } from "./item-hit-rules";
import type { ItemModifier, ModifierEffect } from "./item-modifiers";
import { createCharacterInventory } from "./equipment";
import {
  captureEquipmentBase,
  deriveEquipment,
  applyEquipment,
} from "./equipment-stats";
import {
  SOCKET_ITEM_CONTENT,
  ADVANCED_CONTENT,
  AFFIX_ITEM_CONTENT,
} from "./item-registry";
import { generateLoot } from "./loot";
import { identifyItem } from "./item-save";
import { insertSocket } from "./item-sockets";
import { createLootWorld, consumeLootDeaths } from "./world-loot";
const unique = (sequence: number) =>
  identifyItem(
    generateLoot(
      { seed: 42, sequence, areaLevel: 12, monsterLevel: 12, table: "sanctum" },
      ADVANCED_CONTENT,
    )!,
  );
function proc(
  id: string,
  effect: ModifierEffect,
  event: "hit" | "kill" = "hit",
  cooldownTicks = 60,
): ItemModifier {
  return {
    kind: "proc",
    id,
    source: "fixture",
    condition: { kind: "always" },
    event,
    eligibility: "direct",
    chanceBasisPoints: 10000,
    cooldownTicks,
    effect,
  };
}
function stat(
  stat: "lifeLeech" | "manaLeech" | "dotBonus" | "skill.briar-edge",
  value: number,
): ItemModifier {
  return {
    kind: "stat",
    id: stat.replace(".", "-").toLowerCase(),
    source: "fixture",
    condition: { kind: "always" },
    stat,
    value,
    operation: "add",
    group: stat.replace(".", "-").toLowerCase(),
    stacking: "sum",
    priority: 0,
  };
}
function setup() {
  const w = createCombat();
  w.hostilesActive = false;
  w.actors[0]!.hp = 100;
  w.actors[0]!.offense.criticalChance = 0;
  w.actors[1]!.hp = w.actors[1]!.maxHp = 1000;
  w.actors[1]!.defense = { armor: 0, defense: 0, physicalResistance: 0 };
  const r = createSkills(w);
  r.users[0]!.mana = 20;
  r.users[0]!.passives = [];
  return r;
}
function root(
  r: ReturnType<typeof setup>,
  origin: "weapon" | "skill" | "dot" | "proc" = "weapon",
  element: "physical" | "fire" = "physical",
  damage = 20,
) {
  applyCombatHit(
    r.combat,
    r.combat.actors[0]!,
    r.combat.actors[1]!,
    ARENA_NAV,
    { damage, element, origin, guaranteed: true },
  );
}
function gemGear() {
  let host: ReturnType<typeof generateLoot> = null,
    gem: ReturnType<typeof generateLoot> = null;
  for (let sequence = 0; sequence < 10000 && (!host || !gem); sequence++) {
    const context = { seed: 42, sequence, areaLevel: 40, monsterLevel: 40 };
    const h = generateLoot(
        { ...context, table: "sanctum" },
        SOCKET_ITEM_CONTENT,
      ),
      g = generateLoot(
        { ...context, seed: 43, table: "gem-cache" },
        SOCKET_ITEM_CONTENT,
      );
    if (h?.base === "ash-blade" && h.quality === "normal" && h.socketCapacity)
      host = identifyItem(h);
    if (g?.base === "fire-gem-1") gem = g;
  }
  if (!host || !gem) throw Error("Missing gem fixture");
  const c = createCharacterInventory(40);
  c.equipment.main = host;
  c.grid.items = [{ item: gem, x: 0, y: 0 }];
  const inserted = insertSocket(c, host.id, gem.id);
  if (!inserted.ok) throw Error(inserted.reason);
  return inserted.value;
}
it("executes a real gem once with resistance, no amplification/recursion and deterministic replay", () => {
  const run = () => {
    const r = setup(),
      w = r.combat,
      a = w.actors[0]!,
      t = w.actors[1]!;
    applyEquipment(
      deriveEquipment(gemGear(), captureEquipmentBase(a)),
      a,
      r.users[0],
    );
    t.defense.resistances = { fire: 0.5 };
    a.powerMultiplier = 3;
    prepareItemEffects(w);
    root(r);
    resolveItemEffects(w, ARENA_NAV, r);
    expect(t.hp).toBe(939);
    expect(w.itemEffects!.procs).toBe(1);
    expect(w.itemEffects!.applied).toBe(1);
    expect(w.hitTrace!.pending).toHaveLength(0);
    expect(
      w.events.filter((e) => e.kind === "damage" && e.result.type === "fire"),
    ).toHaveLength(1);
    return { seed: w.seed, state: w.itemEffects, events: w.events };
  };
  expect(run()).toEqual(run());
});
it("leeches only actual physical weapon health damage, capped by resources and never overkill", () => {
  const r = setup(),
    w = r.combat,
    a = w.actors[0]!,
    c = createCharacterInventory();
  c.equipment.gloves = unique(6892);
  c.equipment.ring1 = unique(233735);
  const d = deriveEquipment(c, captureEquipmentBase(a));
  applyEquipment(d, a, r.users[0]);
  prepareItemEffects(w);
  w.actors[1]!.hp = 3;
  root(r, "weapon", "physical", 1000);
  resolveItemEffects(w, ARENA_NAV, r);
  expect(a.hp).toBeCloseTo(100 + (3 * d.advanced!.lifeLeech) / 100);
  expect(r.users[0]!.mana).toBeCloseTo(20 + (3 * d.advanced!.manaLeech) / 100);
  expect(w.itemEffects!.lifeLeeched).toBeLessThan(1);
  expect(w.itemEffects!.manaLeeched).toBeLessThan(1);
});
it("excludes skill/DoT/proc/elemental/immune/non-leechable roots and dead sources", () => {
  for (const mode of [
    "skill",
    "dot",
    "proc",
    "elemental",
    "immune",
    "non-leechable",
    "dead",
  ] as const) {
    const r = setup(),
      w = r.combat,
      a = w.actors[0]!,
      t = w.actors[1]!;
    a.itemRules = createItemHitRules(a.offense, a.defense, [
      stat("lifeLeech", 30),
      stat("manaLeech", 30),
    ]);
    prepareItemEffects(w);
    if (mode === "immune") t.invulnerableUntil = 10;
    if (mode === "non-leechable") t.leechable = false;
    root(
      r,
      mode === "skill" || mode === "dot" || mode === "proc" ? mode : "weapon",
      mode === "elemental" ? "fire" : "physical",
    );
    if (mode === "dead") a.hp = 0;
    resolveItemEffects(w, ARENA_NAV, r);
    expect(a.hp).toBe(mode === "dead" ? 0 : 100);
    expect(r.users[0]!.mana).toBe(20);
  }
});
it("executes real on-kill restoration once and rejects duplicate root replay", () => {
  const r = setup(),
    w = r.combat,
    a = w.actors[0]!,
    c = createCharacterInventory();
  c.equipment.belt = unique(26534);
  applyEquipment(deriveEquipment(c, captureEquipmentBase(a)), a, r.users[0]);
  prepareItemEffects(w);
  w.actors[1]!.hp = 2;
  root(r, "weapon", "physical", 1000);
  const duplicate = structuredClone(w.hitTrace!.pending[0]!);
  resolveItemEffects(w, ARENA_NAV, r);
  expect(a.hp).toBe(106);
  const seed = w.seed;
  w.hitTrace!.pending.push(duplicate);
  resolveItemEffects(w, ARENA_NAV, r);
  expect(a.hp).toBe(106);
  expect(w.seed).toBe(seed);
  expect(w.itemEffects!.procs).toBe(1);
});
it("preserves proc cooldown across unequip/reequip and reuses real slowing status movement", () => {
  const r = setup(),
    w = r.combat,
    a = w.actors[0]!,
    t = w.actors[1]!;
  const mods = [
    proc("slow", {
      kind: "status",
      status: "slow",
      magnitude: 0.2,
      duration: 120,
    }),
  ];
  a.itemRules = createItemHitRules(a.offense, a.defense, mods);
  prepareItemEffects(w);
  root(r);
  resolveItemEffects(w, ARENA_NAV, r);
  expect(r.effects.statuses[0]).toMatchObject({
    kind: "slow",
    triggered: true,
    expires: 120,
  });
  stepSkillCombat(r);
  expect(t.movement!.walkSpeed).toBeCloseTo(
    r.effects.bases[t.id]!.walkSpeed * 0.8,
  );
  delete a.itemRules;
  a.itemRules = createItemHitRules(a.offense, a.defense, mods);
  root(r);
  resolveItemEffects(w, ARENA_NAV, r);
  expect(w.itemEffects!.procs).toBe(1);
  w.tick = 60;
  root(r);
  resolveItemEffects(w, ARENA_NAV, r);
  expect(w.itemEffects!.procs).toBe(2);
  expect(r.effects.statuses[0]!.expires).toBe(180);
});
it("triggered poison never amplifies, leeches or triggers on-kill effects", () => {
  const r = setup(),
    w = r.combat,
    a = w.actors[0]!;
  a.itemRules = createItemHitRules(a.offense, a.defense, [
    proc("poison", {
      kind: "status",
      status: "poison",
      magnitude: 2,
      duration: 120,
    }),
    proc("harvest", { kind: "restore", resource: "life", amount: 50 }, "kill"),
    stat("lifeLeech", 30),
    stat("dotBonus", 300),
    stat("skill.briar-edge", 20),
  ]);
  prepareItemEffects(w);
  w.actors[1]!.hp = 8;
  root(r, "weapon", "physical", 1);
  resolveItemEffects(w, ARENA_NAV, r);
  for (let i = 0; i < 130; i++) stepSkillCombat(r);
  expect(w.actors[1]!.hp).toBe(0);
  expect(a.hp).toBeCloseTo(100.3);
  expect(w.itemEffects!.procs).toBe(1);
  const poison = w.events.filter(
    (e) => e.kind === "damage" && e.result.type === "poison",
  );
  expect(poison).toHaveLength(4);
  expect(
    poison.every((e) => e.kind === "damage" && e.result.amount === 2),
  ).toBe(true);
});
it("supports monster actors and proc deaths still produce exactly one loot opportunity", () => {
  const r = setup(),
    w = r.combat,
    source = w.actors[1]!,
    target = w.actors[0]!;
  source.kind = "hostile";
  source.itemRules = createItemHitRules(source.offense, source.defense, [
    proc("fire", { kind: "damage", element: "fire", amount: 2 }),
  ]);
  prepareItemEffects(w);
  applyCombatHit(w, source, target, ARENA_NAV, {
    damage: 10,
    element: "physical",
    guaranteed: true,
    origin: "weapon",
  });
  resolveItemEffects(w, ARENA_NAV, r);
  expect(
    w.itemEffects!.events.some(
      (e) => e.actor === source.id && e.kind === "proc" && e.applied,
    ),
  ).toBe(true);
  const q = setup(),
    a = q.combat.actors[0]!,
    t = q.combat.actors[1]!;
  applyEquipment(deriveEquipment(gemGear(), captureEquipmentBase(a)), a);
  prepareItemEffects(q.combat);
  t.hp = 2;
  root(q, "weapon", "physical", 1);
  resolveItemEffects(q.combat, ARENA_NAV, q);
  expect(t.controller.timeline.phase).toBe("dead");
  expect(q.combat.events.filter((e) => e.kind === "death")).toHaveLength(1);
  const loot = createLootWorld(42);
  loot.table = "gem-cache";
  expect(
    consumeLootDeaths(
      loot,
      q.combat,
      ARENA_NAV,
      q.combat.events,
      AFFIX_ITEM_CONTENT,
    ),
  ).toHaveLength(1);
  expect(
    consumeLootDeaths(
      loot,
      q.combat,
      ARENA_NAV,
      q.combat.events,
      AFFIX_ITEM_CONTENT,
    ),
  ).toHaveLength(0);
});
it("caps fractional leech at current health and mana maximums", () => {
  const r = setup(),
    w = r.combat,
    a = w.actors[0]!,
    u = r.users[0]!;
  a.itemRules = createItemHitRules(a.offense, a.defense, [
    stat("lifeLeech", 30),
    stat("manaLeech", 30),
  ]);
  a.hp = a.maxHp - 0.1;
  u.mana = u.maxMana - 0.1;
  prepareItemEffects(w);
  root(r);
  resolveItemEffects(w, ARENA_NAV, r);
  expect(a.hp).toBe(a.maxHp);
  expect(u.mana).toBe(u.maxMana);
  expect(w.itemEffects!.lifeLeeched).toBeCloseTo(0.1);
  expect(w.itemEffects!.manaLeeched).toBeCloseTo(0.1);
});

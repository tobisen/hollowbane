import { it, expect } from "vitest";
import { createCombat, applyCombatHit, ARENA_NAV } from "./combat";
import { createSkills } from "./skills";
import { prepareItemEffects, resolveItemEffects } from "./item-effects";
import { createCharacterInventory } from "./equipment";
import {
  captureEquipmentBase,
  deriveEquipment,
  applyEquipment,
} from "./equipment-stats";
import { generateLoot } from "./loot";
import { registeredItemContent } from "./item-registry";
import { identifyItem } from "./item-save";
import { advancedItem } from "./advanced-item-test-helper";
import { insertSocket, extractSockets } from "./item-sockets";
function setup() {
  const w = createCombat();
  w.hostilesActive = false;
  const r = createSkills(w),
    a = w.actors[0]!,
    t = w.actors[1]!;
  a.offense.criticalChance = 0;
  t.hp = t.maxHp = 100000;
  t.defense = { defense: 0, armor: 0, physicalResistance: 0 };
  return { w, r, a, t, base: captureEquipmentBase(a) };
}
it("activates an authored full-set proc in real combat and removes it immediately with the fourth piece", () => {
  const { w, r, a, t, base } = setup(),
    c = createCharacterInventory();
  for (const [slot, sequence] of [
    ["helmet", 4690],
    ["chest", 1964],
    ["gloves", 47],
    ["boots", 1873],
  ] as const)
    c.equipment[slot] = identifyItem(
      generateLoot(
        {
          seed: 42,
          sequence,
          areaLevel: 12,
          monsterLevel: 12,
          table: "sanctum",
        },
        registeredItemContent(4),
      )!,
    );
  applyEquipment(deriveEquipment(c, base), a, r.users[0]);
  prepareItemEffects(w);
  for (let n = 0; n < 100; n++) {
    w.tick += 100;
    applyCombatHit(w, a, t, ARENA_NAV, {
      damage: 1,
      element: "physical",
      guaranteed: true,
      origin: "weapon",
    });
    resolveItemEffects(w, ARENA_NAV, r);
  }
  const flames = () =>
    w.events.filter((e) => e.kind === "damage" && e.result.type === "fire")
      .length;
  expect(flames()).toBeGreaterThan(0);
  const before = flames();
  delete c.equipment.boots;
  applyEquipment(deriveEquipment(c, base), a, r.users[0]);
  for (let n = 0; n < 20; n++) {
    w.tick += 100;
    applyCombatHit(w, a, t, ARENA_NAV, {
      damage: 1,
      element: "physical",
      guaranteed: true,
      origin: "weapon",
    });
    resolveItemEffects(w, ARENA_NAV, r);
  }
  expect(flames()).toBe(before);
  expect(
    deriveEquipment(c, base).advanced!.active.map((s) => s.required),
  ).not.toContain(4);
});
it("executes the authored ordered mana-on-kill pattern and extraction removes its actual effect", () => {
  const { w, r, a, t, base } = setup();
  let c = createCharacterInventory(40);
  const host = advancedItem("cinder-staff", {
    accept: (i) => i.quality === "normal" && i.socketCapacity === 3,
  });
  c.equipment.main = host;
  for (const [x, id] of [
    "sigil-isren",
    "sigil-lyrvek",
    "sigil-cyrrel",
  ].entries())
    c.grid.items.push({ item: advancedItem(id, { seed: 44 }), x, y: 0 });
  for (const id of c.grid.items.map((e) => e.item.id)) {
    const next = insertSocket(c, host.id, id);
    if (!next.ok) throw Error(next.reason);
    c = next.value;
  }
  applyEquipment(deriveEquipment(c, base), a, r.users[0]);
  prepareItemEffects(w);
  r.users[0]!.mana = 10;
  t.hp = 1;
  applyCombatHit(w, a, t, ARENA_NAV, {
    damage: 100,
    element: "fire",
    origin: "skill",
    skill: "ember-lance",
    guaranteed: true,
  });
  resolveItemEffects(w, ARENA_NAV, r);
  expect(r.users[0]!.mana).toBe(18);
  const result = extractSockets(c, host.id);
  if (!result.ok) throw Error(result.reason);
  applyEquipment(deriveEquipment(result.value, base), a, r.users[0]);
  w.tick += 100;
  const next = w.actors[2]!;
  next.hp = 1;
  applyCombatHit(w, a, next, ARENA_NAV, {
    damage: 100,
    element: "fire",
    origin: "skill",
    skill: "ember-lance",
    guaranteed: true,
  });
  resolveItemEffects(w, ARENA_NAV, r);
  expect(r.users[0]!.mana).toBe(18);
  expect(w.itemEffects!.applied).toBe(1);
});

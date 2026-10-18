import { it, expect } from "vitest";
import { advancedItem } from "./advanced-item-test-helper";
import { createCombat, applyCombatHit, ARENA_NAV } from "./combat";
import {
  createSkills,
  requestSkill,
  stepSkillCombat,
  activeSkill,
} from "./skills";
import { createCharacterInventory } from "./equipment";
import {
  captureEquipmentBase,
  deriveEquipment,
  applyEquipment,
} from "./equipment-stats";
import { applyStatus } from "./skill-effects";
function setup() {
  const w = createCombat();
  w.hostilesActive = false;
  w.actors[0]!.offense.criticalChance = 0;
  w.actors[1]!.hp = w.actors[1]!.maxHp = 1000;
  w.actors[1]!.defense = { defense: 0, armor: 0, physicalResistance: 0 };
  const r = createSkills(w),
    c = createCharacterInventory(40);
  c.equipment.gloves = advancedItem("sootwrap-gloves", {
    accept: (i) => !!i.advanced?.affixes?.includes("talent-oath-echo"),
  });
  applyEquipment(
    deriveEquipment(c, captureEquipmentBase(w.actors[0]!)),
    w.actors[0]!,
    r.users[0],
  );
  return r;
}
it("makes a real generated non-damaging buff rank improve power/duration then expire without drift", () => {
  const r = setup(),
    a = r.combat.actors[0]!;
  requestSkill(r, {
    actor: 0,
    skill: "oath-echo",
    target: null,
    direction: { x: 0, y: 0 },
  });
  for (let i = 0; i < 30; i++) stepSkillCombat(r);
  const status = r.effects.statuses.find(
    (s) => s.actor === 0 && s.kind === "power",
  )!;
  expect(status.magnitude).toBeGreaterThan(0.3);
  expect(status.duration).toBeGreaterThan(240);
  expect(a.powerMultiplier).toBeGreaterThan(1.3);
  applyCombatHit(r.combat, a, r.combat.actors[1]!, ARENA_NAV, {
    damage: 100,
    element: "physical",
    origin: "weapon",
    guaranteed: true,
  });
  const hit = r.combat.events.filter((e) => e.kind === "damage").at(-1);
  expect(hit?.kind === "damage" && hit.result.amount > 130).toBe(true);
  for (let i = 0; i < 400; i++) stepSkillCombat(r);
  expect(a.powerMultiplier).toBe(1);
  expect(r.effects.statuses).toHaveLength(0);
});
it("keeps triggered power statuses and damaging-skill status duration independent of item rank", () => {
  const r = setup(),
    a = r.combat.actors[0]!,
    power = activeSkill(r, "oath-echo")!;
  applyStatus(r, power, a, a, true);
  expect(r.effects.statuses[0]!.magnitude).toBe(0.3);
  expect(r.effects.statuses[0]!.duration).toBe(240);
  r.effects.statuses = [];
  const poison = activeSkill(r, "briar-edge")!;
  applyStatus(r, poison, a, r.combat.actors[1]!);
  expect(r.effects.statuses[0]!.duration).toBe(poison.status!.duration);
});

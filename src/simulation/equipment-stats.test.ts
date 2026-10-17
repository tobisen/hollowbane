import { it, expect } from "vitest";
import { createCombat, stepCombat, ARENA_NAV } from "./combat";
import { commandCombat } from "./combat-targeting";
import { createCharacterInventory } from "./equipment";
import { inventoryItem } from "./inventory-test-helper";
import {
  captureEquipmentBase,
  deriveEquipment,
  applyEquipment,
  compareEquipment,
} from "./equipment-stats";
it("derives equipped-only additive stats without compounding or mutating base", () => {
  const actor = createCombat().actors[0]!,
    base = captureEquipmentBase(actor),
    c = createCharacterInventory();
  c.equipment.main = inventoryItem("ash-blade");
  c.equipment.chest = inventoryItem("woven-coat");
  c.grid.items = [{ item: inventoryItem("slate-pendant"), x: 0, y: 0 }];
  const d = deriveEquipment(c, base);
  expect(d.offense.damage).toBe(28 + c.equipment.main.stats.damage!);
  expect(d.defense.armor).toBeGreaterThan(15);
  applyEquipment(d, actor);
  expect(deriveEquipment(c, base)).toEqual(d);
  expect(base.offense.damage).toBe(28);
  expect(compareEquipment(createCharacterInventory(), base, c).damage).toBe(
    c.equipment.main.stats.damage,
  );
});
it("retains health/mana amounts and all committed timing/RNG state when gear changes", () => {
  const w = createCombat(),
    a = w.actors[0]!,
    base = captureEquipmentBase(a),
    c = createCharacterInventory(),
    mana = { mana: 60, maxMana: 100 };
  a.hp = 150;
  a.controller = commandCombat(a.controller, {
    kind: "attack",
    target: 1,
    repeat: false,
  });
  stepCombat(w, ARENA_NAV);
  const controller = a.controller,
    seed = w.seed,
    tick = w.tick;
  c.equipment.amulet = inventoryItem("slate-pendant");
  applyEquipment(deriveEquipment(c, base), a, mana);
  expect(a.controller).toBe(controller);
  expect(w.seed).toBe(seed);
  expect(w.tick).toBe(tick);
  expect(a.hp).toBe(150);
  expect(mana.mana).toBe(60);
  expect(a.maxHp).toBeGreaterThan(300);
  a.hp = 0;
  applyEquipment(deriveEquipment(c, base), a, mana);
  expect(a.hp).toBe(0);
});
it("changes actual future physical damage and bow projectile behavior", () => {
  const run = (equipped: boolean) => {
    const w = createCombat(),
      a = w.actors[0]!,
      c = createCharacterInventory(),
      base = captureEquipmentBase(a);
    if (equipped) c.equipment.main = inventoryItem("ash-blade");
    applyEquipment(deriveEquipment(c, base), a);
    a.controller = commandCombat(a.controller, {
      kind: "attack",
      target: 1,
      repeat: true,
    });
    for (let i = 0; i < 180; i++) {
      stepCombat(w, ARENA_NAV);
      const hit = w.events.find((e) => e.kind === "damage" && e.actor === 0);
      if (hit?.kind === "damage" && hit.result.amount > 0)
        return hit.result.amount;
    }
    throw Error("No hit");
  };
  expect(run(true)).toBeGreaterThan(run(false));
  const a = createCombat().actors[0]!,
    c = createCharacterInventory();
  c.equipment.main = inventoryItem("reed-bow");
  const d = deriveEquipment(c, captureEquipmentBase(a));
  expect(d.weapon).toBe("projectile");
  expect(d.range).toBe(6);
});

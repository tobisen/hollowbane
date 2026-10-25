import { expect, test } from "vitest";
import { newCharacter } from "./new-character";
import { CHARACTER_CLASSES, classEquipmentBase } from "./character-classes";
import { serializeCharacter, deserializeCharacter } from "./inventory-save";
import { validateSession, createInventorySession } from "./inventory-world";
import { compatible, ownedItems, unequipItem } from "./equipment";
import { validateGeneratedItem } from "./item-save";
import {
  captureEquipmentBase,
  deriveEquipment,
  applyEquipment,
} from "./equipment-stats";
import { createCombat } from "./combat";
import { tradeWithMerchant } from "./camp-merchant";
import { CAMP_NPCS } from "./camp-dialogue";
import {
  STARTER_SKILLS,
  skillBar,
  unlockedSkillRank,
  createSkillProgression,
} from "./skill-progression";
import {
  actorSkill,
  createSkills,
  requestSkill,
  stepSkillCombat,
} from "./skills";

for (const definition of CHARACTER_CLASSES) {
  test(`${definition.id} preserves pre-grant saves and deliberately empty starter bindings`, () => {
    const old = newCharacter(definition.id);
    old.progression = {
      ...old.progression!,
      skills: createSkillProgression(definition.id),
    };
    const text = serializeCharacter(old);
    expect(serializeCharacter(deserializeCharacter(text))).toBe(text);
    expect(deserializeCharacter(text).progression!.skills.ranks).toEqual({});
    const fresh = newCharacter(definition.id);
    fresh.progression = {
      ...fresh.progression!,
      skills: { ...fresh.progression!.skills, bar: Array<null>(6).fill(null) },
    };
    let restored = fresh;
    for (let reload = 0; reload < 3; reload++)
      restored = deserializeCharacter(serializeCharacter(restored));
    expect(restored.progression!.skills).toEqual(fresh.progression!.skills);
    expect(restored.progression!.skills.spent).toBe(0);
    expect(skillBar(restored.progression!.skills)).toEqual(
      Array<null>(6).fill(null),
    );
  });
  test(`${definition.id} can cast its assigned starting ability repeatedly at authored cost`, () => {
    const session = deserializeCharacter(
      serializeCharacter(newCharacter(definition.id)),
    );
    const world = createCombat();
    world.hostilesActive = false;
    Object.assign(world.experience, session.progression!);
    const runtime = createSkills(world),
      player = world.actors[0]!,
      user = runtime.users[0]!;
    applyEquipment(
      deriveEquipment(
        session.character,
        classEquipmentBase(definition, captureEquipmentBase(player)),
      ),
      player,
      user,
    );
    // This uses the conservative authored class mana pool, below the current browser base.
    user.mana = user.maxMana;
    const id = skillBar(session.progression!.skills)[0]!;
    const ability = actorSkill(runtime, 0, id)!;
    expect(ability.mana).toBe(
      { warrior: 7, sorcerer: 8, ranger: 9 }[definition.id],
    );
    expect(user.mana).toBeGreaterThanOrEqual(ability.mana * 5);
    const target = world.actors[1]!;
    target.hp = target.maxHp = 10000;
    target.controller.walker.position = {
      ...player.controller.walker.position,
      x: player.controller.walker.position.x + 0.5,
    };
    for (let cast = 0; cast < 3; cast++) {
      const mana = user.mana;
      requestSkill(runtime, {
        actor: 0,
        skill: id,
        target: target.id,
        direction: { x: 1, y: 0 },
      });
      stepSkillCombat(runtime);
      expect(user.mana).toBeCloseTo(
        Math.min(
          user.maxMana,
          mana + (4 + (definition.id === "sorcerer" ? 0.5 : 0)) / 60,
        ) - ability.mana,
        8,
      );
      for (let tick = 0; tick < 120; tick++) stepSkillCombat(runtime);
    }
    expect(
      runtime.events.filter(
        (e) => e.actor === 0 && e.skill === id && e.kind === "effect",
      ),
    ).toHaveLength(3);
    expect(
      runtime.events.filter((e) => e.actor === 0 && e.kind === "rejected"),
    ).toEqual([]);
    expect(target.hp).toBeLessThan(target.maxHp);
  });
  test(`${definition.id} starts a detached deterministic level-one campaign without earned rewards`, () => {
    const first = newCharacter(definition.id);
    const second = newCharacter(definition.id);
    validateSession(first);
    expect(serializeCharacter(first)).toBe(serializeCharacter(second));
    expect(
      serializeCharacter(deserializeCharacter(serializeCharacter(first))),
    ).toBe(serializeCharacter(first));
    expect(first.progression?.character).toMatchObject({
      level: 1,
      totalXp: 0,
    });
    expect(first.progression?.attributes.starting).toEqual(
      definition.attributes,
    );
    expect(first.progression?.skills).toMatchObject({
      classId: definition.id,
      available: 0,
      spent: 0,
      starter: true,
      ranks: { [STARTER_SKILLS[definition.id].node]: 1 },
    });
    expect(skillBar(first.progression!.skills)).toEqual([
      STARTER_SKILLS[definition.id].skill,
      null,
      null,
      null,
      null,
      null,
    ]);
    expect(
      unlockedSkillRank(
        first.progression!.skills,
        STARTER_SKILLS[definition.id].skill,
      ),
    ).toBe(1);
    expect(first.character.grid.items).toEqual([]);
    const weapon = first.character.equipment.main!;
    expect(Object.keys(first.character.equipment)).toEqual(["main"]);
    expect(ownedItems(first.character)).toHaveLength(1);
    expect(weapon).toMatchObject({
      base: definition.starterWeapon,
      name: {
        warrior: "Worn Shortsword",
        sorcerer: "Apprentice Staff",
        ranger: "Hunter's Bow",
      }[definition.id],
      quality: "normal",
      identified: true,
      requirement: 1,
      level: 1,
      affixes: [],
      unique: null,
    });
    expect(weapon.socketCapacity).toBeUndefined();
    expect(validateGeneratedItem(weapon)).toEqual(weapon);
    expect(() =>
      validateGeneratedItem({ ...weapon, stats: { damage: 999 } }),
    ).toThrow();
    expect(compatible(weapon, "main", 1, first.requirements)).toBe(true);
    const base = classEquipmentBase(
      definition,
      captureEquipmentBase(createCombat().actors[0]!),
    );
    const unarmed = deriveEquipment(
      { ...first.character, equipment: {} },
      base,
    );
    const armed = deriveEquipment(first.character, base);
    expect(armed.offense.damage - unarmed.offense.damage).toBe(
      weapon.stats.damage,
    );
    expect(armed.maxMana - unarmed.maxMana).toBe(
      definition.id === "sorcerer" ? 8 : 0,
    );
    expect(armed.weapon).toBe(
      definition.id === "ranger" ? "projectile" : "melee",
    );
    expect(armed.range).toBe(definition.id === "ranger" ? 6 : 1.05);
    expect(first.exploration).toMatchObject({
      area: "ashen-refuge",
      seed: 42,
      containers: { gold: 0, opened: [] },
    });
    first.character.grid.columns = 1;
    expect(second.character.grid.columns).toBe(10);
  });

  test(`${definition.id} reloads repeatedly without duplicating or re-equipping its starter`, () => {
    const first = newCharacter(definition.id);
    const weapon = first.character.equipment.main!;
    let restored = deserializeCharacter(serializeCharacter(first));
    for (let i = 0; i < 3; i++)
      restored = deserializeCharacter(serializeCharacter(restored));
    expect(ownedItems(restored.character)).toEqual([weapon]);
    const unequipped = unequipItem(restored.character, "main");
    expect(unequipped.ok).toBe(true);
    if (!unequipped.ok) throw Error(unequipped.reason);
    restored.character = unequipped.value;
    const loaded = deserializeCharacter(serializeCharacter(restored));
    expect(loaded.character.equipment).toEqual({});
    expect(ownedItems(loaded.character)).toEqual([weapon]);
  });

  test(`${definition.id} retains a sold starter ledger and never grants gear to an existing unarmed save`, () => {
    const loaded = newCharacter(definition.id);
    const weapon = loaded.character.equipment.main!;
    const unequipped = unequipItem(loaded.character, "main");
    if (!unequipped.ok) throw Error(unequipped.reason);
    loaded.character = unequipped.value;
    loaded.exploration!.position = {
      ...CAMP_NPCS.find((npc) => npc.id === "orren-thale")!.position,
    };
    const sold = tradeWithMerchant(loaded, {
      kind: "sell",
      id: weapon.id,
      expectedRevision: loaded.character.revision,
      expectedMerchantRevision: 0,
    });
    expect(sold.ok).toBe(true);
    if (!sold.ok) throw Error(sold.reason);
    const afterSale = deserializeCharacter(serializeCharacter(sold.value));
    expect(ownedItems(afterSale.character)).toEqual([]);
    expect(afterSale.exploration!.merchant!.retired).toEqual([weapon.id]);
    const oldUnarmed = newCharacter(definition.id);
    oldUnarmed.character.equipment = {};
    const oldText = serializeCharacter(oldUnarmed);
    expect(serializeCharacter(deserializeCharacter(oldText))).toBe(oldText);
    expect(deserializeCharacter(oldText).character.equipment).toEqual({});
  });
}

test("existing unarmed saves round trip unchanged without receiving equipment", () => {
  const legacy = createInventorySession(17);
  const text = serializeCharacter(legacy);
  const loaded = deserializeCharacter(text);
  expect(loaded.character.equipment).toEqual({});
  expect(ownedItems(loaded.character)).toEqual([]);
  expect(serializeCharacter(loaded)).toBe(text);
  newCharacter("warrior", 17);
  expect(serializeCharacter(legacy)).toBe(text);
});

import { expect, it } from "vitest";
import { characterPanelState } from "./character-panel-state";
import { createMonsterExperience } from "../simulation/monster-experience";
import { createCombat } from "../simulation/combat";
import { createCharacterInventory } from "../simulation/equipment";
import {
  captureEquipmentBase,
  deriveEquipment,
} from "../simulation/equipment-stats";
import { DEFAULT_XP_CURVE } from "../simulation/experience";
it("presents shared totals and progress within the current level, including the cap", () => {
  const stats = deriveEquipment(
    createCharacterInventory(),
    captureEquipmentBase(createCombat().actors[0]!),
  );
  const view = characterPanelState(createMonsterExperience(300), stats);
  expect(view).toMatchObject({
    level: 2,
    totalXp: 300,
    nextLevelXp: 500,
    progress: 0.5,
    available: 5,
  });
  expect(view.stats.health).toBe(stats.maxHp);
  expect(view.stats.damage).toBe(stats.offense.damage);
  expect(
    characterPanelState(createMonsterExperience(DEFAULT_XP_CURVE[98]!), stats),
  ).toMatchObject({
    level: 99,
    progress: 1,
    nextLevelXp: null,
    available: 490,
  });
});

import { commandCombat } from "./combat-targeting";
import type { ClassId } from "./character-classes";
import {
  CHARACTER_CLASSES,
  createClassFoundation,
  classEquipmentBase,
} from "./character-classes";
import type { CombatWorld } from "./combat";
import { createMonsterExperience } from "./monster-experience";
import { DEFAULT_XP_CURVE } from "./experience";
import {
  createSkillProgression,
  allocateSkillRanks,
  assignSkill,
} from "./skill-progression";
import { createSkills } from "./skills";
import {
  captureEquipmentBase,
  deriveEquipment,
  applyEquipment,
} from "./equipment-stats";
import { createCharacterInventory } from "./equipment";
/** Explicit developer fixture only. No save/storage access or permanent switching. */
export function createClassLaboratory(world: CombatWorld, classId: ClassId) {
  const definition = CHARACTER_CLASSES.find((c) => c.id === classId);
  if (!definition) throw Error("Invalid laboratory class");
  const totalXp = DEFAULT_XP_CURVE[11]!;
  const foundation = createClassFoundation(definition, totalXp);
  world.experience = createMonsterExperience(totalXp);
  world.experience.attributes = foundation.attributes;
  const nodes =
    classId === "warrior"
      ? { "warrior-arms-foundation": 3, "warrior-resolve-foundation": 3 }
      : classId === "sorcerer"
        ? { "sorcerer-ember-foundation": 3, "sorcerer-rime-foundation": 3 }
        : { "ranger-wilds-foundation": 3, "ranger-precision-foundation": 3 };
  const abilities =
    classId === "warrior"
      ? ["iron-fan", "oath-echo"]
      : classId === "sorcerer"
        ? ["ember-lance", "rime-ring"]
        : ["briar-edge", "storm-thread"];
  let state = allocateSkillRanks(
    createSkillProgression(classId, 12),
    12,
    nodes,
  );
  abilities.forEach((id, index) => {
    state = assignSkill(state, index, id);
  });
  world.experience.skills = state;
  const runtime = createSkills(world),
    player = world.actors[0]!,
    user = runtime.users[0]!;
  const stats = deriveEquipment(
    createCharacterInventory(12),
    classEquipmentBase(definition, captureEquipmentBase(player), totalXp),
  );
  applyEquipment(stats, player, user);
  player.hp = player.maxHp;
  user.mana = user.maxMana;
  world.hostilesActive = false;
  for (let i = 1; i <= 3; i++) {
    const target = world.actors[i];
    if (!target) continue;
    target.kind = "dummy";
    target.controller = commandCombat(target.controller, { kind: "stop" });
    target.name = `Class target ${i}`;
    target.hp = target.maxHp = 500;
    target.defense = { defense: 0, armor: 0, physicalResistance: 0 };
    target.controller.walker.position = {
      x: player.controller.walker.position.x + i * 0.6,
      y: player.controller.walker.position.y,
    };
  }
  return runtime;
}

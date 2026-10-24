import {
  CHARACTER_CLASSES,
  createClassFoundation,
  type ClassId,
} from "./character-classes";
import {
  createInventorySession,
  type InventorySession,
} from "./inventory-world";
import { createSkillProgression } from "./skill-progression";
import { WorldSession } from "./world-session";
import { STARTER_ITEM_CONTENT } from "./item-registry";
import { generateLoot } from "./loot";
import { addGrid } from "./inventory-grid";
import { equipItem } from "./equipment";
import { attributeValues } from "./attributes";

/** Fresh campaign state only; identity, clocks and storage belong to the browser adapter. */
export function newCharacter(classId: ClassId, seed = 42): InventorySession {
  const definition = CHARACTER_CLASSES.find((entry) => entry.id === classId);
  if (!definition) throw Error("Choose a supported class");
  const foundation = createClassFoundation(definition);
  const session = createInventorySession(seed);
  session.character.level = 1;
  session.progression = {
    curve: "xp-v1",
    character: foundation.experience,
    attributes: foundation.attributes,
    skills: createSkillProgression(classId),
  };
  const weapon = generateLoot(
    {
      seed,
      sequence: CHARACTER_CLASSES.indexOf(definition),
      monsterLevel: 1,
      areaLevel: 1,
      table: `starter-${definition.starterWeapon}`,
    },
    STARTER_ITEM_CONTENT,
  );
  if (!weapon) throw Error("Missing starter weapon");
  session.requirements = { attributes: attributeValues(foundation.attributes) };
  const placed = addGrid(session.character.grid, weapon);
  if (!placed.ok) throw Error(placed.reason);
  const equipped = equipItem(
    { ...session.character, grid: placed.value },
    weapon.id,
    "main",
    session.requirements,
  );
  if (!equipped.ok) throw Error(equipped.reason);
  session.character = equipped.value;
  const world = new WorldSession(undefined, seed, 2);
  session.exploration = world.capture(
    world.travel.state.position,
    session.loot,
  );
  return session;
}

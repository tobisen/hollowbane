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
  const world = new WorldSession(undefined, seed, 2);
  session.exploration = world.capture(
    world.travel.state.position,
    session.loot,
  );
  return session;
}

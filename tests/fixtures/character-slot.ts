import {
  createInventorySession,
  type InventorySession,
} from "../../src/simulation/inventory-world";
import { progressionAtLevel } from "../../src/simulation/progression-save";
import { allocateAttributes } from "../../src/simulation/attributes";
import {
  allocateSkillRanks,
  assignSkill,
  createSkillProgression,
} from "../../src/simulation/skill-progression";
import type { ClassId } from "../../src/simulation/character-classes";
import { WorldSession } from "../../src/simulation/world-session";
import { QUESTS } from "../../src/simulation/quests";
import { newCampStash } from "../../src/simulation/camp-stash-state";
import { inventoryItem } from "../../src/simulation/inventory-test-helper";
import {
  serializeCharacter,
  snapshotChecksum,
} from "../../src/simulation/inventory-save";
import { socketedCampItem } from "./camp-items";

/** Bounded existing item fixtures; no campaign playthrough or distribution simulation. */
export function characterSlotFixture(
  classId: ClassId = "warrior",
  seed = 42,
): InventorySession {
  const s = createInventorySession(seed);
  s.character.level = 24;
  const p = progressionAtLevel(24);
  const node = {
    warrior: "warrior-arms-foundation",
    sorcerer: "sorcerer-ember-foundation",
    ranger: "ranger-wilds-foundation",
  }[classId];
  s.progression = {
    ...p,
    attributes: allocateAttributes(p.attributes, { vitality: 2 }),
    skills: assignSkill(
      allocateSkillRanks(createSkillProgression(classId, 24), 24, {
        [node]: 1,
      }),
      2,
      { warrior: "iron-fan", sorcerer: "ember-lance", ranger: "briar-edge" }[
        classId
      ],
    ),
  };
  const w = new WorldSession(undefined, seed, 2);
  w.acceptQuest(
    QUESTS.find((q) => q.chapter === "act1" && q.requires.length === 0)!.id,
  );
  const spawn = w.travel.layout.spawn;
  w.reveal(spawn);
  w.attuneWaypoint(spawn, true, true, true);
  s.exploration = w.capture(spawn, s.loot);
  s.exploration.containers!.gold = 123;
  s.exploration.stash = newCampStash();
  s.exploration.stash.grid.items.push({
    item: inventoryItem("copper-band"),
    x: 0,
    y: 0,
  });
  s.character.equipment.main = inventoryItem("ash-blade", 0, 2);
  s.character.grid.items.push({ item: socketedCampItem(), x: 0, y: 0 });
  return s;
}
export function historicalCharacter(schema: number): string {
  const s = createInventorySession(19);
  s.character.equipment.main = inventoryItem("ash-blade", 0, 2);
  s.character.grid.items.push({
    item: inventoryItem("copper-band"),
    x: 0,
    y: 0,
  });
  const root = JSON.parse(serializeCharacter(s));
  root.schema = schema;
  if (schema < 3) delete root.body.progression;
  else if (schema === 3) delete root.body.progression.skills;
  if (schema === 1) root.body.contentVersions = [2, 3];
  if (schema === 2) root.body.contentVersions = [2, 3, 4, 5, 6, 7, 8];
  root.checksum = snapshotChecksum(JSON.stringify(root.body));
  return JSON.stringify(root);
}

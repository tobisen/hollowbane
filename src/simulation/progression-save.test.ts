import { expect, it } from "vitest";
import { progressionAtLevel, validateProgression } from "./progression-save";
import { allocateAttributes } from "./attributes";
import {
  serializeCharacter,
  deserializeCharacter,
  snapshotChecksum,
  inspectSnapshots,
} from "./inventory-save";
import { createInventorySession } from "./inventory-world";
import { inventoryItem } from "./inventory-test-helper";
it("round-trips earned/spent points and every level without awarding rewards again", () => {
  for (let level = 1; level <= 99; level++) {
    const s = createInventorySession();
    s.character.level = level;
    const p = progressionAtLevel(level);
    s.progression = {
      ...p,
      attributes:
        level > 1
          ? allocateAttributes(p.attributes, { strength: 2, vitality: 3 })
          : p.attributes,
    };
    const restored = deserializeCharacter(serializeCharacter(s));
    expect(restored.progression).toEqual(s.progression);
    expect(serializeCharacter(restored)).toBe(serializeCharacter(s));
  }
});
it("migrates schema1/2 level and retains exact items, equipment and loot stream", () => {
  for (const schema of [1, 2]) {
    const s = createInventorySession(13);
    s.character.equipment.main = inventoryItem("ash-blade");
    const root = JSON.parse(serializeCharacter(s));
    root.schema = schema;
    delete root.body.progression;
    root.body.contentVersions = schema === 1 ? [2, 3] : [2, 3, 4, 5, 6, 7, 8];
    root.checksum = snapshotChecksum(JSON.stringify(root.body));
    const original = JSON.stringify(root);
    const restored = deserializeCharacter(original);
    expect(restored.character).toEqual(s.character);
    expect(restored.progression).toEqual(progressionAtLevel(12));
    expect(restored.loot.seed).toBe(13);
    expect(JSON.stringify(root)).toBe(original);
  }
});
it("rejects malformed progression, inconsistent XP/points and unsupported curves without applying backups", () => {
  const valid = progressionAtLevel(2);
  for (const bad of [
    { ...valid, curve: "future" },
    { ...valid, character: { ...valid.character, level: 3 } },
    { ...valid, character: { ...valid.character, totalXp: NaN } },
    { ...valid, attributes: { ...valid.attributes, available: 10 } },
    {
      ...valid,
      attributes: {
        ...valid.attributes,
        allocated: { ...valid.attributes.allocated, strength: -1 },
      },
    },
    { ...valid, attributes: { ...valid.attributes, rewardedLevel: 1 } },
    {
      ...valid,
      attributes: {
        ...valid.attributes,
        starting: { ...valid.attributes.starting, extra: 1 },
      },
    },
  ])
    expect(() => validateProgression(bad)).toThrow();
  const s = createInventorySession();
  s.progression = progressionAtLevel(12);
  const text = serializeCharacter(s);
  const root = JSON.parse(text);
  root.body.progression.attributes.available++;
  root.checksum = snapshotChecksum(JSON.stringify(root.body));
  expect(inspectSnapshots(JSON.stringify(root), text).kind).toBe("recoverable");
  expect(() => deserializeCharacter(JSON.stringify(root))).toThrow();
  expect(() => serializeCharacter({ ...s, progression: valid })).toThrow(
    /mismatch/,
  );
});

it("round-trips class skill points/ranks and migrates schema3 without changing prior progression/items", async () => {
  const { createSkillProgression, allocateSkillRanks, rewardSkillLevels } =
    await import("./skill-progression");
  const s = createInventorySession(29);
  s.progression = progressionAtLevel(s.character.level);
  s.character.equipment.main = inventoryItem("ash-blade");
  s.progression = {
    ...s.progression,
    attributes: allocateAttributes(s.progression.attributes, { strength: 5 }),
    skills: allocateSkillRanks(
      createSkillProgression("warrior", s.character.level),
      s.character.level,
      { "warrior-arms-foundation": 3 },
    ),
  };
  const text = serializeCharacter(s);
  const restored = deserializeCharacter(text);
  expect(restored.progression).toEqual(s.progression);
  expect(restored.character).toEqual(s.character);
  expect(
    rewardSkillLevels(restored.progression!.skills, s.character.level),
  ).toBe(restored.progression!.skills);
  const legacy = JSON.parse(text);
  legacy.schema = 3;
  delete legacy.body.progression.skills;
  legacy.checksum = snapshotChecksum(JSON.stringify(legacy.body));
  const migrated = deserializeCharacter(JSON.stringify(legacy));
  expect(migrated.character).toEqual(s.character);
  expect(migrated.loot).toEqual(restored.loot);
  expect(migrated.progression!.attributes).toEqual(s.progression.attributes);
  expect(migrated.progression!.character).toEqual(s.progression.character);
  expect(migrated.progression!.skills).toEqual(
    createSkillProgression(null, s.character.level),
  );
});
it("rejects forged skill budgets, class/version/level/ranks and preserves recovery snapshots", async () => {
  const { createSkillProgression, allocateSkillRanks } =
    await import("./skill-progression");
  const s = createInventorySession();
  const p = progressionAtLevel(s.character.level);
  s.progression = {
    ...p,
    skills: allocateSkillRanks(
      createSkillProgression("warrior", s.character.level),
      s.character.level,
      { "warrior-arms-foundation": 3 },
    ),
  };
  const text = serializeCharacter(s);
  for (const patch of [
    { available: 99 },
    { spent: 0 },
    { version: 2 },
    { treeVersion: 2 },
    { classId: "unknown" },
    { rewardedLevel: 1 },
    { ranks: { "warrior-arms-foundation": 6 } },
    { ranks: { "sorcerer-ember-foundation": 3 } },
    { ranks: { "warrior-arms-foundation": 1.5 } },
  ]) {
    const root = JSON.parse(text);
    Object.assign(root.body.progression.skills, patch);
    root.checksum = snapshotChecksum(JSON.stringify(root.body));
    expect(() => deserializeCharacter(JSON.stringify(root))).toThrow();
    expect(inspectSnapshots(JSON.stringify(root), text).kind).toBe(
      "recoverable",
    );
  }
  expect(serializeCharacter(s)).toBe(text);
});

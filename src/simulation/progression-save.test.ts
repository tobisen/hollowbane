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

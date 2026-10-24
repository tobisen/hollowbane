import { expect, test } from "vitest";
import { newCharacter } from "./new-character";
import { CHARACTER_CLASSES } from "./character-classes";
import { serializeCharacter, deserializeCharacter } from "./inventory-save";
import { validateSession } from "./inventory-world";

for (const definition of CHARACTER_CLASSES) {
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
      ranks: {},
    });
    expect(first.character.grid.items).toEqual([]);
    expect(first.character.equipment).toEqual({});
    expect(first.exploration).toMatchObject({
      area: "ashen-refuge",
      seed: 42,
      containers: { gold: 0, opened: [] },
    });
    first.character.grid.columns = 1;
    expect(second.character.grid.columns).toBe(10);
  });
}

import { expect, it } from "vitest";
import {
  CHARACTER_CAPACITY,
  characterId,
  characterName,
  characterMetadata,
  inspectCharacter,
  nextRegistry,
  validateRegistry,
} from "./character-registry";
import { serializeCharacter, deserializeCharacter } from "./inventory-save";
import {
  characterSlotFixture,
  historicalCharacter,
} from "../../tests/fixtures/character-slot";

const id = "10000000-0000-4000-8000-000000000001";
it("validates an empty versioned registry and safe display names independently of identity", () => {
  expect(validateRegistry(undefined)).toEqual({
    version: 1,
    revision: 0,
    lastPlayed: null,
    characters: [],
  });
  expect(characterName("  <Ash & Snow>  ")).toBe("<Ash & Snow>");
  expect(characterName("Åsa 夜")).toBe("Åsa 夜");
  for (const name of [" ", "a".repeat(33), "Ash\nSnow", "Ash\u202eSnow", null])
    expect(() => characterName(name)).toThrow();
  for (const value of ["Ash", "../current", "", null])
    expect(() => characterId(value)).toThrow();
});
it("rejects malformed, future, duplicate, over-capacity and dangling selection registries", () => {
  const session = characterSlotFixture(),
    metadata = characterMetadata(id, "Ash", session, 100);
  const r = nextRegistry(validateRegistry(undefined), [metadata]);
  expect(validateRegistry(r)).toEqual(r);
  for (const bad of [
    null,
    { ...r, version: 2 },
    { ...r, revision: -1 },
    { ...r, characters: [metadata, metadata] },
    { ...r, characters: Array(CHARACTER_CAPACITY + 1).fill(metadata) },
    { ...r, lastPlayed: id },
    { ...r, characters: [{ ...metadata, lastPlayedAt: 200 }] },
  ])
    expect(() => validateRegistry(bad)).toThrow();
  expect(() =>
    nextRegistry({ ...r, revision: Number.MAX_SAFE_INTEGER }, [metadata]),
  ).toThrow();
});
it("checks owner/revision/metadata and offers the same character backup without silent replacement", () => {
  const session = characterSlotFixture(),
    text = serializeCharacter(session),
    metadata = characterMetadata(id, "Ash", session, 100);
  const current = { id, revision: 1, text };
  expect(inspectCharacter(metadata, current, undefined).kind).toBe("valid");
  for (const damaged of [
    { ...current, id: "10000000-0000-4000-8000-000000000002" },
    { ...current, revision: 2 },
    { ...current, text: "broken" },
    undefined,
  ]) {
    expect(inspectCharacter(metadata, damaged, current).kind).toBe(
      "recoverable",
    );
    expect(inspectCharacter(metadata, damaged, undefined).kind).toBe("invalid");
  }
  expect(
    inspectCharacter({ ...metadata, level: 23 }, current, undefined).kind,
  ).toBe("invalid");
  expect(inspectCharacter(metadata, current, "bad backup").kind).toBe("valid");
  expect(() =>
    characterMetadata(
      id,
      "Ash",
      characterSlotFixture("ranger"),
      101,
      2,
      metadata,
    ),
  ).toThrow(/class identity/);
});
for (const schema of [1, 2, 3, 4, 5]) {
  it(`accepts supported schema${schema} without mutating historical item bytes`, () => {
    const text = historicalCharacter(schema),
      s = deserializeCharacter(text);
    const metadata = characterMetadata(id, "Legacy", s, 100);
    const loaded = inspectCharacter(
      metadata,
      { id, revision: 1, text },
      undefined,
    );
    expect(loaded.kind).toBe("valid");
    if (loaded.kind === "valid")
      expect(loaded.session.character).toEqual(s.character);
    expect(historicalCharacter(schema)).toBe(text);
  });
}

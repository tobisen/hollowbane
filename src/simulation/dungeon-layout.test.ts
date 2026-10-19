import * as validation from "./generation-validation";
import { expect, it, vi } from "vitest";
import { generateDungeon, validDungeon, DUNGEON_ROOMS } from "./dungeon-layout";
import { areaSeed } from "./world";
import { snapshotChecksum } from "./inventory-save";
it("reproduces connected rooms/corridors and different layouts across representative seeds", () => {
  const digests = new Set<string>(),
    sizes = new Set<string>(),
    counts = new Set<number>();
  for (const seed of [0, 1, 2, 3, 42, 12345, 0x80000000, 0xffffffff]) {
    const dungeon = generateDungeon(seed);
    expect(generateDungeon(seed)).toEqual(dungeon);
    expect(validDungeon(dungeon)).toBe(true);
    expect(dungeon.layout.map.seed).toBe(areaSeed(seed, "ancient-crypt"));
    expect(dungeon.layout.exits.map((e) => e.id)).toEqual(["graveyard"]);
    expect(dungeon.corridors.length).toBe(dungeon.rooms.length - 1);
    dungeon.rooms.forEach((r) => sizes.add(`${r.width}/${r.height}`));
    counts.add(dungeon.rooms.length);
    digests.add(snapshotChecksum(JSON.stringify(dungeon)));
  }
  expect(digests.size).toBe(8);
  expect(sizes.size).toBeGreaterThan(1);
  expect(counts.size).toBeGreaterThan(1);
});
it("rejects invalid geometry/blocked exits and invalid seeds/templates", () => {
  const d = generateDungeon(42);
  expect(
    validDungeon({ ...d, layout: { ...d.layout, spawn: { x: 999, y: 999 } } }),
  ).toBe(false);
  expect(
    validDungeon({
      ...d,
      zones: [
        ...d.zones,
        {
          id: "invalid",
          kind: "monster",
          room: d.rooms[0]!.id,
          position: { x: 999, y: 999 },
          radius: 1,
        },
      ],
    }),
  ).toBe(false);
  expect(() => generateDungeon(-1)).toThrow();
  expect(() => generateDungeon(1, [])).toThrow();
  expect(() =>
    generateDungeon(1, [{ ...DUNGEON_ROOMS[0]!, width: 100 }]),
  ).toThrow();
});
it("pins dungeon version one", () => {
  expect(
    snapshotChecksum(JSON.stringify(generateDungeon(42))),
  ).toMatchInlineSnapshot(`"d8cc47fa"`);
});

it("validates a deterministic fallback after candidate connectivity rejection", () => {
  const validate = vi.spyOn(validation, "validGeneratedPlacement");
  try {
    validate.mockReturnValueOnce(false);
    const first = generateDungeon(42);
    expect(first.fallback).toBe(true);
    expect(validDungeon(first)).toBe(true);
    validate.mockReturnValueOnce(false);
    expect(generateDungeon(42)).toEqual(first);
    expect(first.layout.map.objects).toHaveLength(0);
  } finally {
    validate.mockRestore();
  }
});

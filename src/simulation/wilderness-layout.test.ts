import { WILDERNESS_MODULES } from "./wilderness-modules";
import { expect, it } from "vitest";
import { generateWilderness, wildernessConnected } from "./wilderness-layout";
import { areaSeed } from "./world";
import { snapshotChecksum } from "./inventory-save";
it("reproduces coherent winding routes, required anchors and meaningful seed variation", () => {
  const digests = new Set<string>(),
    routes = new Set<string>();
  for (const seed of [0, 1, 2, 3, 4, 42, 12345, 0x80000000, 0xffffffff]) {
    const generated = generateWilderness("haunted-forest", seed);
    expect(generateWilderness("haunted-forest", seed)).toEqual(generated);
    expect(generated.fallback).toBe(false);
    expect(generated.layout.map.seed).toBe(areaSeed(seed, "haunted-forest"));
    expect(generated.layout.exits.map((e) => e.id)).toEqual([
      "camp",
      "graveyard",
    ]);
    expect(generated.modules).toHaveLength(20);
    expect(generated.modules.reduce((n, m) => n + m.ports.length, 0)).toBe(38);
    digests.add(snapshotChecksum(JSON.stringify(generated)));
    routes.add(JSON.stringify(generated.modules.map((m) => m.ports)));
  }
  expect(digests.size).toBe(9);
  expect(routes.size).toBeGreaterThan(6);
  const graveyard = generateWilderness("forgotten-graveyard", 42);
  expect(graveyard.layout.exits.map((e) => e.id)).toEqual(["forest", "crypt"]);
  expect(graveyard.layout.map).not.toEqual(
    generateWilderness("haunted-forest", 42).layout.map,
  );
});
it("rejects blocked anchors, unreachable exits and isolated terrain fragments", () => {
  const { layout } = generateWilderness("haunted-forest", 42);
  expect(wildernessConnected(layout)).toBe(true);
  expect(wildernessConnected({ ...layout, spawn: { x: 1e6, y: 1e6 } })).toBe(
    false,
  );
  const t = layout.map.terrain,
    cells = [...t.cells];
  // Split the whole landscape vertically, leaving otherwise individually valid anchors.
  for (let y = 0; y < t.height; y++) cells[y * t.width + 17] = "solid";
  expect(
    wildernessConnected({
      ...layout,
      map: { ...layout.map, terrain: { ...t, cells } },
    }),
  ).toBe(false);
  const objects = [
    ...layout.map.objects,
    {
      id: "blocking-fixture",
      appearance: "test-only",
      position: layout.exits[0]!.trigger,
      radius: 1,
      blocking: true,
    },
  ];
  expect(
    wildernessConnected({ ...layout, map: { ...layout.map, objects } }),
  ).toBe(false);
});

it("uses a deterministic validated outdoor fallback when an extension module creates pockets", () => {
  const path = WILDERNESS_MODULES[0]!;
  const rows = [...path.rows];
  rows[1] = "#.#####";
  const catalog = [{ ...path, id: "test-isolated-pocket", rows }];
  const result = generateWilderness("haunted-forest", 42, catalog);
  expect(result.fallback).toBe(true);
  expect(wildernessConnected(result.layout)).toBe(true);
  expect(result.layout.map.objects).toHaveLength(0);
  expect(generateWilderness("haunted-forest", 42, catalog)).toEqual(result);
});

it("pins layout version one to an exact deterministic sample", () => {
  expect(
    snapshotChecksum(JSON.stringify(generateWilderness("haunted-forest", 42))),
  ).toMatchInlineSnapshot(`"82932627"`);
});

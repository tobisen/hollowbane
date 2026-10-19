import { expect, it } from "vitest";
import { validGeneratedPlacement } from "./generation-validation";
import { validDungeon, generateDungeon } from "./dungeon-layout";
import { generateWilderness } from "./wilderness-layout";
it("uses shared actor navigation and exact geometry for outdoor/dungeon candidates", () => {
  for (const seed of [0, 42, 0xffffffff]) {
    expect(
      validGeneratedPlacement(
        generateWilderness("haunted-forest", seed).layout,
      ),
    ).toBe(true);
    const d = generateDungeon(seed);
    expect(validGeneratedPlacement(d.layout, d.zones)).toBe(true);
  }
});
it("rejects props outside floors, overlapping props, restricted/overlapping/outside-room zones", () => {
  const d = generateDungeon(42),
    layout = d.layout,
    zone = d.zones[0]!;
  const outside = {
    id: "outside",
    appearance: "test-only",
    position: { x: -100, y: -100 },
    radius: 1,
    blocking: true,
  };
  expect(
    validGeneratedPlacement({
      ...layout,
      map: { ...layout.map, objects: [outside] },
    }),
  ).toBe(false);
  const room = d.rooms.find((r) => r.id === zone.room)!;
  const prop = { ...outside, position: room.center, radius: 0.3 };
  expect(
    validGeneratedPlacement({
      ...layout,
      map: {
        ...layout.map,
        objects: [prop, { ...prop, id: "duplicate-position" }],
      },
    }),
  ).toBe(false);
  expect(
    validGeneratedPlacement(layout, [{ ...zone, position: layout.spawn }]),
  ).toBe(false);
  expect(
    validGeneratedPlacement(layout, [
      { ...zone, position: layout.exits[0]!.arrival },
    ]),
  ).toBe(false);
  expect(
    validGeneratedPlacement(layout, [zone, { ...zone, id: "overlap" }]),
  ).toBe(false);
  expect(
    validGeneratedPlacement(layout, [
      { ...zone, region: { x: 100, y: 100, width: 1, height: 1 } },
    ]),
  ).toBe(false);
});

it("rejects broken room metadata and blocked return anchors before runtime adoption", () => {
  const d = generateDungeon(42);
  expect(validDungeon({ ...d, corridors: d.corridors.slice(1) })).toBe(false);
  expect(
    validDungeon({ ...d, corridors: [...d.corridors, d.corridors[0]!] }),
  ).toBe(false);
  const exit = d.layout.exits[0]!;
  expect(
    validGeneratedPlacement({
      ...d.layout,
      map: {
        ...d.layout.map,
        objects: [
          {
            id: "exit-blocker",
            appearance: "test-only",
            position: exit.trigger,
            radius: 0.4,
            blocking: true,
          },
        ],
      },
    }),
  ).toBe(false);
});

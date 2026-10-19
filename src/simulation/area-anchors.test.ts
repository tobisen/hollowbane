import { expect, it } from "vitest";
import { exitNear, validAreaLayout, type AreaLayout } from "./area-anchors";
export function campLayout(): AreaLayout {
  return {
    map: {
      area: "ashen-refuge",
      seed: 1,
      terrain: {
        width: 8,
        height: 6,
        cellSize: 1,
        origin: { x: 0, y: 0 },
        cells: Array.from({ length: 48 }, () => "ground" as const),
      },
      objects: [],
    },
    spawn: { x: 2.5, y: 2.5 },
    exits: [
      { id: "forest", trigger: { x: 6.5, y: 2.5 }, arrival: { x: 5, y: 2.5 } },
    ],
  };
}
it("requires clear spawns and exact registered exit/arrival names", () => {
  const layout = campLayout();
  expect(validAreaLayout(layout)).toBe(true);
  expect(validAreaLayout({ ...layout, exits: [] })).toBe(false);
  expect(
    validAreaLayout({ ...layout, exits: [...layout.exits, ...layout.exits] }),
  ).toBe(false);
  expect(
    validAreaLayout({
      ...layout,
      exits: [{ ...layout.exits[0]!, id: "unknown" }],
    }),
  ).toBe(false);
  expect(validAreaLayout({ ...layout, spawn: { x: -1, y: 0 } })).toBe(false);
  expect(
    validAreaLayout({
      ...layout,
      map: {
        ...layout.map,
        objects: [
          {
            id: "block",
            appearance: "test",
            position: layout.spawn,
            radius: 0.4,
            blocking: true,
          },
        ],
      },
    }),
  ).toBe(false);
});
it("keeps arrivals outside exit zones and only offers nearby interaction", () => {
  const layout = campLayout();
  expect(exitNear(layout, layout.spawn)).toBeNull();
  expect(exitNear(layout, layout.exits[0]!.trigger)?.id).toBe("forest");
  expect(validAreaLayout({ ...layout, spawn: layout.exits[0]!.trigger })).toBe(
    false,
  );
  expect(
    validAreaLayout({
      ...layout,
      exits: [{ ...layout.exits[0]!, arrival: layout.exits[0]!.trigger }],
    }),
  ).toBe(false);
});

import { expect, it } from "vitest";
import {
  MODULE_PORTS,
  MODULE_SIZE,
  WILDERNESS_MODULES,
  moduleChoice,
  stampModule,
  validWildernessModule,
} from "./wilderness-modules";
import { areaWalkable, type AreaMap } from "./area-map";
it("defines original reusable masks and rotates the same collision footprints", () => {
  expect(new Set(WILDERNESS_MODULES.map((m) => m.kind)).size).toBe(5);
  for (const module of WILDERNESS_MODULES)
    for (let rotation = 0; rotation < 4; rotation++) {
      expect(validWildernessModule(module)).toBe(true);
      const stamp = stampModule(module, rotation, MODULE_PORTS);
      const map: AreaMap = {
        area: "haunted-forest",
        seed: 0,
        terrain: {
          width: MODULE_SIZE,
          height: MODULE_SIZE,
          cellSize: 1,
          origin: { x: 0, y: 0 },
          cells: stamp.cells,
        },
        objects: stamp.objects.map((o, i) => ({ ...o, id: String(i) })),
      };
      for (const p of [
        { x: 3.5, y: 0.5 },
        { x: 6.5, y: 3.5 },
        { x: 3.5, y: 6.5 },
        { x: 0.5, y: 3.5 },
        { x: 3.5, y: 3.5 },
      ])
        expect(areaWalkable(map, p, 0.2)).toBe(true);
      for (const o of map.objects)
        expect(areaWalkable(map, o.position, 0.2)).toBe(false);
    }
});
it("selects modules/rotations reproducibly without consuming a shared stream", () => {
  const seeds = [0, 1, 2, 42, 100, 0xffffffff];
  const picks = seeds.map((seed) => moduleChoice(seed));
  expect(seeds.map((seed) => moduleChoice(seed))).toEqual(picks);
  expect(
    new Set(picks.map((p) => p.module.id + p.rotation)).size,
  ).toBeGreaterThan(3);
  expect(() => moduleChoice(-1)).toThrow();
  expect(() => moduleChoice(1, [])).toThrow();
  expect(
    validWildernessModule({ ...WILDERNESS_MODULES[0]!, rows: ["."] }),
  ).toBe(false);
});

import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import {
  cropEquipmentRgba,
  packEquipmentRasters,
  equipmentFrame,
} from "../scripts/warrior-equipment-packing.mjs";

describe("equipment alpha packing", () => {
  it("round-trips visible pixels and translates an idle alias without copying its atlas pixels", () => {
    const pixels = Buffer.alloc(8 * 8 * 4);
    pixels.set([120, 32, 4, 255], (3 * 8 + 2) * 4);
    pixels.set([40, 90, 121, 64], (4 * 8 + 4) * 4);
    pixels.set([255, 255, 255, 4], (3 * 8 + 3) * 4);
    const original = Buffer.from(pixels);
    const raster = cropEquipmentRgba(pixels, 8, 8);
    const atlas = packEquipmentRasters([{ ...raster, name: "idle" }], 16);
    const placement = atlas.placements.idle!;
    const idle = equipmentFrame(raster, placement, [8, 8]);
    const alias = equipmentFrame(raster, placement, [12, 16], [2, 5]);
    expect(alias.frame).toEqual(idle.frame);
    expect(alias.spriteSourceSize).toEqual({ x: 4, y: 8, w: 3, h: 2 });
    const restored = Buffer.alloc(12 * 16 * 4);
    for (let y = 0; y < alias.frame.h; y++)
      for (let x = 0; x < alias.frame.w; x++) {
        const from =
          ((alias.frame.y + y) * atlas.width + alias.frame.x + x) * 4;
        atlas.pixels.copy(
          restored,
          ((alias.spriteSourceSize.y + y) * 12 + alias.spriteSourceSize.x + x) *
            4,
          from,
          from + 4,
        );
      }
    expect([
      ...restored.subarray((8 * 12 + 4) * 4, (8 * 12 + 4) * 4 + 4),
    ]).toEqual([120, 32, 4, 255]);
    expect([
      ...restored.subarray((9 * 12 + 6) * 4, (9 * 12 + 6) * 4 + 4),
    ]).toEqual([40, 90, 121, 64]);
    expect(restored[(8 * 12 + 5) * 4 + 3]).toBe(0);
    expect(pixels).toEqual(original);
  });

  it("keeps a fully occluded shield transparent and rejects duplicate or oversized atlases", () => {
    const empty = cropEquipmentRgba(Buffer.alloc(64), 4, 4);
    expect(empty.width).toBe(1);
    expect(empty.pixels).toEqual(Buffer.alloc(4));
    expect(() =>
      packEquipmentRasters([
        { ...empty, name: "same" },
        { ...empty, name: "same" },
      ]),
    ).toThrow("Duplicate");
    const full = cropEquipmentRgba(Buffer.alloc(8 * 8 * 4, 255), 8, 8);
    expect(() =>
      packEquipmentRasters([{ ...full, name: "too-big" }], 8),
    ).toThrow("exceeds");
    expect(() => equipmentFrame(full, { x: 0, y: 0 }, [8, 8], [1, 0])).toThrow(
      "outside",
    );
  });
});

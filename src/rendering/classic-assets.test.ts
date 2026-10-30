import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
import manifest from "../../public/dev/classic-visual/environment.json";

describe("classic environment pilot", () => {
  it("retains source identity, bounded payloads and transparent sprite margins", async () => {
    let bytes = 0,
      decoded = 0;
    for (const record of manifest.records) {
      const png = await readFile(
        `public/dev/classic-visual/${record.name}.png`,
      );
      const original = await readFile(
        `assets/source/classic-visual/${record.name}.png`,
      );
      expect(createHash("sha256").update(png).digest("hex")).toBe(
        record.sha256,
      );
      expect(createHash("sha256").update(original).digest("hex")).toBe(
        record.sourceSha256,
      );
      const { data, info } = await sharp(png)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      expect([info.width, info.height]).toEqual([record.width, record.height]);
      expect(png.length).toBe(record.pngBytes);
      expect(data.length).toBe(record.decodedRgbaBytes);
      bytes += png.length;
      decoded += data.length;
      for (let y = 0; y < info.height; y++)
        for (let x = 0; x < info.width; x++) {
          if (
            record.name !== "earth" &&
            (x < 10 || y < 10 || x >= info.width - 10 || y >= info.height - 10)
          )
            expect(data[(y * info.width + x) * 4 + 3]).toBe(0);
          if (record.name === "earth" && (x === 0 || y === 0)) {
            const mirror =
              x === 0
                ? (y * info.width + info.width - 1) * 4
                : ((info.height - 1) * info.width + x) * 4;
            expect(
              data.subarray(
                (y * info.width + x) * 4,
                (y * info.width + x) * 4 + 4,
              ),
            ).toEqual(data.subarray(mirror, mirror + 4));
          }
        }
    }
    expect(bytes).toBeLessThan(600000);
    expect(decoded).toBe(1572864);
  });
});

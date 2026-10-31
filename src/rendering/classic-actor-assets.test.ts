import { expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import sharp from "sharp";
import manifest from "../../public/dev/classic-visual/actors.json";
import { CLASSIC_SAMPLES } from "./classic-actor-frame";

it("keeps the bounded atlas set complete, source-identified and contained without frame fitting", async () => {
  const hash = (bytes: Uint8Array) =>
    createHash("sha256").update(bytes).digest("hex");
  expect(manifest.samples).toEqual(CLASSIC_SAMPLES);
  expect(manifest.frames).toHaveLength(312);
  expect(new Set(manifest.frames.map((f) => f.name)).size).toBe(312);
  for (const [path, sha] of Object.entries(manifest.sources))
    expect(hash(await readFile(path))).toBe(sha);
  expect(hash(await readFile("scripts/render-classic-actors.py"))).toBe(
    manifest.rendererSha256,
  );
  let decoded = 0,
    transfer = 0;
  for (const atlas of manifest.atlases) {
    const png = await readFile(`public/dev/classic-visual/${atlas.file}`);
    expect(hash(png)).toBe(atlas.sha256);
    expect(png.length).toBe(atlas.pngBytes);
    const { data, info } = await sharp(png)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect([info.width, info.height, data.length]).toEqual([
      atlas.width,
      atlas.height,
      atlas.decodedRgbaBytes,
    ]);
    decoded += data.length;
    transfer += png.length;
    const frames = manifest.frames.filter((f) => f.kind === atlas.kind);
    expect(frames).toHaveLength(104);
    for (const view of ["se", "sw", "nw", "ne"])
      for (const [clip, samples] of Object.entries(CLASSIC_SAMPLES))
        for (const frame of samples)
          expect(
            frames.some(
              (f) => f.view === view && f.action === clip && f.index === frame,
            ),
          ).toBe(true);
    for (const frame of frames) {
      expect(frame.root).toEqual(manifest.root);
      const pixels = Buffer.alloc(frame.width * frame.height * 4);
      for (let y = 0; y < frame.height; y++)
        data.copy(
          pixels,
          y * frame.width * 4,
          ((frame.y + y) * atlas.width + frame.x) * 4,
          ((frame.y + y) * atlas.width + frame.x + frame.width) * 4,
        );
      expect(hash(pixels)).toBe(frame.pixelSha256);
      let opaqueBorderPixels = 0;
      for (let y = 0; y < frame.height; y++)
        for (let x = 0; x < frame.width; x++)
          if (x < 4 || y < 4 || x >= frame.width - 4 || y >= frame.height - 4)
            if (pixels[(y * frame.width + x) * 4 + 3] !== 0)
              opaqueBorderPixels++;
      expect(opaqueBorderPixels, frame.name).toBe(0);
    }
  }
  expect(decoded).toBeLessThan(42 * 1024 * 1024);
  expect(transfer).toBeLessThan(6_000_000);
});

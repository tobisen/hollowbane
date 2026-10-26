import sharp from "sharp";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { Buffer } from "node:buffer";
import { format } from "prettier";

const input = process.argv[2];
if (!input) throw Error("Pass the complete eight-direction reaction renders");
const output = "public/dev/warrior-reactions";
const movement = JSON.parse(
  await readFile("public/dev/warrior-directions/warrior.json", "utf8"),
);
const hash = (v) => createHash("sha256").update(v).digest("hex");
const sourceFiles = {
  rendererSha256: "assets/source/q3/warrior-reactions/render.py",
  packagerSha256: "scripts/package-warrior-reactions.mjs",
  rigSha256: "assets/source/q3/warrior-rig-v2/warrior.blend",
  movementManifestSha256: "public/dev/warrior-directions/warrior.json",
};
const provenance = Object.fromEntries(
  await Promise.all(
    Object.entries(sourceFiles).map(async ([key, path]) => [
      key,
      hash(await readFile(path)),
    ]),
  ),
);
const width = 960,
  height = 640,
  cell = 320;
await mkdir(output, { recursive: true });
const views = {};
const clips = { hit: { start: 0, count: 6, loop: false } };
for (const direction of movement.directions) {
  const rig = JSON.parse(
    await readFile(join(input, direction, "rig.json"), "utf8"),
  );
  if (
    rig.frames.length !== 6 ||
    rig.cell !== cell ||
    rig.renderSize !== 640 ||
    rig.direction !== direction ||
    rig.rendererSha256 !== provenance.rendererSha256 ||
    rig.sourceRigSha256 !== provenance.rigSha256 ||
    JSON.stringify(rig.clips) !== JSON.stringify(clips)
  )
    throw Error(`Unexpected or stale reaction source ${direction}`);
  const atlas = Buffer.alloc(width * height * 4),
    frames = [];
  for (const [i, original] of rig.frames.entries()) {
    let pixels;
    if (i === 5) {
      const idle = await sharp(`public/dev/warrior-directions/${direction}.png`)
        .extract({ left: 0, top: 0, width: 256, height: 256 })
        .raw()
        .toBuffer();
      pixels = Buffer.alloc(cell * cell * 4);
      for (let row = 0; row < 256; row++)
        idle.copy(
          pixels,
          ((row + 64) * cell + 32) * 4,
          row * 256 * 4,
          (row + 1) * 256 * 4,
        );
    } else {
      const path = join(input, direction, `${original.name}.png`),
        metadata = await sharp(path).metadata();
      if (
        metadata.width !== 640 ||
        metadata.height !== 640 ||
        !metadata.hasAlpha
      )
        throw Error(`Invalid render ${path}`);
      pixels = await sharp(path)
        .resize(cell, cell)
        .ensureAlpha()
        .raw()
        .toBuffer();
      for (let at = 0; at < pixels.length; at += 4)
        if (pixels[at + 3] <= 4) pixels.fill(0, at, at + 4);
    }
    const x = (i % 3) * cell,
      y = Math.floor(i / 3) * cell;
    for (let row = 0; row < cell; row++)
      pixels.copy(
        atlas,
        ((y + row) * width + x) * 4,
        row * cell * 4,
        (row + 1) * cell * 4,
      );
    frames.push({
      ...original,
      x,
      y,
      width: cell,
      height: cell,
      pixelSha256: hash(pixels),
    });
  }
  const png = await sharp(atlas, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  await writeFile(join(output, `${direction}.png`), png);
  views[direction] = {
    atlas: `${direction}.png`,
    atlasSha256: hash(png),
    bytes: png.length,
    decodedBytes: atlas.length,
    rotationDegrees: rig.rotationDegrees,
    mirrored: false,
    facing: movement.views[direction].facing,
    frames,
  };
}
await writeFile(
  join(output, "warrior.json"),
  await format(
    JSON.stringify({
      version: 1,
      blender: "4.5.3 LTS",
      cell,
      columns: 3,
      rows: 2,
      root: [160, 274],
      displayScale: 0.5,
      clips,
      directions: movement.directions,
      frames: 48,
      views,
      productionApproved: false,
      provenance,
    }),
    { parser: "json" },
  ),
);
console.log("Packed 8 reaction clips / 48 poses; live graphics unchanged");

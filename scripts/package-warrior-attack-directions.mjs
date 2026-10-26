import sharp from "sharp";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { Buffer } from "node:buffer";
import { format } from "prettier";

const input = process.argv[2];
if (!input)
  throw Error("Pass the complete directional attack render directory");
const output = "public/dev/warrior-attack-directions";
const approved = JSON.parse(
  await readFile("public/dev/warrior-combat/warrior.json", "utf8"),
);
const movement = JSON.parse(
  await readFile("public/dev/warrior-directions/warrior.json", "utf8"),
);
const directions = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];
const hash = (v) => createHash("sha256").update(v).digest("hex");
const rendererSha256 = hash(
  await readFile("assets/source/q3/warrior-attack-directions/render.py"),
);
const width = 1920,
  height = 1280,
  cell = 320;
await mkdir(output, { recursive: true });
const views = {};
for (const direction of directions) {
  const rig =
    direction === "se"
      ? approved
      : JSON.parse(await readFile(join(input, direction, "rig.json"), "utf8"));
  if (
    rig.frames.length !== 24 ||
    (direction !== "se" &&
      (rig.cell !== cell ||
        rig.renderSize !== 640 ||
        rig.direction !== direction ||
        rig.rendererSha256 !== rendererSha256 ||
        rig.sourceRigSha256 !== approved.provenance.rigSha256))
  )
    throw Error(`Unexpected or stale source ${direction}`);
  const atlas = Buffer.alloc(width * height * 4),
    frames = [];
  for (const [i, original] of rig.frames.entries()) {
    const endpoint = [0, 11, 12, 23].includes(i);
    let pixels;
    if (direction === "se" || endpoint) {
      const f =
        direction === "se" ? original : movement.views[direction].frames[0];
      const base = await sharp(
        direction === "se"
          ? "public/dev/warrior-combat/warrior.png"
          : `public/dev/warrior-directions/${direction}.png`,
      )
        .extract({ left: f.x, top: f.y, width: 256, height: 256 })
        .raw()
        .toBuffer();
      pixels = Buffer.alloc(cell * cell * 4);
      for (let row = 0; row < 256; row++)
        base.copy(
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
    const x = (i % 6) * cell,
      y = Math.floor(i / 6) * cell;
    for (let row = 0; row < cell; row++)
      pixels.copy(
        atlas,
        ((y + row) * width + x) * 4,
        row * cell * 4,
        (row + 1) * cell * 4,
      );
    frames.push({
      ...original,
      name: `${original.action}-${direction}-${String(original.index).padStart(2, "0")}`,
      root: direction === "se" ? [160, 274] : original.root,
      weaponBounds:
        direction === "se"
          ? original.weaponBounds.map((v, axis) => v + (axis % 2 ? 64 : 32))
          : original.weaponBounds,
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
    rotationDegrees: direction === "se" ? 0 : rig.rotationDegrees,
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
      blender: approved.blender,
      cell: 320,
      columns: 6,
      rows: 4,
      root: [160, 274],
      originalPixelOffset: [32, 64],
      displayScale: approved.displayScale,
      clips: approved.clips,
      directions,
      frames: 192,
      views,
      productionApproved: false,
      provenance: {
        rendererSha256,
        packagerSha256: hash(
          await readFile("scripts/package-warrior-attack-directions.mjs"),
        ),
        rigSha256: approved.provenance.rigSha256,
        southeastAtlasSha256: approved.atlasSha256,
        movementManifestSha256: hash(
          await readFile("public/dev/warrior-directions/warrior.json"),
        ),
      },
    }),
    { parser: "json" },
  ),
);
console.log(
  "Packed eight attack views / 192 frames, approved SE and idle endpoints preserved",
);

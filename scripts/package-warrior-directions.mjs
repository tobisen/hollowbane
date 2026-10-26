import sharp from "sharp";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { Buffer } from "node:buffer";
import { format } from "prettier";

const input = process.argv[2];
const directions = process.argv.slice(3);
if (
  !input ||
  !directions.length ||
  new Set(directions).size !== directions.length
)
  throw Error(
    "Pass render directory and unique directions: n e s w [ne se sw nw]",
  );
const output = "public/dev/warrior-directions";
const approved = JSON.parse(
  await readFile("public/dev/warrior-movement/warrior.json", "utf8"),
);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const width = 2048,
  height = 1320;
await mkdir(output, { recursive: true });
const views = {};
for (const direction of directions) {
  if (!["n", "ne", "e", "se", "s", "sw", "w", "nw"].includes(direction))
    throw Error(`Invalid direction ${direction}`);
  const rig =
    direction === "se"
      ? approved
      : JSON.parse(await readFile(join(input, direction, "rig.json"), "utf8"));
  if (
    rig.frames.length !== 40 ||
    rig.cell !== 256 ||
    (direction !== "se" &&
      (rig.renderSize !== 512 || rig.direction !== direction))
  )
    throw Error(`Unexpected render contract ${direction}`);
  const atlasPixels = Buffer.alloc(width * height * 4);
  const frames = [];
  for (const [i, frame] of rig.frames.entries()) {
    let pixels;
    if (direction === "se") {
      pixels = await sharp("public/dev/warrior-movement/warrior.png")
        .extract({ left: frame.x, top: frame.y, width: 256, height: 256 })
        .raw()
        .toBuffer();
    } else {
      const file = join(input, direction, `${frame.name}.png`);
      const meta = await sharp(file).metadata();
      if (meta.width !== 512 || meta.height !== 512 || !meta.hasAlpha)
        throw Error(`Invalid source ${frame.name}`);
      pixels = await sharp(file)
        .resize(256, 256)
        .ensureAlpha()
        .raw()
        .toBuffer();
      for (let at = 0; at < pixels.length; at += 4)
        if (pixels[at + 3] <= 4) pixels.fill(0, at, at + 4);
    }
    // A shared eight-row bottom extension; no scale, crop, fit or root shift.
    const cell = Buffer.alloc(256 * 264 * 4);
    pixels.copy(cell);
    const x = (i % 8) * 256,
      y = Math.floor(i / 8) * 264;
    for (let row = 0; row < 264; row++)
      cell.copy(
        atlasPixels,
        ((y + row) * width + x) * 4,
        row * 256 * 4,
        (row + 1) * 256 * 4,
      );
    frames.push({
      ...frame,
      x,
      y,
      width: 256,
      height: 264,
      pixelSha256: hash(cell),
    });
  }
  const png = await sharp(atlasPixels, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  await writeFile(join(output, `${direction}.png`), png);
  views[direction] = {
    atlas: `${direction}.png`,
    atlasSha256: hash(png),
    bytes: png.length,
    decodedBytes: atlasPixels.length,
    rotationDegrees: direction === "se" ? 0 : rig.rotationDegrees,
    mirrored: false,
    facing:
      direction === "se" ? [2 / Math.sqrt(5), 1 / Math.sqrt(5)] : rig.facing,
    frames,
  };
}
await writeFile(
  join(output, "warrior.json"),
  await format(
    JSON.stringify({
      version: 1,
      blender: approved.blender,
      cellWidth: 256,
      cellHeight: 264,
      columns: 8,
      rows: 5,
      root: approved.root,
      displayScale: approved.displayScale,
      orthoScale: approved.orthoScale,
      elevationDegrees: approved.elevationDegrees,
      clips: approved.clips,
      directions,
      frames: directions.length * 40,
      views,
      productionApproved: false,
      provenance: {
        rendererSha256: hash(
          await readFile("assets/source/q3/warrior-directions/render.py"),
        ),
        packagerSha256: hash(
          await readFile("scripts/package-warrior-directions.mjs"),
        ),
        rigSha256: approved.provenance.rigSha256,
        southeastAtlasSha256: approved.atlasSha256,
      },
    }),
    { parser: "json" },
  ),
);
console.log(
  `Packed ${directions.length} views / ${directions.length * 40} frames; root and scale unchanged`,
);

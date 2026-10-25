import sharp from "sharp";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { join } from "node:path";
import { format } from "prettier";
import { Buffer } from "node:buffer";

const input = process.argv[2];
if (!input) throw Error("Pass the complete Blender render directory");
const source = "assets/source/q3/warrior-rig-v1";
const output = "public/dev/warrior-pilot";
const rig = JSON.parse(await readFile(join(input, "rig.json"), "utf8"));
if (rig.frames.length !== 24 || rig.cell !== 256 || rig.renderSize !== 512)
  throw Error("Unexpected render contract");
await mkdir(output, { recursive: true });
const atlasPixels = Buffer.alloc(1536 * 1024 * 4);
const frames = [];
for (const [index, frame] of rig.frames.entries()) {
  const path = join(input, `${frame.name}.png`);
  const metadata = await sharp(path).metadata();
  if (metadata.width !== 512 || metadata.height !== 512 || !metadata.hasAlpha)
    throw Error(`Invalid source frame ${frame.name}`);
  // One shared 2:1 supersample reduction. No trimming, fitting or per-pose shifts.
  const pixels = await sharp(path)
    .resize(256, 256)
    .ensureAlpha()
    .raw()
    .toBuffer();
  // Remove only <=4/255 resampling ringing; keep antialiased edges above it.
  // Fully transparent RGB must be black; never matte against a background.
  for (let i = 0; i < pixels.length; i += 4)
    if (pixels[i + 3] <= 4) pixels.fill(0, i, i + 4);
  const x = (index % 6) * 256,
    y = Math.floor(index / 6) * 256;
  for (let row = 0; row < 256; row++)
    pixels.copy(
      atlasPixels,
      ((y + row) * 1536 + x) * 4,
      row * 256 * 4,
      (row + 1) * 256 * 4,
    );
  frames.push({
    ...frame,
    x,
    y,
    width: 256,
    height: 256,
    pixelSha256: createHash("sha256").update(pixels).digest("hex"),
  });
}
const atlas = await sharp(atlasPixels, {
  raw: { width: 1536, height: 1024, channels: 4 },
})
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toBuffer();
await writeFile(join(output, "warrior.png"), atlas);
await writeFile(
  join(output, "warrior.json"),
  await format(
    JSON.stringify({
      ...rig,
      renderSize: undefined,
      columns: 6,
      rows: 4,
      atlas: "warrior.png",
      atlasSha256: createHash("sha256").update(atlas).digest("hex"),
      bytes: atlas.length,
      decodedBytes: 1536 * 1024 * 4,
      clips: {
        idle: { start: 0, count: 8, fps: 6 },
        walk: { start: 8, count: 16, fps: 18 },
      },
      frames,
      productionApproved: false,
      scope: "isolated developer pilot; southeast idle/walk only",
      provenance: {
        producerSha256: createHash("sha256")
          .update(await readFile(join(source, "warrior.py")))
          .digest("hex"),
        rigSha256: createHash("sha256")
          .update(await readFile(join(input, "warrior.blend")))
          .digest("hex"),
        referenceSha256: createHash("sha256")
          .update(await readFile("public/assets/menu-warrior-v1.webp"))
          .digest("hex"),
      },
    }),
    { parser: "json" },
  ),
);
await copyFile(join(input, "warrior.blend"), join(source, "warrior.blend"));
console.log(
  `Packed 24 fixed-window frames: ${atlas.length} bytes; 6 MiB decoded`,
);

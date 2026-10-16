import sharp from "sharp";
import { writeFile } from "node:fs/promises";
const frames = [];
async function boundedFrame(source, region, size, height) {
  const { data, info } = await sharp(source)
    .extract(region)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let left = info.width,
    top = info.height,
    right = -1,
    bottom = -1;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 24) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
  if (right < left) throw new Error("Empty sprite cell");
  const width = right - left + 1,
    h = bottom - top + 1;
  const scale = Math.min((size - 24) / width, height / h);
  const w = Math.round(width * scale),
    outHeight = Math.round(h * scale);
  const image = await sharp(source)
    .extract({
      left: region.left + left,
      top: region.top + top,
      width,
      height: h,
    })
    .resize(w, outHeight)
    .png()
    .toBuffer();
  return {
    input: image,
    left: Math.round((size - w) / 2),
    top: size - 16 - outHeight,
    bounds: { left, top, width, height: h },
  };
}
const heroSource = "assets/source/wanderer.png";
const metadata = await sharp(heroSource).metadata();
const hero = [];
for (let row = 0; row < 8; row++)
  for (let col = 0; col < 8; col++) {
    const x = Math.round((col * metadata.width) / 8),
      y = Math.round((row * metadata.height) / 8);
    const frame = await boundedFrame(
      heroSource,
      {
        left: x,
        top: y,
        width: Math.round(((col + 1) * metadata.width) / 8) - x,
        height: Math.round(((row + 1) * metadata.height) / 8) - y,
      },
      128,
      100,
    );
    frames.push({
      index: row * 8 + col,
      direction: row,
      action: col < 2 ? "idle" : "walk",
      pivot: { x: 64, y: 112 },
      sourceBounds: frame.bounds,
    });
    hero.push({
      input: frame.input,
      left: col * 128 + frame.left,
      top: row * 128 + frame.top,
    });
  }
await sharp({
  create: { width: 1024, height: 1024, channels: 4, background: "#00000000" },
})
  .composite(hero)
  .webp({ lossless: true, effort: 6 })
  .toFile("public/assets/wanderer.webp");
const propSource = "assets/source/props.png";
const props = [];
const regions = [
  { left: 0, top: 0, width: 627, height: 735 },
  { left: 627, top: 0, width: 627, height: 735 },
  { left: 0, top: 735, width: 627, height: 519 },
  { left: 727, top: 735, width: 527, height: 519 },
];
for (const [index, region] of regions.entries()) {
  const frame = await boundedFrame(propSource, region, 512, 450);
  props.push({
    input: frame.input,
    left: (index % 2) * 512 + frame.left,
    top: Math.floor(index / 2) * 512 + frame.top,
  });
}
await sharp({
  create: { width: 1024, height: 1024, channels: 4, background: "#00000000" },
})
  .composite(props)
  .webp({ lossless: true, effort: 6 })
  .toFile("public/assets/props.webp");
await writeFile(
  "public/assets/sprites.json",
  JSON.stringify(
    {
      version: 1,
      hero: {
        columns: 8,
        rows: 8,
        cell: 128,
        frames,
        pivot: { x: 64, y: 112 },
      },
      props: {
        columns: 2,
        rows: 2,
        cell: 512,
        pivot: { x: 256, y: 496 },
        names: ["cenotaph", "tree", "sarcophagus", "lantern"],
      },
    },
    null,
    2,
  ) + "\n",
);
console.log("Exported 64 normalized character frames and 4 anchored props.");

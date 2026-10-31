import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { Buffer } from "node:buffer";
const input = process.argv[2];
assert(input, "Pass rendered pilot directory");
const output = "public/dev/classic-visual";
const meta = JSON.parse(await readFile(`${input}/actors.json`, "utf8"));
assert.equal(meta.frames.length, 312);
assert.equal(meta.width % 2, 0);
assert.equal(meta.height % 2, 0);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
for (const [path, sha] of Object.entries(meta.sources))
  assert.equal(hash(await readFile(path)), sha);
const contentWidth = meta.width / 2,
  contentHeight = meta.height / 2,
  pad = 2;
const width = contentWidth + pad * 2,
  height = contentHeight + pad * 2,
  root = meta.root.map((v) => v / 2 + pad);
const atlases = [],
  frames = [];
for (const kind of ["warrior", "raider", "runner"]) {
  const selected = meta.frames.filter((f) => f.kind === kind);
  assert.equal(selected.length, 104);
  const columns = 8,
    rows = 13,
    aw = width * columns,
    ah = height * rows,
    pixels = Buffer.alloc(aw * ah * 4);
  for (const [index, frame] of selected.entries()) {
    const raw = await readFile(`${input}/${frame.name}.png`);
    assert.equal(hash(raw), frame.sha256);
    const rawMeta = await sharp(raw).metadata();
    assert.equal(rawMeta.width, meta.width * 2);
    assert.equal(rawMeta.height, meta.height * 2);
    const rgba = await sharp(raw)
      .resize(contentWidth, contentHeight, { kernel: "lanczos3" })
      .extend({
        top: pad,
        bottom: pad,
        left: pad,
        right: pad,
        background: "#00000000",
      })
      .ensureAlpha()
      .raw()
      .toBuffer();
    let minX = width,
      minY = height,
      maxX = 0,
      maxY = 0,
      count = 0;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const p = (y * width + x) * 4;
        if (rgba[p + 3] <= 2) rgba.fill(0, p, p + 4);
        else {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
          count++;
        }
      }
    const margin = Math.min(minX, minY, width - 1 - maxX, height - 1 - maxY);
    assert(count > 100 && margin >= 4, `${frame.name}: alpha margin ${margin}`);
    const x = (index % columns) * width,
      y = Math.floor(index / columns) * height;
    for (let row = 0; row < height; row++)
      rgba.copy(
        pixels,
        ((y + row) * aw + x) * 4,
        row * width * 4,
        (row + 1) * width * 4,
      );
    frames.push({
      ...frame,
      x,
      y,
      width,
      height,
      root,
      alphaBounds: [minX, minY, maxX, maxY],
      alphaMargin: margin,
      pixelSha256: hash(rgba),
    });
  }
  const png = await sharp(pixels, {
    raw: { width: aw, height: ah, channels: 4 },
  })
    .png()
    .toBuffer();
  assert(png.length < 2_000_000, "Bounded actor transfer budget");
  const decoded = await sharp(png).raw().toBuffer();
  assert.equal(hash(decoded), hash(pixels), "RGBA roundtrip");
  await writeFile(`${output}/${kind}.png`, png);
  atlases.push({
    kind,
    file: `${kind}.png`,
    width: aw,
    height: ah,
    pngBytes: png.length,
    decodedRgbaBytes: pixels.length,
    sha256: hash(png),
  });
}
assert(
  atlases.reduce((sum, a) => sum + a.decodedRgbaBytes, 0) < 42 * 1024 * 1024,
);
await writeFile(
  `${output}/actors.json`,
  JSON.stringify(
    {
      version: 1,
      scope: meta.scope,
      elevation: meta.elevation,
      samples: meta.samples,
      sources: meta.sources,
      rendererSha256: hash(await readFile("scripts/render-classic-actors.py")),
      root,
      cell: { width, height },
      atlases,
      frames,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    atlases,
    frames: frames.length,
    minimumAlphaMargin: Math.min(...frames.map((f) => f.alphaMargin)),
  }),
);

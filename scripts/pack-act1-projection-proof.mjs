// Diagnostic atlas only. Common rectangular cells preserve source roots and scale.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, relative, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Buffer } from "node:buffer";
import sharp from "sharp";

const input = resolve(process.argv[2] ?? "");
const output = resolve(process.argv[3] ?? "");
const root = fileURLToPath(new URL("../", import.meta.url));
const allStates = process.argv[4] === "--all-states";
assert(
  process.argv.length === (allStates ? 5 : 4),
  "Pass audited render directory, output directory and optional --all-states",
);
assert(
  relative(root, output).startsWith("..") ||
    (allStates && output === resolve(root, "public/dev/act1-projection-proof")),
  "Keep proof artifacts outside the repository",
);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const reportBytes = await readFile(
  join(input, allStates ? "proof.json" : "projection.json"),
);
const report = JSON.parse(reportBytes);
const window = report.window;
assert(window && window.supersample === 2 && window.displayScale === 0.5);
assert(
  allStates
    ? report.rendered && report.frames.length === 86
    : report.variants.length === 2,
);
const { width, height } = window;
assert(Number.isSafeInteger(width) && Number.isSafeInteger(height));
assert(width > 0 && height > 0 && width <= 1024 && height <= 1024);
const entries = allStates
  ? report.frames.map((frame) => ({ ...frame, file: `${frame.name}.png` }))
  : report.variants.flatMap((variant) => {
      assert(
        variant.poses.length === 320 &&
          variant.posesOutsidePaddedWindow.length === 0,
      );
      return variant.renders.map((frame) => ({
        ...frame,
        variant: variant.name,
      }));
    });
assert(
  entries.length > 0 && entries.length <= (allStates ? 86 : 24),
  "Bounded extreme-pose proof only",
);
assert(new Set(entries.map((f) => f.file)).size === entries.length);
const columns = Math.min(allStates ? 8 : 4, entries.length);
const rows = Math.ceil(entries.length / columns);
const atlasWidth = width * columns;
const atlasHeight = height * rows;
const atlasPixels = Buffer.alloc(atlasWidth * atlasHeight * 4);
const frames = [];
for (const [index, entry] of entries.entries()) {
  assert(/^[a-z0-9-]+\.png$/.test(entry.file));
  const bytes = await readFile(join(input, entry.file));
  assert.equal(hash(bytes), entry.sha256, "Audited source image identity");
  const meta = await sharp(bytes).metadata();
  assert(
    meta.width === width * 2 && meta.height === height * 2 && meta.hasAlpha,
  );
  const pixels = await sharp(bytes)
    .resize(width, height, { kernel: "lanczos3" })
    .ensureAlpha()
    .raw()
    .toBuffer();
  let margin = Math.max(width, height);
  let opaque = 0;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const at = (y * width + x) * 4;
      if (pixels[at + 3] <= 4) pixels.fill(0, at, at + 4);
      else {
        opaque++;
        margin = Math.min(margin, x, y, width - 1 - x, height - 1 - y);
      }
    }
  assert(
    opaque > 0 && margin >= window.filterApron,
    `Contained filtered alpha: ${entry.file}`,
  );
  const x = (index % columns) * width;
  const y = Math.floor(index / columns) * height;
  for (let row = 0; row < height; row++)
    pixels.copy(
      atlasPixels,
      ((y + row) * atlasWidth + x) * 4,
      row * width * 4,
      (row + 1) * width * 4,
    );
  frames.push({
    name: entry.file.replace(/\.png$/, ""),
    ...(allStates ? { set: entry.set, frame: entry.frame } : {}),
    x,
    y,
    width,
    height,
    root: window.root,
    sourceSha256: entry.sha256,
    pixelSha256: hash(pixels),
    minimumAlphaMargin: margin,
    trimmed: false,
    rotated: false,
  });
}
const png = await sharp(atlasPixels, {
  raw: { width: atlasWidth, height: atlasHeight, channels: 4 },
})
  .png({ compressionLevel: 9 })
  .toBuffer();
for (const frame of frames) {
  const extracted = await sharp(png)
    .extract({ left: frame.x, top: frame.y, width, height })
    .raw()
    .toBuffer();
  assert.equal(hash(extracted), frame.pixelSha256, "Encoded atlas round trip");
}
await mkdir(output, { recursive: true });
await writeFile(join(output, "proof.png"), png);
await writeFile(
  join(output, "proof.json"),
  JSON.stringify(
    {
      version: 1,
      scope: allStates
        ? "bounded southeast all-state projection proof; not campaign art"
        : "diagnostic extrema; not a playable animation set",
      productionApproved: false,
      projectionReportSha256: hash(reportBytes),
      sourceSha256: report.sourceSha256,
      ...(allStates
        ? { sources: report.sources, elevationDegrees: report.elevationDegrees }
        : {}),
      window,
      atlas: "proof.png",
      atlasSha256: hash(png),
      columns,
      rows,
      atlasWidth,
      atlasHeight,
      bytes: png.length,
      decodedBytes: atlasPixels.length,
      clips: report.clips,
      frames,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    frames: frames.length,
    window,
    minimumAlphaMargin: Math.min(...frames.map((f) => f.minimumAlphaMargin)),
    bytes: png.length,
    decodedBytes: atlasPixels.length,
  }),
);

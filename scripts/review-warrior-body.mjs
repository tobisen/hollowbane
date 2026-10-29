/** Offline pixel/patch review of the bounded Blender body probe. No public writes. */
import sharp from "sharp";
import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, relative } from "node:path";

const directory = resolve(process.argv[2] ?? "");
if (!process.argv[2] || !relative(process.cwd(), directory).startsWith(".."))
  throw Error("Pass a diagnostic directory outside the repository");
const proof = JSON.parse(
  await readFile(resolve(directory, "body.json"), "utf8"),
);
if (proof.rasterPairs !== proof.samples.length || proof.rasterPairs > 12)
  throw Error("Expected a bounded rendered proof");
const hash = (buffer) => createHash("sha256").update(buffer).digest("hex");
const folders = {
  movement: "warrior-directions",
  attacks: "warrior-attack-directions",
  abilities: "warrior-abilities",
  hit: "warrior-reactions",
  death: "warrior-death",
};
const compare = (a, b, width) => {
  let changed = 0,
    above4 = 0,
    above16 = 0,
    max = 0,
    maxAlphaDelta = 0,
    maxPremultipliedRgbDelta = 0,
    premultipliedRgbAbove4 = 0;
  const bounds = [Infinity, Infinity, -1, -1];
  for (let at = 0; at < a.length; at += 4) {
    const delta = Math.max(
      ...[0, 1, 2, 3].map((c) => Math.abs(a[at + c] - b[at + c])),
    );
    maxAlphaDelta = Math.max(maxAlphaDelta, Math.abs(a[at + 3] - b[at + 3]));
    const visibleDelta = Math.max(
      ...[0, 1, 2].map(
        (c) => Math.abs(a[at + c] * a[at + 3] - b[at + c] * b[at + 3]) / 255,
      ),
    );
    maxPremultipliedRgbDelta = Math.max(maxPremultipliedRgbDelta, visibleDelta);
    if (visibleDelta > 4) premultipliedRgbAbove4++;
    if (delta) changed++;
    if (delta > 4) above4++;
    if (delta > 16) {
      above16++;
      const x = (at / 4) % width,
        y = Math.floor(at / 4 / width);
      bounds[0] = Math.min(bounds[0], x);
      bounds[1] = Math.min(bounds[1], y);
      bounds[2] = Math.max(bounds[2], x);
      bounds[3] = Math.max(bounds[3], y);
    }
    max = Math.max(max, delta);
  }
  return {
    changedPixels: changed,
    above4,
    above16,
    maxChannelDelta: max,
    maxAlphaDelta,
    maxPremultipliedRgbDelta,
    premultipliedRgbAbove4,
    above16Bounds: above16 ? bounds : null,
  };
};
const reports = [],
  rows = [],
  lightRows = [];
for (const sample of proof.samples) {
  const folder = `public/dev/${folders[sample.group]}`,
    manifest = JSON.parse(await readFile(`${folder}/warrior.json`, "utf8")),
    view = manifest.views[sample.direction],
    frame = view.frames[sample.ordinal],
    width = frame.width,
    height = frame.height;
  if (
    frame.name !== sample.name ||
    frame.pixelSha256 !== sample.frame.pixelSha256
  )
    throw Error(`Changed frame contract: ${sample.name}`);
  const atlas = await readFile(`${folder}/${view.atlas}`);
  if (hash(atlas) !== view.atlasSha256)
    throw Error(`Changed approved atlas: ${folder}`);
  const approved = await sharp(atlas)
    .extract({ left: frame.x, top: frame.y, width, height })
    .ensureAlpha()
    .raw()
    .toBuffer();
  if (hash(approved) !== frame.pixelSha256)
    throw Error(`Invalid approved frame: ${sample.name}`);
  const pixels = {};
  for (const variant of ["reference", "clean"]) {
    const input = await readFile(
      resolve(directory, `${sample.name}-${variant}.png`),
    );
    const expected = sample[`${variant}Sha256`];
    if (hash(input) !== expected)
      throw Error(`Changed diagnostic render: ${sample.name}`);
    const metadata = await sharp(input).metadata();
    if (
      metadata.width !== sample.renderSize[0] ||
      metadata.height !== sample.renderSize[1]
    )
      throw Error(`Invalid source dimensions: ${sample.name}`);
    const square = await sharp(input)
      .resize(width, width)
      .ensureAlpha()
      .raw()
      .toBuffer();
    for (let at = 0; at < square.length; at += 4)
      if (square[at + 3] <= 4) square.fill(0, at, at + 4);
    pixels[variant] = Buffer.alloc(width * height * 4);
    square.copy(pixels[variant]);
  }
  const [x0, y0, x1, y1] = frame.weaponBounds,
    left = Math.max(0, Math.floor(x0) - 6),
    top = Math.max(0, Math.floor(y0) - 6),
    right = Math.min(width, Math.ceil(x1) + 6),
    bottom = Math.min(height, Math.ceil(y1) + 6),
    candidate = Buffer.from(approved);
  // Direct replacement includes transparent pixels; ordinary alpha-over cannot
  // remove the baked sword. This is a cost/quality probe, not a runtime recipe.
  for (let y = top; y < bottom; y++)
    pixels.clean.copy(
      candidate,
      (y * width + left) * 4,
      (y * width + left) * 4,
      (y * width + right) * 4,
    );
  const report = {
    name: sample.name,
    group: sample.group,
    root: sample.root,
    referenceAgreement: compare(approved, pixels.reference, width),
    cleanDifference: compare(pixels.reference, pixels.clean, width),
    patch: {
      left,
      top,
      width: right - left,
      height: bottom - top,
      unpaddedRgbaBytes: (right - left) * (bottom - top) * 4,
    },
    patchResidual: compare(candidate, pixels.clean, width),
  };
  reports.push(report);
  const tiles = [];
  for (const [column, [label, buffer]] of Object.entries({
    approved,
    reference: pixels.reference,
    clean: pixels.clean,
    patch: candidate,
  }).entries()) {
    const png = await sharp(buffer, { raw: { width, height, channels: 4 } })
      .png()
      .toBuffer();
    await writeFile(
      resolve(directory, `${sample.name}-${label}-packed.png`),
      png,
    );
    const gameplay = await sharp(png)
      .resize(
        Math.round(width * manifest.displayScale),
        Math.round(height * manifest.displayScale),
      )
      .png()
      .toBuffer();
    tiles.push({
      input: gameplay,
      left:
        column * 224 + Math.round(112 - sample.root[0] * manifest.displayScale),
      top: Math.round(154 - sample.root[1] * manifest.displayScale),
    });
  }
  const labels = Buffer.from(
    `<svg width="896" height="240"><style>text{font:12px monospace;fill:white}</style><text x="8" y="16">${sample.name}</text>${["approved", "reference", "clean", "patch"].map((name, i) => `<text x="${i * 224 + 8}" y="232">${name}</text>`).join("")}</svg>`,
  );
  const row = await sharp({
    create: { width: 896, height: 240, channels: 4, background: "#252c30" },
  })
    .composite([...tiles, { input: labels, left: 0, top: 0 }])
    .png()
    .toBuffer();
  await writeFile(resolve(directory, `${sample.name}-review.png`), row);
  rows.push(row);
  const light = await sharp({
    create: { width: 896, height: 240, channels: 4, background: "#d9d6cd" },
  })
    .composite([
      ...tiles,
      {
        input: Buffer.from(
          labels.toString().replace("fill:white", "fill:black"),
        ),
        left: 0,
        top: 0,
      },
    ])
    .png()
    .toBuffer();
  lightRows.push(light);
}
for (const [background, collection] of [
  ["dark", rows],
  ["light", lightRows],
])
  for (let at = 0; at < collection.length; at += 4) {
    const subset = collection.slice(at, at + 4);
    await sharp({
      create: {
        width: 896,
        height: subset.length * 240,
        channels: 4,
        background: "#252c30",
      },
    })
      .composite(subset.map((input, i) => ({ input, left: 0, top: i * 240 })))
      .png()
      .toFile(resolve(directory, `review-${background}-${at / 4}.png`));
  }
await writeFile(
  resolve(directory, "review.json"),
  JSON.stringify(
    {
      producerSha256: hash(await readFile(new URL(import.meta.url))),
      proofSha256: hash(await readFile(resolve(directory, "body.json"))),
      productionApproved: false,
      reports,
    },
    null,
    2,
  ) + "\n",
);
console.log(JSON.stringify(reports, null, 2));

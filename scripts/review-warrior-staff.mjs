/** Gameplay-scale light/dark sheets for the bounded original staff pilot. */
import sharp from "sharp";
import { Buffer } from "node:buffer";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { createHash } from "node:crypto";

const directory = resolve(process.argv[2] ?? "");
if (!process.argv[2] || !relative(process.cwd(), directory).startsWith(".."))
  throw Error("Pass a diagnostic directory outside the repository");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex"),
  proof = JSON.parse(await readFile(resolve(directory, "staff.json"), "utf8"));
const directions = [...new Set(proof.samples.map((s) => s.direction))];
if (
  proof.productionApproved ||
  (proof.carrySourceSha256
    ? proof.samples.length !== directions.length * 40 || directions.length > 8
    : proof.motionSha256
      ? proof.samples.length !== directions.length * 12 || directions.length > 8
      : proof.samples.length !== 12)
)
  throw Error("Expected bounded unapproved staff poses");
if (proof.carrySourceSha256) {
  const expected = [
    ...Array.from({ length: 8 }, (_, index) => ({ action: "idle", index })),
    ...["walk", "run"].flatMap((action) =>
      Array.from({ length: 16 }, (_, index) => ({ action, index })),
    ),
  ];
  for (const direction of directions)
    if (
      proof.samples
        .filter((s) => s.direction === direction)
        .some(
          (s, i) =>
            s.ordinal !== i ||
            s.action !== expected[i].action ||
            s.index !== expected[i].index ||
            !(s.lowerBodyMatrixMaximumError < 1e-5),
        )
    )
      throw Error("Changed or incomplete carry gait");
} else if (proof.motionSha256)
  for (const direction of directions) {
    const indices = proof.samples
      .filter((s) => s.direction === direction)
      .map((s) => s.index);
    if (indices.some((v, i) => v !== i))
      throw Error("Incomplete directional motion");
  }
const reports = [],
  tiles = [];
for (const [index, sample] of proof.samples.entries()) {
  const input = await readFile(resolve(directory, `${sample.name}.png`));
  if (hash(input) !== sample.pngSha256)
    throw Error("Diagnostic render changed");
  const metadata = await sharp(input).metadata();
  if (
    metadata.width !== 1024 ||
    metadata.height !== 1024 ||
    sample.cell !== 512
  )
    throw Error("Unexpected render contract");
  const pixels = await sharp(input)
      .resize(512, 512)
      .ensureAlpha()
      .raw()
      .toBuffer(),
    bounds = [512, 512, -1, -1];
  for (let at = 0; at < pixels.length; at += 4) {
    if (pixels[at + 3] <= 4) {
      pixels.fill(0, at, at + 4);
      continue;
    }
    const x = (at / 4) % 512,
      y = Math.floor(at / 4 / 512);
    bounds[0] = Math.min(bounds[0], x);
    bounds[1] = Math.min(bounds[1], y);
    bounds[2] = Math.max(bounds[2], x);
    bounds[3] = Math.max(bounds[3], y);
  }
  const png = await sharp(pixels, {
    raw: { width: 512, height: 512, channels: 4 },
  })
    .png()
    .toBuffer();
  await writeFile(resolve(directory, `${sample.name}-packed.png`), png);
  tiles.push({
    direction: sample.direction,
    input: await sharp(png).resize(256, 256).png().toBuffer(),
    left: (index % 4) * 256,
    top: Math.floor(index / 4) * 256,
  });
  reports.push({
    name: sample.name,
    direction: sample.direction,
    pixelSha256: hash(pixels),
    pngBytes: png.length,
    decodedBaseBytes: pixels.length,
    bounds,
    alphaTouchesCellEdge:
      bounds[0] === 0 ||
      bounds[1] === 0 ||
      bounds[2] === 511 ||
      bounds[3] === 511,
    contactError: Math.max(...sample.contactErrors),
    staffBodyIntersections: sample.staffBodyIntersections,
    staffGroundMinimum: sample.staffGroundMinimum,
  });
}
const groups =
  proof.motionSha256 && directions.length > 1 ? directions : [null];
for (const direction of groups)
  for (const [background, text] of [
    ["#252c30", "white"],
    ["#d9d6cd", "black"],
  ]) {
    const selected = direction
        ? reports.filter((r) => r.direction === direction)
        : reports,
      selectedTiles = direction
        ? tiles.filter((r) => r.direction === direction)
        : tiles,
      height = Math.ceil(selected.length / 4) * 256;
    const labels = Buffer.from(
      `<svg width="1024" height="${height}"><style>text{font:12px monospace;fill:${text}}</style>${selected.map((r, i) => `<text x="${(i % 4) * 256 + 8}" y="${Math.floor(i / 4) * 256 + 16}">${r.name}</text>`).join("")}</svg>`,
    );
    await sharp({ create: { width: 1024, height, channels: 4, background } })
      .composite([
        ...selectedTiles.map(({ input }, i) => ({
          input,
          left: (i % 4) * 256,
          top: Math.floor(i / 4) * 256,
        })),
        { input: labels, left: 0, top: 0 },
      ])
      .png()
      .toFile(
        resolve(
          directory,
          `review-${direction ? direction + "-" : ""}${text === "white" ? "dark" : "light"}.png`,
        ),
      );
  }
const rejected = reports.filter(
    (r) =>
      r.alphaTouchesCellEdge ||
      r.contactError > 1e-6 ||
      r.staffBodyIntersections.length ||
      r.staffGroundMinimum < 0,
  ),
  result = {
    producerSha256: hash(await readFile(new URL(import.meta.url))),
    proofSha256: hash(await readFile(resolve(directory, "staff.json"))),
    productionApproved: false,
    genuineMotionQualityAccepted: false,
    sampledGeometryPassed: rejected.length === 0,
    rejected: rejected.map((r) => r.name),
    reports,
  };
await writeFile(
  resolve(directory, "review.json"),
  JSON.stringify(result, null, 2) + "\n",
);
console.log(JSON.stringify(result, null, 2));
if (rejected.length)
  throw Error("Staff pilot failed sampled geometry/edge checks");

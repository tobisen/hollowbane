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
if (proof.samples.length !== 12 || proof.productionApproved)
  throw Error("Expected twelve unapproved diagnostic poses");
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
    input: await sharp(png).resize(256, 256).png().toBuffer(),
    left: (index % 4) * 256,
    top: Math.floor(index / 4) * 256,
  });
  reports.push({
    name: sample.name,
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
for (const [background, text] of [
  ["#252c30", "white"],
  ["#d9d6cd", "black"],
]) {
  const labels = Buffer.from(
    `<svg width="1024" height="768"><style>text{font:12px monospace;fill:${text}}</style>${reports.map((r, i) => `<text x="${(i % 4) * 256 + 8}" y="${Math.floor(i / 4) * 256 + 16}">${r.name}</text>`).join("")}</svg>`,
  );
  await sharp({ create: { width: 1024, height: 768, channels: 4, background } })
    .composite([...tiles, { input: labels, left: 0, top: 0 }])
    .png()
    .toFile(
      resolve(directory, `review-${text === "white" ? "dark" : "light"}.png`),
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

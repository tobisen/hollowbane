import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";

// Deterministic prototype-only treatment of existing pixels. No new poses,
// resampling, alpha changes, random grain or production-atlas replacements.
const source = JSON.parse(
  await readFile("src/rendering/warrior-assets.json", "utf8"),
).movement;
const root = "experiments/warrior-integration";
const proof = process.argv.includes("--proof");
await mkdir(`${root}/${proof ? "proof" : "processed"}`, { recursive: true });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const curve = [
  [0, 12],
  [20, 32],
  [50, 62],
  [80, 86],
  [120, 115],
  [180, 151],
  [255, 178],
];
function tone(value) {
  for (let i = 1; i < curve.length; i++) {
    const [hi, b] = curve[i],
      [lo, a] = curve[i - 1];
    if (value <= hi) return a + ((value - lo) / (hi - lo)) * (b - a);
  }
  return 178;
}
const records = [];
for (const direction of proof
  ? ["s"]
  : ["s", "sw", "w", "nw", "n", "ne", "e", "se"]) {
  const original = await readFile(
    `public/dev/warrior-directions/${direction}.png`,
  );
  if (hash(original) !== source.views[direction].sha256)
    throw Error("Source identity changed");
  const { data, info } = await sharp(original)
    .extract({
      left: 0,
      top: 0,
      width: proof ? 256 : 2048,
      height: proof ? 264 : 792,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const target = tone(luma);
    const cool = b >= r - 2 && b >= g - 8;
    const chroma = cool ? 0.38 : 0.65;
    data[i] = Math.round(
      Math.max(0, Math.min(255, target + (r - luma) * chroma + 3)),
    );
    data[i + 1] = Math.round(
      Math.max(0, Math.min(255, target + (g - luma) * chroma + 1)),
    );
    data[i + 2] = Math.round(
      Math.max(0, Math.min(255, target + (b - luma) * chroma - 4)),
    );
  }
  const png = await sharp(data, { raw: info }).png().toBuffer();
  const file = `${proof ? "proof" : "processed"}/${direction}.png`;
  await writeFile(`${root}/${file}`, png);
  records.push({
    direction,
    file,
    sourceSha256: hash(original),
    sha256: hash(png),
    width: info.width,
    height: info.height,
    bytes: png.length,
    decodedRgbaBytes: info.width * info.height * 4,
  });
}
const manifest = {
  version: 1,
  date: "2026-11-15",
  scope: proof
    ? "single material-treatment proof"
    : "prototype-only reprocessing of192 existing idle/walk cells; zero new poses",
  source: "public/dev/warrior-directions",
  root: [128, 210],
  cell: [256, 264],
  scale: 0.5,
  alpha: "unchanged exactly",
  curve,
  chroma: { cool: 0.38, warm: 0.65 },
  bias: [3, 1, -4],
  lightingLimit:
    "RGB treatment cannot rotate baked lights or alter geometry/physical roughness",
  records,
};
await writeFile(
  `${root}/${proof ? "proof/manifest" : "manifest"}.json`,
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(JSON.stringify(records));

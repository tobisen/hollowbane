import { readFileSync, existsSync, statSync } from "node:fs";
import sharp from "sharp";
const assets = JSON.parse(readFileSync("docs/assets.json", "utf8"));
const ids = new Set();
for (const asset of assets) {
  if (
    ids.has(asset.id) ||
    !asset.rights ||
    !existsSync(asset.source) ||
    typeof asset.placeholder !== "boolean"
  )
    throw new Error(`Invalid asset ${asset.id}`);
  ids.add(asset.id);
  if (asset.runtime) {
    if (!existsSync(asset.provenance) || !existsSync(asset.runtime))
      throw new Error(`Missing provenance/runtime ${asset.id}`);
    if (statSync(asset.runtime).size > 3 * 1024 * 1024)
      throw new Error(`Asset budget exceeded ${asset.id}`);
    const m = await sharp(asset.runtime).metadata();
    const expected =
      asset.type === "environment"
        ? { width: 1536, height: 1024 }
        : { width: 1024, height: 1024 };
    if (m.width !== expected.width || m.height !== expected.height)
      throw new Error(`Wrong dimensions ${asset.id}`);
    if (asset.type !== "environment" && !m.hasAlpha)
      throw new Error(`Missing transparency ${asset.id}`);
  }
}
const meta = JSON.parse(readFileSync("public/assets/sprites.json", "utf8"));
if (
  meta.hero.frames.length !== 64 ||
  meta.hero.rows !== 8 ||
  meta.hero.columns !== 8
)
  throw new Error("Expected 8 directions × 8 frames");
for (const frame of meta.hero.frames)
  if (frame.pivot.x !== 64 || frame.pivot.y !== 112)
    throw new Error("Invalid character foot pivot");
for (const [file, cell, count, foot] of [
  ["wanderer", 128, 64, 112],
  ["props", 512, 4, 496],
]) {
  const { data, info } = await sharp(`public/assets/${file}.webp`)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const columns = info.width / cell;
  for (let i = 0; i < count; i++) {
    let opaque = 0;
    const left = (i % columns) * cell,
      top = Math.floor(i / columns) * cell;
    for (let y = 0; y < cell; y++)
      for (let x = 0; x < cell; x++) {
        const alpha = data[((top + y) * info.width + left + x) * 4 + 3];
        if (alpha > 24) {
          opaque++;
          if (x < 3 || x >= cell - 3 || y < 3 || y >= foot)
            throw new Error(`Clipped/pivot overflow ${file}:${i}`);
        }
      }
    if (opaque < 200) throw new Error(`Empty frame ${file}:${i}`);
  }
}
console.log(
  `Validated ${assets.length} asset records, 64 character frames, 4 props, alpha/pivots and budgets.`,
);

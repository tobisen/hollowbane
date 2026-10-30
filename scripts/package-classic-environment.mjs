import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

// Offline normalization only. Original generated paintings remain untouched.
const source = "assets/source/classic-visual";
const output = "public/dev/classic-visual";
const records = [];
for (const name of ["oak", "bell", "earth"]) {
  const original = await readFile(`${source}/${name}.png`);
  let png;
  if (name === "earth") {
    const tile = await sharp(original).resize(256, 256).png().toBuffer();
    // Reflected quadrants meet at identical edge texels; no generated seam claim.
    const quadrants = await Promise.all([
      sharp(tile).png().toBuffer(),
      sharp(tile).flop().png().toBuffer(),
      sharp(tile).flip().png().toBuffer(),
      sharp(tile).flip().flop().png().toBuffer(),
    ]);
    png = await sharp({
      create: { width: 512, height: 512, channels: 4, background: "#393a2b" },
    })
      .composite(
        quadrants.map((input, i) => ({
          input,
          left: (i % 2) * 256,
          top: Math.floor(i / 2) * 256,
        })),
      )
      .png()
      .toBuffer();
  } else {
    png = await sharp(original)
      .resize(232, 232, { fit: "contain", background: "#00000000" })
      .extend({
        top: 12,
        bottom: 12,
        left: 12,
        right: 12,
        background: "#00000000",
      })
      .png()
      .toBuffer();
  }
  await writeFile(`${output}/${name}.png`, png);
  const m = await sharp(png).metadata();
  records.push({
    name,
    width: m.width,
    height: m.height,
    pngBytes: png.length,
    decodedRgbaBytes: m.width * m.height * 4,
    sourceSha256: createHash("sha256").update(original).digest("hex"),
    sha256: createHash("sha256").update(png).digest("hex"),
  });
}
await writeFile(
  `${output}/environment.json`,
  JSON.stringify({ version: 1, records }, null, 2) + "\n",
);
console.log(JSON.stringify(records));

import sharp from "sharp";
/** Deterministic packaging only: preserve generated alpha and aspect; common foot pivot. */
for (const name of ["forest-oak", "crypt-arch"]) {
  const trimmed = await sharp(`assets/source/${name}.png`).trim().toBuffer();
  const { data, info } = await sharp(trimmed)
    .resize({ width: 920, height: 920, fit: "inside" })
    .toBuffer({ resolveWithObject: true });
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: data,
        left: Math.floor((1024 - info.width) / 2),
        top: 984 - info.height,
      },
    ])
    .webp({ lossless: true })
    .toFile(`public/assets/${name}.webp`);
}

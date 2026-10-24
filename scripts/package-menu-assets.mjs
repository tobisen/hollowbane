import sharp from "sharp";
import { mkdir } from "node:fs/promises";
await mkdir("public/assets", { recursive: true });
await sharp("assets/source/menu-sanctuary-v1.png")
  .resize(1600, 900, { fit: "cover" })
  .webp({ quality: 82, effort: 6 })
  .toFile("public/assets/menu-sanctuary-v1.webp");
for (const id of ["warrior", "sorcerer", "ranger"]) {
  const source = `assets/source/menu-${id}-v1.png`;
  await sharp(source)
    .resize(512, 768, { fit: "cover" })
    .webp({ quality: 82, effort: 6 })
    .toFile(`public/assets/menu-${id}-v1.webp`);
  // Shared reviewed upper-body crop, never saliency-dependent framing.
  await sharp(source)
    .extract({ left: 160, top: 0, width: 704, height: 880 })
    .resize(160, 200)
    .webp({ quality: 80, effort: 6 })
    .toFile(`public/assets/menu-${id}-thumb-v1.webp`);
}
console.log(
  "Packaged original menu background, three portraits and three thumbnails.",
);

const { readFile, writeFile } = await import("node:fs/promises");
const { createHash } = await import("node:crypto");
const inventory = [];
for (const name of [
  "sanctuary",
  "warrior",
  "sorcerer",
  "ranger",
  "warrior-thumb",
  "sorcerer-thumb",
  "ranger-thumb",
]) {
  const sourceName = name.replace("-thumb", "");
  const record = { id: `menu-${name}-v1` };
  for (const [kind, path] of [
    ["source", `assets/source/menu-${sourceName}-v1.png`],
    ["runtime", `public/assets/menu-${name}-v1.webp`],
  ]) {
    const bytes = await readFile(path);
    const m = await sharp(bytes).metadata();
    record[kind] = {
      path,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      width: m.width,
      height: m.height,
    };
  }
  inventory.push(record);
}
await writeFile(
  "docs/art/menu-inventory.json",
  JSON.stringify(
    {
      version: 1,
      provenance: "docs/art/menu.md",
      budgets: {
        runtimeTotalBytes: 512 * 1024,
        nominalDecodedBytes: 11 * 1024 * 1024,
      },
      assets: inventory,
    },
    null,
    2,
  ) + "\n",
);

import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
await mkdir("public/assets", { recursive: true });
await sharp("assets/source/cloister.png")
  .webp({ quality: 90, effort: 6 })
  .toFile("public/assets/cloister.webp");
const metadata = {
  version: 1,
  projection: "2:1",
  environment: { width: 1536, height: 1024, path: "assets/cloister.webp" },
  source: "Original built-in imagegen reference kit; see docs/art/prompts.md",
};
await writeFile(
  "public/assets/kit.json",
  JSON.stringify(metadata, null, 2) + "\n",
);
console.log("Packaged environment WebP and versioned kit metadata.");

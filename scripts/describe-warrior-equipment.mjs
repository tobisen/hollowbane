// Regenerate the compact production allowlist from validated developer assets.
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { format } from "prettier";
import { validateWarriorEquipment } from "./validate-warrior-equipment.mjs";

await validateWarriorEquipment();
const folder = "public/dev/warrior-equipment";
const manifest = JSON.parse(await readFile(`${folder}/equipment.json`, "utf8"));
const files = [],
  textures = {};
for (const [name, key] of [
  ["shield", "shield"],
  ["shield-death-body", "body"],
]) {
  const texture = {};
  for (const [extension, field, contentType] of [
    ["png", "image", "image/png"],
    ["json", "atlas", "application/json"],
  ]) {
    const source = `${name}.${extension}`;
    const bytes = await readFile(`${folder}/${source}`);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const file = `assets/warrior/equipment-${name}-${sha256.slice(0, 12)}.${extension}`;
    files.push({ source, file, sha256, bytes: bytes.length, contentType });
    texture[field] = file;
  }
  texture.decodedBytes = manifest.resources.find(
    (resource) => resource.name === name,
  ).decodedBytes;
  textures[key] = texture;
}
const descriptor = {
  source: "warrior-equipment",
  configuration: manifest.configuration,
  bodyFromDeathFrame: manifest.bodyVariantFromDeathFrame,
  files,
  textures,
};
await writeFile(
  "src/rendering/warrior-equipment-assets.json",
  await format(JSON.stringify(descriptor), { parser: "json" }),
);
console.log("Described two exact equipment PNG/JSON pairs; no pixels changed");

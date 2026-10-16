import { readFileSync, existsSync } from "node:fs";
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
}
console.log(`Validated ${assets.length} original placeholder assets.`);

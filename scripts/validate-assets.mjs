import { validateWorldArtInventory } from "./validate-world-art.mjs";
import { validateWarriorPilot } from "./validate-warrior-pilot.mjs";
import { validateWarriorMovement } from "./validate-warrior-movement.mjs";
import { validateWarriorDirections } from "./validate-warrior-directions.mjs";
import { validateWarriorAttacks } from "./validate-warrior-attacks.mjs";
import { validateWarriorAttackDirections } from "./validate-warrior-attack-directions.mjs";
import { validateWarriorAbilities } from "./validate-warrior-abilities.mjs";
import { validateWarriorReactions } from "./validate-warrior-reactions.mjs";
import { validateWarriorDeath } from "./validate-warrior-death.mjs";
import { readFileSync, existsSync, statSync } from "node:fs";
import sharp from "sharp";
import { createHash } from "node:crypto";
const menuTypes = {
  "menu-background": { width: 1600, height: 900, bytes: 240 * 1024 },
  "menu-portrait": { width: 512, height: 768, bytes: 80 * 1024 },
  "menu-thumbnail": { width: 160, height: 200, bytes: 12 * 1024 },
};
let menuBytes = 0;
let menuDecoded = 0;
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
    const menu = menuTypes[asset.type];
    const expected =
      menu ??
      (asset.type === "environment"
        ? { width: 1536, height: 1024 }
        : { width: 1024, height: 1024 });
    if (m.width !== expected.width || m.height !== expected.height)
      throw new Error(`Wrong dimensions ${asset.id}`);
    if (menu) {
      const bytes = statSync(asset.runtime).size;
      menuBytes += bytes;
      menuDecoded += m.width * m.height * 4;
      if (bytes > menu.bytes || m.format !== "webp")
        throw Error(`Menu asset format/budget ${asset.id}`);
    }
    if (!menu && asset.type !== "environment" && !m.hasAlpha)
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
  ["camp-shelter", 1024, 1, 984],
  ["camp-fire", 1024, 1, 984],
  ["forest-oak", 1024, 1, 984],
  ["crypt-arch", 1024, 1, 984],
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
  `Validated ${assets.length} asset records, 64 character frames, 4 atlas props, 2 camp props, alpha/pivots and budgets.`,
);

validateWorldArtInventory(assets);
await validateWarriorPilot();
await validateWarriorPilot("public/dev/warrior-refined");
await validateWarriorMovement();
await validateWarriorDirections();
await validateWarriorAttacks();
await validateWarriorAttackDirections();
await validateWarriorAbilities();
await validateWarriorReactions();
await validateWarriorDeath();

const menuInventory = JSON.parse(
  readFileSync("docs/art/menu-inventory.json", "utf8"),
);
if (
  menuInventory.version !== 1 ||
  menuInventory.assets.length !== 7 ||
  menuBytes > 512 * 1024
)
  throw Error("Invalid menu inventory/total download budget");
const expectedMenuIds = assets
  .filter((asset) => menuTypes[asset.type])
  .map((asset) => asset.id)
  .sort();
const auditedMenuIds = menuInventory.assets.map((asset) => asset.id).sort();
if (
  JSON.stringify(expectedMenuIds) !== JSON.stringify(auditedMenuIds) ||
  new Set(auditedMenuIds).size !== 7 ||
  menuDecoded > 11 * 1024 * 1024
)
  throw Error("Menu audit coverage/decoded budget drift");
for (const asset of menuInventory.assets) {
  const registered = assets.find((entry) => entry.id === asset.id);
  if (!registered || !menuTypes[registered.type])
    throw Error(`Unregistered menu asset ${asset.id}`);
  for (const kind of ["source", "runtime"]) {
    const record = asset[kind];
    const bytes = readFileSync(record.path);
    if (
      registered[kind] !== record.path ||
      bytes.length !== record.bytes ||
      createHash("sha256").update(bytes).digest("hex") !== record.sha256
    )
      throw Error(`Menu fingerprint drift ${asset.id}:${kind}`);
  }
}
console.log(
  `Verified 7 menu exports, ${menuBytes} runtime bytes (512 KiB total cap).`,
);

// Fail-closed offline packaging. Production selection/ownership is a later gate.
import sharp from "sharp";
import { readFile, writeFile, access, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { format } from "prettier";
import {
  cropEquipmentRgba,
  packEquipmentRasters,
  equipmentFrame,
} from "./warrior-equipment-packing.mjs";

const [input, output] = process.argv.slice(2);
if (!input || !output)
  throw Error("Pass complete probe input and output folders");
if (resolve(input) === resolve(output))
  throw Error("Keep packaged output separate from original proof sources");
const hash = (v) => createHash("sha256").update(v).digest("hex");
const hashFile = async (path) => hash(await readFile(path));
const proof = JSON.parse(await readFile(join(input, "shield.json"), "utf8"));
if (
  proof.productionApproved !== false ||
  proof.poses.length !== 880 ||
  proof.diagnosticFailures.length ||
  !proof.targetedDeathArmCandidate ||
  !proof.deathSwivelCandidate ||
  proof.producerSha256 !==
    (await hashFile("scripts/probe-warrior-shield.py")) ||
  proof.attachmentsExporterSha256 !==
    (await hashFile("scripts/export-warrior-attachments.py"))
)
  throw Error("Incomplete, failed or stale shield proof; no assets written");
const folders = {
  movement: "warrior-directions",
  attacks: "warrior-attack-directions",
  abilities: "warrior-abilities",
  hit: "warrior-reactions",
  death: "warrior-death",
};
const authoring = {
  abilities: "warrior-abilities",
  hit: "warrior-reactions",
  death: "warrior-death",
};
for (const [set, folder] of Object.entries(authoring))
  if (
    proof.poseAuthoringSha256[set] !==
    (await hashFile(`assets/source/q3/${folder}/render.py`))
  )
    throw Error(`Stale pose authoring ${set}`);
const manifests = {},
  bodyManifestHashes = {};
for (const [set, folder] of Object.entries(folders)) {
  const bytes = await readFile(`public/dev/${folder}/warrior.json`);
  manifests[set] = JSON.parse(bytes);
  bodyManifestHashes[set] = hash(bytes);
}
const byName = new Map(proof.poses.map((p) => [p.name, p]));
if (byName.size !== 880) throw Error("Duplicate equipment poses");
for (const [set, manifest] of Object.entries(manifests))
  for (const direction of manifest.directions)
    for (const [ordinal, frame] of manifest.views[direction].frames.entries()) {
      const pose = byName.get(
        `${frame.action}-${direction}-${String(frame.index).padStart(2, "0")}`,
      );
      if (
        !pose ||
        pose.ordinal !== ordinal ||
        pose.set !== set ||
        pose.plateBodyIntersections.length ||
        pose.plateGroundMinimum < -0.001 ||
        (pose.modifiedArmGroundMinimum !== null &&
          pose.modifiedArmGroundMinimum < -0.001)
      )
        throw Error(
          `Unexpected or failed equipment pose ${set}/${direction}/${ordinal}`,
        );
      const [left, top, right, bottom] = pose.shieldBounds;
      if (
        left < 2 ||
        top < 2 ||
        right > frame.width - 2 ||
        bottom > frame.height - 2
      )
        throw Error(`Shield outside original frame: ${pose.name}`);
    }
const unique = proof.poses.filter((p) => !p.rasterAlias);
const bodyPoses = unique.filter((p) => p.bodyOverride);
if (unique.length !== 784 || bodyPoses.length !== 48)
  throw Error("Unexpected shield aliases/body-variant scope");
const required = [
  ...unique.map((p) => `${p.name}-overlay.png`),
  ...bodyPoses.map((p) => `${p.name}-body.png`),
];
const missing = [];
for (const file of required)
  try {
    await access(join(input, file));
  } catch {
    missing.push(file);
  }
if (missing.length)
  throw Error(
    `Missing ${missing.length} required rasters; no assets written: ${missing.slice(0, 5).join(", ")}`,
  );
const sourceSize = (pose) => {
  const frame = manifests[pose.set].views[pose.direction].frames[pose.ordinal];
  return [frame.width, frame.height];
};
const sourceHashes = {};
async function decode(pose, kind) {
  const file = `${pose.name}-${kind}.png`,
    bytes = await readFile(join(input, file)),
    metadata = await sharp(bytes).metadata();
  const [width, height] = sourceSize(pose);
  const cell = pose.set === "movement" ? 256 : width;
  if (
    metadata.width !== cell * 2 ||
    metadata.height !== cell * 2 ||
    !metadata.hasAlpha
  )
    throw Error(`Unexpected native raster size ${file}`);
  const pixels = await sharp(bytes)
    .resize(cell, cell)
    .extend({
      bottom: height - cell,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .raw()
    .toBuffer();
  sourceHashes[file] = hash(bytes);
  return { name: pose.name, ...cropEquipmentRgba(pixels, width, height) };
}
const overlayRasters = [],
  bodyRasters = [];
for (const pose of unique) overlayRasters.push(await decode(pose, "overlay"));
for (const pose of bodyPoses) bodyRasters.push(await decode(pose, "body"));
const framesByPose = {};
for (const pose of proof.poses) {
  framesByPose[pose.set] ??= {};
  framesByPose[pose.set][pose.direction] ??= [];
  framesByPose[pose.set][pose.direction][pose.ordinal] = pose.name;
}
const products = [];
async function packageAtlas(name, rasters, poses) {
  const atlas = packEquipmentRasters(rasters);
  const byRaster = new Map(rasters.map((r) => [r.name, r]));
  const frames = {};
  for (const pose of poses) {
    const source = byName.get(pose.rasterAlias ?? pose.name);
    const raster = byRaster.get(source.name);
    if (!raster) throw Error(`Missing canonical raster ${source.name}`);
    const delta = [0, 1].map((axis) =>
      Math.round(pose.root[axis] - source.root[axis]),
    );
    frames[pose.name] = {
      ...equipmentFrame(
        raster,
        atlas.placements[source.name],
        sourceSize(pose),
        delta,
      ),
      pixelSha256: hash(raster.pixels),
    };
  }
  const png = await sharp(atlas.pixels, {
    raw: { width: atlas.width, height: atlas.height, channels: 4 },
  })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  const metadata = {
    frames,
    meta: {
      image: `${name}.png`,
      format: "RGBA8888",
      size: { w: atlas.width, h: atlas.height },
      scale: "1",
    },
  };
  products.push({
    name,
    png,
    metadata,
    pngSha256: hash(png),
    decodedBytes: atlas.pixels.length,
  });
}
await packageAtlas("shield", overlayRasters, proof.poses);
await packageAtlas(
  "shield-death-body",
  bodyRasters,
  proof.poses.filter((p) => p.bodyOverride),
);
// All source coverage, provenance, packing and alpha checks precede any write.
await mkdir(output, { recursive: true });
for (const product of products) {
  await writeFile(join(output, product.name + ".png"), product.png);
  await writeFile(
    join(output, product.name + ".json"),
    await format(JSON.stringify(product.metadata), { parser: "json" }),
  );
}
const manifest = {
  version: 1,
  productionApproved: false,
  configuration: {
    main: "ash-blade",
    off: "bark-guard",
    armor: "approved static appearance",
  },
  framesByPose,
  rootsBySet: Object.fromEntries(
    Object.entries(manifests).map(([set, manifest]) => [set, manifest.root]),
  ),
  gripsByPose: Object.fromEntries(
    proof.poses.map((p) => [p.name, p.rasterGrip ?? p.grip]),
  ),
  bodyVariantFromDeathFrame: 8,
  provenance: {
    producerSha256: await hashFile(fileURLToPath(import.meta.url)),
    packingSha256: await hashFile("scripts/warrior-equipment-packing.mjs"),
    probeSha256: proof.producerSha256,
    proofSha256: await hashFile(join(input, "shield.json")),
    bodyManifestHashes,
    sourceHashes,
  },
  resources: products.map((p) => ({
    name: p.name,
    pngBytes: p.png.length,
    pngSha256: p.pngSha256,
    decodedBytes: p.decodedBytes,
    frames: Object.keys(p.metadata.frames).length,
  })),
  decodedPayloadIsMeasuredGpuMemory: false,
};
await writeFile(
  join(output, "equipment.json"),
  await format(JSON.stringify(manifest), { parser: "json" }),
);
console.log(JSON.stringify(manifest.resources));

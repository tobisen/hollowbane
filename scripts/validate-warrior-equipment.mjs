import sharp from "sharp";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const hash = (v) => createHash("sha256").update(v).digest("hex");
export async function validateWarriorEquipment(
  directory = "public/dev/warrior-equipment",
) {
  const manifest = JSON.parse(
    await readFile(`${directory}/equipment.json`, "utf8"),
  );
  const assert = (ok, message) => {
    if (!ok) throw Error(`Warrior equipment: ${message}`);
  };
  assert(
    manifest.version === 1 &&
      manifest.productionApproved === false &&
      manifest.configuration.main === "ash-blade" &&
      manifest.configuration.off === "bark-guard" &&
      manifest.bodyVariantFromDeathFrame === 8 &&
      manifest.decodedPayloadIsMeasuredGpuMemory === false,
    "developer-only sword/shield contract",
  );
  for (const [key, path] of [
    ["producerSha256", "scripts/package-warrior-equipment.mjs"],
    ["packingSha256", "scripts/warrior-equipment-packing.mjs"],
    ["probeSha256", "scripts/probe-warrior-shield.py"],
  ])
    assert(
      manifest.provenance[key] === hash(await readFile(path)),
      `provenance ${key}`,
    );
  assert(
    Object.keys(manifest.provenance.sourceHashes).length === 832 &&
      Object.values(manifest.provenance.sourceHashes).every((v) =>
        /^[a-f0-9]{64}$/.test(v),
      ),
    "784 original overlays and 48 limited body variants",
  );
  const folders = {
    movement: "warrior-directions",
    attacks: "warrior-attack-directions",
    abilities: "warrior-abilities",
    hit: "warrior-reactions",
    death: "warrior-death",
  };
  const expected = new Map();
  for (const [set, folder] of Object.entries(folders)) {
    const bytes = await readFile(`public/dev/${folder}/warrior.json`);
    const body = JSON.parse(bytes);
    assert(
      manifest.provenance.bodyManifestHashes[set] === hash(bytes),
      `approved body ${set}`,
    );
    assert(
      JSON.stringify(manifest.rootsBySet[set]) === JSON.stringify(body.root),
      `root ${set}`,
    );
    for (const direction of body.directions) {
      const frames = body.views[direction].frames;
      assert(
        manifest.framesByPose[set][direction].length === frames.length,
        `pose count ${set}/${direction}`,
      );
      for (const [ordinal, f] of frames.entries()) {
        const name = `${f.action}-${direction}-${String(f.index).padStart(2, "0")}`;
        assert(
          manifest.framesByPose[set][direction][ordinal] === name,
          `pose mapping ${name}`,
        );
        const grip = manifest.gripsByPose[name];
        assert(
          grip?.length === 3 && grip.every(Number.isFinite),
          `grip ${name}`,
        );
        let alias = null;
        if (
          ((set === "attacks" || set === "abilities") &&
            [0, 11].includes(f.index)) ||
          (set === "hit" && f.index === 5) ||
          (set === "death" && f.index === 0)
        )
          alias = `idle-${direction}-00`;
        if (set === "death" && f.index >= 14) alias = `death-${direction}-13`;
        expected.set(name, {
          set,
          width: f.width,
          height: f.height,
          alias,
          body: set === "death" && ordinal >= 8,
        });
      }
    }
  }
  assert(
    expected.size === 880 && Object.keys(manifest.gripsByPose).length === 880,
    "full eight-way inventory",
  );
  let pngBytes = 0,
    decodedBytes = 0;
  assert(manifest.resources.length === 2, "two bounded textures");
  for (const name of ["shield", "shield-death-body"]) {
    const resource = manifest.resources.find((r) => r.name === name);
    const bytes = await readFile(`${directory}/${name}.png`);
    assert(
      resource &&
        resource.pngBytes === bytes.length &&
        resource.pngSha256 === hash(bytes),
      `PNG ${name}`,
    );
    const { data, info } = await sharp(bytes)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    assert(
      info.width <= 2048 &&
        info.height <= 2048 &&
        resource.decodedBytes === data.length,
      `decoded bounds ${name}`,
    );
    const atlas = JSON.parse(
      await readFile(`${directory}/${name}.json`, "utf8"),
    );
    const required = [...expected].filter(
      ([, p]) => name === "shield" || p.body,
    );
    assert(
      Object.keys(atlas.frames).length === required.length &&
        resource.frames === required.length,
      `frame inventory ${name}`,
    );
    assert(
      atlas.meta.image === name + ".png" &&
        atlas.meta.size.w === info.width &&
        atlas.meta.size.h === info.height,
      `atlas descriptor ${name}`,
    );
    for (const [id, pose] of required) {
      const f = atlas.frames[id],
        crop = f?.frame,
        trim = f?.spriteSourceSize;
      assert(
        f &&
          !f.rotated &&
          f.trimmed &&
          f.sourceSize.w === pose.width &&
          f.sourceSize.h === pose.height,
        `source size ${id}`,
      );
      assert(
        [crop.x, crop.y, crop.w, crop.h, trim.x, trim.y, trim.w, trim.h].every(
          Number.isSafeInteger,
        ) &&
          crop.x >= 2 &&
          crop.y >= 2 &&
          crop.w > 0 &&
          crop.h > 0 &&
          crop.x + crop.w <= info.width - 2 &&
          crop.y + crop.h <= info.height - 2 &&
          trim.x >= 0 &&
          trim.y >= 0 &&
          trim.w === crop.w &&
          trim.h === crop.h &&
          trim.x + trim.w <= pose.width &&
          trim.y + trim.h <= pose.height,
        `crop/trim bounds ${id}`,
      );
      const pixels = Buffer.alloc(crop.w * crop.h * 4);
      for (let y = 0; y < crop.h; y++)
        data.copy(
          pixels,
          y * crop.w * 4,
          ((crop.y + y) * info.width + crop.x) * 4,
          ((crop.y + y) * info.width + crop.x + crop.w) * 4,
        );
      assert(hash(pixels) === f.pixelSha256, `crop pixels ${id}`);
      if (pose.alias) {
        const source = atlas.frames[pose.alias];
        assert(source, `alias source ${id}`);
        const root = manifest.rootsBySet[pose.set],
          sourceRoot = manifest.rootsBySet[expected.get(pose.alias).set];
        assert(
          JSON.stringify(crop) === JSON.stringify(source.frame) &&
            trim.x === source.spriteSourceSize.x + root[0] - sourceRoot[0] &&
            trim.y === source.spriteSourceSize.y + root[1] - sourceRoot[1] &&
            f.pixelSha256 === source.pixelSha256,
          `packed alias ${id}`,
        );
      }
    }
    pngBytes += bytes.length;
    decodedBytes += data.length;
  }
  return { pngBytes, decodedBytes, atlases: 2, frames: 880, bodyFrames: 64 };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(JSON.stringify(await validateWarriorEquipment(process.argv[2])));

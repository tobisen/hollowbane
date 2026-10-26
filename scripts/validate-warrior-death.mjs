import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import { pathToFileURL } from "node:url";

export async function validateWarriorDeath(
  directory = "public/dev/warrior-death",
) {
  const meta = JSON.parse(await readFile(`${directory}/warrior.json`, "utf8"));
  const movement = JSON.parse(
    await readFile("public/dev/warrior-directions/warrior.json", "utf8"),
  );
  const approved = JSON.parse(
    await readFile("public/dev/warrior-combat/warrior.json", "utf8"),
  );
  const hash = (v) => createHash("sha256").update(v).digest("hex");
  const assert = (ok, message) => {
    if (!ok) throw Error(`Warrior death: ${message}`);
  };
  assert(
    meta.cell === 448 &&
      meta.columns === 4 &&
      meta.rows === 4 &&
      JSON.stringify(meta.root) === "[224,274]" &&
      meta.displayScale === 0.5 &&
      meta.blender === "4.5.3 LTS" &&
      meta.productionApproved === false &&
      meta.frames === 128 &&
      Object.keys(meta.views).length === 8 &&
      JSON.stringify(meta.directions) === JSON.stringify(movement.directions),
    "fixed window/root/direction inventory",
  );
  assert(
    JSON.stringify(meta.clips) ===
      JSON.stringify({
        death: {
          start: 0,
          count: 16,
          durationTicks: 30,
          loop: false,
          terminal: 15,
        },
      }),
    "death clip contract",
  );
  for (const [key, file] of [
    ["rendererSha256", "assets/source/q3/warrior-death/render.py"],
    ["packagerSha256", "scripts/package-warrior-death.mjs"],
    ["rigSha256", "assets/source/q3/warrior-rig-v2/warrior.blend"],
    ["movementManifestSha256", "public/dev/warrior-directions/warrior.json"],
  ])
    assert(
      meta.provenance[key] === hash(await readFile(file)),
      `provenance ${key}`,
    );
  const results = {};
  for (const direction of meta.directions) {
    const view = meta.views[direction],
      reference = movement.views[direction],
      angle = (reference.rotationDegrees * Math.PI) / 180;
    assert(
      view.rotationDegrees === reference.rotationDegrees &&
        view.mirrored === false &&
        view.frames.length === 16 &&
        JSON.stringify(view.facing) === JSON.stringify(reference.facing) &&
        view.atlas === `${direction}.png`,
      `orientation ${direction}`,
    );
    const png = await readFile(`${directory}/${view.atlas}`);
    assert(
      hash(png) === view.atlasSha256 &&
        png.length === view.bytes &&
        png.length <= 1536 * 1024,
      `atlas identity/budget ${direction}`,
    );
    const { data, info } = await sharp(png)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    assert(
      info.width === 1792 &&
        info.height === 1792 &&
        data.length === view.decodedBytes &&
        data.length === 12845056,
      `decoded budget ${direction}`,
    );
    const idle = await sharp(`public/dev/warrior-directions/${direction}.png`)
      .extract({ left: 0, top: 0, width: 256, height: 256 })
      .raw()
      .toBuffer();
    let margin = 448;
    for (const [i, f] of view.frames.entries()) {
      const action = "death",
        index = i;
      assert(
        f.action === action &&
          f.index === index &&
          f.name ===
            `${action}-${direction}-${String(index).padStart(2, "0")}` &&
          f.x === (i % 4) * 448 &&
          f.y === Math.floor(i / 4) * 448 &&
          f.width === 448 &&
          f.height === 448,
        `sequence/region ${direction}:${i}`,
      );
      assert(
        f.root.length === 2 &&
          f.root.every(
            (v, axis) =>
              Number.isFinite(v) && Math.abs(v - meta.root[axis]) < 0.001,
          ) &&
          Object.keys(f.boneLengths).length === 15 &&
          Object.entries(approved.frames[0].boneLengths).every(
            ([name, length]) => Math.abs(f.boneLengths[name] - length) < 1e-5,
          ),
        `rig/root ${direction}:${i}`,
      );
      assert(
        f.feet.length === 2 &&
          f.feet.every(
            (foot) =>
              foot.length === 3 && foot.every(Number.isFinite) && foot[2] >= 0,
          ),
        `feet ${direction}:${i}`,
      );
      if (i <= 3)
        assert(
          f.feet.every((foot, j) => {
            const [x, y, z] = approved.frames[0].feet[j];
            const rotated = [
              x * Math.cos(angle) - y * Math.sin(angle),
              x * Math.sin(angle) + y * Math.cos(angle),
              z,
            ];
            return foot.every((v, a) => Math.abs(v - rotated[a]) < 1e-6);
          }),
          `planted collapse ${direction}:${i}`,
        );
      assert(
        Number.isFinite(f.groundMinimum) &&
          f.groundMinimum >= -0.001 &&
          f.groundMinimum <= 0.02 &&
          f.geometryBounds.length === 4 &&
          f.geometryBounds.every(
            (v) => Number.isFinite(v) && v >= 8 && v <= 440,
          ),
        `ground/geometry ${direction}:${i}`,
      );
      assert(
        f.footPixels.length === 2 &&
          f.footPixels.every(
            (foot) =>
              foot.length === 2 &&
              foot.every((v) => Number.isFinite(v) && v >= 8 && v <= 440),
          ) &&
          Object.keys(f.shoeGroundMinimum).sort().join() === "L,R" &&
          Object.values(f.shoeGroundMinimum).every(
            (z) => Number.isFinite(z) && z >= -0.001,
          ) &&
          (i < 11 ||
            Object.values(f.shoeGroundMinimum).every(
              (z) => Math.abs(z - 0.002) < 0.001,
            )),
        `heel contact/overlays ${direction}:${i}`,
      );
      assert(
        f.weaponBounds.length === 4 &&
          f.weaponBounds.every((v) => Number.isFinite(v) && v >= 8 && v <= 440),
        `weapon containment ${direction}:${i}`,
      );
      const cell = Buffer.alloc(448 * 448 * 4);
      for (let row = 0; row < 448; row++)
        data.copy(
          cell,
          row * 448 * 4,
          ((f.y + row) * 1792 + f.x) * 4,
          ((f.y + row) * 1792 + f.x + 448) * 4,
        );
      assert(hash(cell) === f.pixelSha256, `pixel identity ${direction}:${i}`);
      let opaque = 0;
      for (let y = 0; y < 448; y++)
        for (let x = 0; x < 448; x++) {
          const at = (y * 448 + x) * 4,
            alpha = cell[at + 3];
          if (alpha) {
            assert(alpha > 4, `alpha fringe ${direction}:${i}`);
            opaque++;
            margin = Math.min(margin, x, y, 447 - x, 447 - y);
          } else
            assert(
              cell[at] === 0 && cell[at + 1] === 0 && cell[at + 2] === 0,
              `transparent RGB ${direction}:${i}`,
            );
          if (index === 0) {
            const inside = x >= 96 && x < 352 && y >= 64 && y < 320,
              offset = ((y - 64) * 256 + x - 96) * 4;
            for (let channel = 0; channel < 4; channel++)
              assert(
                cell[at + channel] === (inside ? idle[offset + channel] : 0),
                `idle endpoint pixels ${direction}:${i}`,
              );
          }
        }
      assert(
        opaque > 3000 && margin >= 8,
        `alpha containment ${direction}:${i}`,
      );
    }
    assert(
      view.frames[13].pixelSha256 === view.frames[14].pixelSha256 &&
        view.frames[14].pixelSha256 === view.frames[15].pixelSha256 &&
        view.frames[15].fallRadians >= 1.5 &&
        view.frames[15].hipDrop === 0,
      `stable terminal ${direction}`,
    );
    results[direction] = {
      frames: 16,
      clips: 1,
      bytes: png.length,
      decodedBytes: data.length,
      minimumMargin: margin,
    };
  }
  return results;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(await validateWarriorDeath(process.argv[2]));

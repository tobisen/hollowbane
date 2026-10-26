import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import { pathToFileURL } from "node:url";

export async function validateWarriorAttackDirections(
  directory = "public/dev/warrior-attack-directions",
) {
  const meta = JSON.parse(await readFile(`${directory}/warrior.json`, "utf8"));
  const approved = JSON.parse(
    await readFile("public/dev/warrior-combat/warrior.json", "utf8"),
  );
  const movement = JSON.parse(
    await readFile("public/dev/warrior-directions/warrior.json", "utf8"),
  );
  const hash = (v) => createHash("sha256").update(v).digest("hex");
  const assert = (ok, message) => {
    if (!ok) throw Error(`Warrior attack directions: ${message}`);
  };
  const angles = {
    n: 135,
    ne: 90,
    e: 45,
    se: 0,
    s: 315,
    sw: 270,
    w: 225,
    nw: 180,
  };
  assert(
    JSON.stringify(meta.directions) === JSON.stringify(Object.keys(angles)) &&
      Object.keys(meta.views).length === 8 &&
      meta.frames === 192,
    "direction inventory",
  );
  assert(
    meta.cell === 320 &&
      meta.columns === 6 &&
      meta.rows === 4 &&
      JSON.stringify(meta.root) === "[160,274]" &&
      JSON.stringify(meta.originalPixelOffset) === "[32,64]" &&
      meta.displayScale === 0.5 &&
      meta.blender === approved.blender &&
      meta.productionApproved === false,
    "fixed window/root/scale",
  );
  assert(
    JSON.stringify(meta.clips) === JSON.stringify(approved.clips),
    "impact timing",
  );
  for (const [key, file] of [
    ["rendererSha256", "assets/source/q3/warrior-attack-directions/render.py"],
    ["packagerSha256", "scripts/package-warrior-attack-directions.mjs"],
    ["rigSha256", "assets/source/q3/warrior-combat-se/warrior.blend"],
    ["southeastAtlasSha256", "public/dev/warrior-combat/warrior.png"],
    ["movementManifestSha256", "public/dev/warrior-directions/warrior.json"],
  ])
    assert(
      meta.provenance[key] === hash(await readFile(file)),
      `provenance ${key}`,
    );
  const approvedPixels = await sharp("public/dev/warrior-combat/warrior.png")
    .ensureAlpha()
    .raw()
    .toBuffer();
  const results = {};
  for (const direction of meta.directions) {
    const view = meta.views[direction],
      angle = (angles[direction] * Math.PI) / 180;
    assert(
      view.rotationDegrees === angles[direction] &&
        view.mirrored === false &&
        view.frames.length === 24 &&
        JSON.stringify(view.facing) ===
          JSON.stringify(movement.views[direction].facing),
      `orientation ${direction}`,
    );
    assert(view.atlas === `${direction}.png`, `atlas name ${direction}`);
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
      info.width === 1920 &&
        info.height === 1280 &&
        data.length === view.decodedBytes &&
        data.length === 9830400,
      `decoded contract ${direction}`,
    );
    const idle = await sharp(`public/dev/warrior-directions/${direction}.png`)
      .extract({ left: 0, top: 0, width: 256, height: 256 })
      .raw()
      .toBuffer();
    let margin = 320;
    for (const [i, f] of view.frames.entries()) {
      const original = approved.frames[i];
      assert(
        f.name ===
          `${original.action}-${direction}-${String(original.index).padStart(2, "0")}` &&
          f.action === original.action &&
          f.index === original.index &&
          f.phase === original.phase,
        `sequence/impact ${direction}:${i}`,
      );
      assert(
        f.x === (i % 6) * 320 &&
          f.y === Math.floor(i / 6) * 320 &&
          f.width === 320 &&
          f.height === 320,
        `region ${direction}:${i}`,
      );
      assert(
        f.root.length === 2 &&
          f.root.every(
            (v, axis) =>
              Number.isFinite(v) && Math.abs(v - meta.root[axis]) < 0.001,
          ) &&
          Object.keys(f.boneLengths).length === 15 &&
          Object.entries(original.boneLengths).every(
            ([name, length]) => Math.abs(f.boneLengths[name] - length) < 1e-5,
          ),
        `rig/root ${direction}:${i}`,
      );
      assert(
        f.feet.length === 2 &&
          f.feet.every((foot, j) => {
            const [x, y, z] = original.feet[j],
              rotated = [
                x * Math.cos(angle) - y * Math.sin(angle),
                x * Math.sin(angle) + y * Math.cos(angle),
                z,
              ];
            return (
              foot.length === 3 &&
              foot.every(
                (v, axis) =>
                  Number.isFinite(v) && Math.abs(v - rotated[axis]) < 1e-6,
              )
            );
          }),
        `rotated feet ${direction}:${i}`,
      );
      assert(
        f.weaponBounds.length === 4 &&
          f.weaponBounds.every((v) => Number.isFinite(v) && v >= 8 && v <= 312),
        `weapon clipping ${direction}:${i}`,
      );
      const cell = Buffer.alloc(320 * 320 * 4);
      for (let row = 0; row < 320; row++)
        data.copy(
          cell,
          row * 320 * 4,
          ((f.y + row) * 1920 + f.x) * 4,
          ((f.y + row) * 1920 + f.x + 320) * 4,
        );
      assert(hash(cell) === f.pixelSha256, `pixel identity ${direction}:${i}`);
      let opaque = 0;
      for (let y = 0; y < 320; y++)
        for (let x = 0; x < 320; x++) {
          const at = (y * 320 + x) * 4,
            a = cell[at + 3];
          if (a) {
            assert(a > 4, `alpha fringe ${direction}:${i}`);
            opaque++;
            margin = Math.min(margin, x, y, 319 - x, 319 - y);
          } else
            assert(
              cell[at] === 0 && cell[at + 1] === 0 && cell[at + 2] === 0,
              `transparent RGB ${direction}:${i}`,
            );
        }
      assert(
        opaque > 3000 && margin >= 8,
        `alpha containment ${direction}:${i}`,
      );
      const endpoint = [0, 11, 12, 23].includes(i);
      if (endpoint || direction === "se") {
        const source = direction === "se" ? approvedPixels : idle;
        for (let row = 0; row < 320; row++)
          for (let x = 0; x < 320; x++) {
            const at = (row * 320 + x) * 4,
              inside = x >= 32 && x < 288 && row >= 64;
            const offset =
              direction === "se"
                ? ((original.y + row - 64) * 1536 + original.x + x - 32) * 4
                : ((row - 64) * 256 + x - 32) * 4;
            for (let channel = 0; channel < 4; channel++)
              assert(
                cell[at + channel] === (inside ? source[offset + channel] : 0),
                `approved ${direction === "se" ? "SE" : "idle endpoint"} pixels ${direction}:${i}`,
              );
          }
      }
    }
    assert(
      view.frames[5].pixelSha256 !== view.frames[17].pixelSha256,
      `distinct impacts ${direction}`,
    );
    results[direction] = {
      frames: 24,
      clips: 2,
      bytes: png.length,
      decodedBytes: data.length,
      minimumMargin: margin,
    };
  }
  return results;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(await validateWarriorAttackDirections(process.argv[2]));

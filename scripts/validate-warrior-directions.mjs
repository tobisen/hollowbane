import sharp from "sharp";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { validateWarriorMovement } from "./validate-warrior-movement.mjs";

export async function validateWarriorDirections(
  directory = "public/dev/warrior-directions",
) {
  await validateWarriorMovement();
  const meta = JSON.parse(await readFile(`${directory}/warrior.json`, "utf8"));
  const approved = JSON.parse(
    await readFile("public/dev/warrior-movement/warrior.json", "utf8"),
  );
  const hash = (value) => createHash("sha256").update(value).digest("hex");
  const assert = (ok, message) => {
    if (!ok) throw Error(`Warrior directions: ${message}`);
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
    meta.directions.length === 8 &&
      meta.directions.every((d) => d in angles) &&
      new Set(meta.directions).size === meta.directions.length &&
      meta.frames === meta.directions.length * 40 &&
      Object.keys(meta.views).length === meta.directions.length,
    "direction inventory",
  );
  assert(
    meta.cellWidth === 256 &&
      meta.cellHeight === 264 &&
      meta.columns === 8 &&
      meta.rows === 5 &&
      JSON.stringify(meta.root) === JSON.stringify(approved.root) &&
      meta.displayScale === approved.displayScale &&
      meta.orthoScale === approved.orthoScale &&
      meta.blender === approved.blender &&
      !meta.productionApproved,
    "fixed window/root/scale/source",
  );
  assert(
    JSON.stringify(meta.clips) === JSON.stringify(approved.clips),
    "approved clip timing",
  );
  for (const [key, file] of [
    ["rendererSha256", "assets/source/q3/warrior-directions/render.py"],
    ["packagerSha256", "scripts/package-warrior-directions.mjs"],
    ["rigSha256", "assets/source/q3/warrior-movement-se/warrior.blend"],
    ["southeastAtlasSha256", "public/dev/warrior-movement/warrior.png"],
  ])
    assert(
      meta.provenance[key] === hash(await readFile(file)),
      `provenance ${key}`,
    );
  const results = {};
  for (const direction of meta.directions) {
    const view = meta.views[direction],
      angle = (angles[direction] * Math.PI) / 180;
    assert(
      view.rotationDegrees === angles[direction] &&
        view.mirrored === false &&
        view.frames.length === 40,
      `orientation ${direction}`,
    );
    assert(view.atlas === `${direction}.png`, `atlas name ${direction}`);
    const bytes = await readFile(`${directory}/${view.atlas}`);
    assert(
      hash(bytes) === view.atlasSha256 &&
        bytes.length === view.bytes &&
        bytes.length < 2 * 1024 * 1024,
      `atlas identity/budget ${direction}`,
    );
    const { data, info } = await sharp(bytes)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    assert(
      info.width === 2048 &&
        info.height === 1320 &&
        data.length === view.decodedBytes,
      `decoded contract ${direction}`,
    );
    let margin = 264;
    const pixels = [],
      unique = new Set();
    for (const [i, f] of view.frames.entries()) {
      const original = approved.frames[i];
      assert(
        f.name ===
          `${original.action}-${direction}-${String(original.index).padStart(2, "0")}` &&
          f.action === original.action &&
          f.index === original.index,
        `sequence ${direction}:${i}`,
      );
      assert(
        f.x === (i % 8) * 256 &&
          f.y === Math.floor(i / 8) * 264 &&
          f.width === 256 &&
          f.height === 264,
        `region ${direction}:${i}`,
      );
      assert(
        JSON.stringify(f.root) === JSON.stringify(original.root) &&
          Object.keys(f.boneLengths).length ===
            Object.keys(original.boneLengths).length &&
          Object.entries(original.boneLengths).every(
            ([name, length]) => Math.abs(f.boneLengths[name] - length) < 1e-5,
          ),
        `rig/root ${direction}:${i}`,
      );
      assert(f.contacts.length === 2, `contacts ${direction}:${i}`);
      for (let j = 0; j < 2; j++) {
        const foot = f.contacts[j],
          base = original.contacts[j],
          [x, y, z] = base.sole;
        const rotated = [
          x * Math.cos(angle) - y * Math.sin(angle),
          x * Math.sin(angle) + y * Math.cos(angle),
          z,
        ];
        assert(
          foot.side === base.side &&
            foot.planted === base.planted &&
            foot.pixel.length === 2 &&
            foot.pixel.every(Number.isFinite) &&
            foot.sole.every((v, axis) => Math.abs(v - rotated[axis]) < 1e-6),
          `rotated contact ${direction}:${i}`,
        );
      }
      assert(
        f.weaponBounds.length === 4 &&
          f.weaponBounds.every(Number.isFinite) &&
          f.weaponBounds[0] >= 8 &&
          f.weaponBounds[1] >= 8 &&
          f.weaponBounds[2] < 248 &&
          f.weaponBounds[3] < 256,
        `weapon containment ${direction}:${i}`,
      );
      const cell = await sharp(bytes)
        .extract({ left: f.x, top: f.y, width: 256, height: 264 })
        .raw()
        .toBuffer();
      assert(
        hash(cell) === f.pixelSha256 && !unique.has(f.pixelSha256),
        `pixel identity ${direction}:${i}`,
      );
      unique.add(f.pixelSha256);
      let opaque = 0,
        soft = 0;
      for (let y = 0; y < 264; y++)
        for (let x = 0; x < 256; x++) {
          const at = (y * 256 + x) * 4,
            a = cell[at + 3];
          if (a) {
            margin = Math.min(margin, x, y, 255 - x, 263 - y);
            assert(
              x >= 8 && x < 248 && y >= 8 && y < 256,
              `alpha containment ${direction}:${i}`,
            );
            assert(y < 255, `original render edge clipping ${direction}:${i}`);
            if (a >= 128) opaque++;
            else soft++;
          } else
            assert(
              cell[at] === 0 && cell[at + 1] === 0 && cell[at + 2] === 0,
              `transparent RGB ${direction}:${i}`,
            );
        }
      assert(
        opaque > 2500 && opaque < 18000 && soft / opaque < 0.15,
        `alpha fringe ${direction}:${i}`,
      );
      if (direction === "se") {
        const originalPixels = await sharp(
          "public/dev/warrior-movement/warrior.png",
        )
          .extract({
            left: original.x,
            top: original.y,
            width: 256,
            height: 256,
          })
          .raw()
          .toBuffer();
        assert(
          cell.subarray(0, originalPixels.length).equals(originalPixels),
          `approved SE pixels ${i}`,
        );
      }
      pixels.push(cell);
    }
    for (const [action, clip] of Object.entries(meta.clips)) {
      const loop = pixels.slice(clip.start, clip.start + clip.count);
      const distance = (a, b) =>
        a.reduce((sum, v, i) => sum + Math.abs(v - b[i]), 0);
      const maxStep = Math.max(
        ...loop.slice(1).map((p, i) => distance(p, loop[i])),
      );
      assert(
        distance(loop[0], loop.at(-1)) <= maxStep * 1.1,
        `loop seam ${direction}:${action}`,
      );
    }
    results[direction] = {
      frames: 40,
      bytes: bytes.length,
      decodedBytes: data.length,
      minimumMargin: margin,
    };
  }
  return results;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(
    JSON.stringify(await validateWarriorDirections(process.argv[2]), null, 2),
  );

import sharp from "sharp";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export async function validateWarriorMovement(
  directory = "public/dev/warrior-movement",
) {
  const meta = JSON.parse(await readFile(`${directory}/warrior.json`, "utf8"));
  const bytes = await readFile(`${directory}/warrior.png`);
  const hash = (data) => createHash("sha256").update(data).digest("hex");
  const assert = (ok, message) => {
    if (!ok) throw Error(`Warrior movement: ${message}`);
  };
  for (const [key, file] of [
    ["producerSha256", "assets/source/q3/warrior-movement-se/motion.py"],
    ["rigSha256", "assets/source/q3/warrior-movement-se/warrior.blend"],
    ["baseRigSha256", "assets/source/q3/warrior-rig-v2/warrior.blend"],
    ["referenceSha256", "public/assets/menu-warrior-v1.webp"],
  ])
    assert(
      hash(await readFile(file)) === meta.provenance[key],
      `provenance ${key}`,
    );
  assert(
    meta.blender === "4.5.3 LTS" &&
      meta.direction === "southeast" &&
      !meta.productionApproved,
    "preview source contract",
  );
  assert(
    meta.cell === 256 &&
      meta.columns === 8 &&
      meta.rows === 5 &&
      meta.frames.length === 40,
    "atlas contract",
  );
  assert(
    meta.root[0] === 128 && meta.root[1] === 210 && meta.displayScale === 0.5,
    "fixed root / display scale",
  );
  assert(
    bytes.length === meta.bytes &&
      bytes.length <= 2 * 1024 * 1024 &&
      hash(bytes) === meta.atlasSha256,
    "download identity/budget",
  );
  const { data, info } = await sharp(bytes)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert(
    info.width === 2048 &&
      info.height === 1280 &&
      data.length === meta.decodedBytes &&
      data.length === 10 * 1024 * 1024,
    "decoded budget",
  );
  for (const [name, start, count, speed, stride, duty] of [
    ["idle", 0, 8, 0, 0, 1],
    ["walk", 8, 16, 3, 1.65, 0.55],
    ["run", 24, 16, 5.4, 2.5, 0.34],
  ]) {
    const clip = meta.clips[name];
    assert(
      clip.start === start &&
        clip.count === count &&
        clip.strideMeters === stride &&
        clip.duty === duty,
      `clip ${name}`,
    );
    const worldStride =
      (((stride * Math.SQRT1_2 * 256) / meta.orthoScale) * 0.5) / 64;
    assert(
      name === "idle"
        ? clip.fps === 2.5
        : Math.abs(clip.worldStride - worldStride) < 1e-8 &&
            Math.abs((clip.fps / count) * worldStride - speed) < 1e-8,
      `displacement cadence ${name}`,
    );
  }
  const unique = new Set();
  let flightFrames = 0,
    minimumMargin = 256;
  for (const [i, f] of meta.frames.entries()) {
    const action = i < 8 ? "idle" : i < 24 ? "walk" : "run";
    const clip = meta.clips[action],
      index = i - clip.start;
    assert(
      f.name === `${action}-se-${String(index).padStart(2, "0")}` &&
        f.action === action &&
        f.index === index,
      `ordered frame ${i}`,
    );
    assert(
      f.x === (i % 8) * 256 &&
        f.y === Math.floor(i / 8) * 256 &&
        f.width === 256 &&
        f.height === 256,
      `atlas region ${i}`,
    );
    assert(
      f.root.every((v, j) => Math.abs(v - meta.root[j]) < 0.001),
      `root ${i}`,
    );
    for (const [name, length] of Object.entries(meta.frames[0].boneLengths))
      assert(
        Math.abs(f.boneLengths[name] - length) < 1e-5,
        `bone length ${i}:${name}`,
      );
    assert(
      f.contacts.length === 2 &&
        new Set(f.contacts.map((c) => c.side)).size === 2,
      `contacts ${i}`,
    );
    assert(
      f.contacts.every(
        (c) =>
          c.sole.every(Number.isFinite) &&
          c.sole[2] >= 0 &&
          (!c.planted || c.sole[2] === 0),
      ),
      `ground contact ${i}`,
    );
    const airborne = f.contacts.every((c) => !c.planted);
    if (action === "run" && airborne) flightFrames++;
    assert(action === "run" || !airborne, `walk support ${i}`);
    assert(
      f.weaponBounds.length === 4 &&
        f.weaponBounds.every(Number.isFinite) &&
        f.weaponBounds[0] >= 8 &&
        f.weaponBounds[1] >= 8 &&
        f.weaponBounds[2] < 248 &&
        f.weaponBounds[3] < 248,
      `weapon containment ${i}`,
    );
    const pixels = await sharp(bytes)
      .extract({ left: f.x, top: f.y, width: 256, height: 256 })
      .raw()
      .toBuffer();
    assert(
      hash(pixels) === f.pixelSha256 && !unique.has(f.pixelSha256),
      `frame identity/duplicate ${i}`,
    );
    unique.add(f.pixelSha256);
    let opaque = 0,
      soft = 0;
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++) {
        const at = (y * 256 + x) * 4,
          a = pixels[at + 3];
        if (a) {
          minimumMargin = Math.min(minimumMargin, x, y, 255 - x, 255 - y);
          assert(
            x >= 8 && x < 248 && y >= 8 && y < 248,
            `alpha containment ${i}`,
          );
        }
        if (a >= 128) opaque++;
        else if (a) soft++;
        else
          assert(
            pixels[at] === 0 && pixels[at + 1] === 0 && pixels[at + 2] === 0,
            `transparent RGB ${i}`,
          );
      }
    assert(
      opaque > 2500 && opaque < 18000 && soft / opaque < 0.15,
      `alpha occupancy/fringe ${i}`,
    );
    if (action !== "idle" && index > 0)
      for (const c of f.contacts) {
        const previous = meta.frames[i - 1].contacts.find(
          (p) => p.side === c.side,
        );
        if (c.planted && previous.planted)
          assert(
            Math.abs(
              c.sole[1] - previous.sole[1] - clip.strideMeters / clip.count,
            ) < 1e-8,
            `planted velocity ${i}`,
          );
      }
  }
  assert(
    flightFrames >= 4 &&
      meta.clips.run.strideMeters > meta.clips.walk.strideMeters,
    "distinct run flight/stride",
  );
  return {
    bytes: bytes.length,
    decodedBytes: data.length,
    frames: meta.frames.length,
    minimumMargin,
    flightFrames,
    walkCyclesPerSecond: meta.clips.walk.fps / 16,
    runCyclesPerSecond: meta.clips.run.fps / 16,
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(
    JSON.stringify(await validateWarriorMovement(process.argv[2]), null, 2),
  );

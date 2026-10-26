import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

export async function validateWarriorAttacks(
  directory = "public/dev/warrior-combat",
) {
  const meta = JSON.parse(await readFile(`${directory}/warrior.json`, "utf8"));
  const assert = (ok, message) => {
    if (!ok) throw Error(`Warrior attacks: ${message}`);
  };
  const hash = (value) => createHash("sha256").update(value).digest("hex");
  for (const [key, file] of [
    ["producerSha256", "assets/source/q3/warrior-combat-se/motion.py"],
    ["rigSha256", "assets/source/q3/warrior-combat-se/warrior.blend"],
    ["baseRigSha256", "assets/source/q3/warrior-rig-v2/warrior.blend"],
    ["referenceSha256", "public/assets/menu-warrior-v1.webp"],
  ])
    assert(
      meta.provenance[key] === hash(await readFile(file)),
      `provenance ${key}`,
    );
  assert(
    meta.direction === "se" &&
      meta.blender === "4.5.3 LTS" &&
      meta.productionApproved === false,
    "developer source",
  );
  assert(
    meta.cell === 256 &&
      meta.columns === 6 &&
      meta.rows === 4 &&
      meta.frames.length === 24,
    "atlas contract",
  );
  assert(
    JSON.stringify(meta.root) === "[128,210]" && meta.displayScale === 0.5,
    "root / scale",
  );
  for (const [action, start] of [
    ["primary", 0],
    ["secondary", 12],
  ]) {
    const clip = meta.clips[action];
    assert(
      clip.start === start &&
        clip.count === 12 &&
        clip.impact === 5 &&
        clip.loop === false,
      "phase contract",
    );
  }
  const png = await readFile(`${directory}/warrior.png`);
  assert(
    hash(png) === meta.atlasSha256 &&
      png.length === meta.bytes &&
      png.length <= 1024 * 1024,
    "atlas identity/budget",
  );
  const { data, info } = await sharp(png)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert(
    info.width === 1536 &&
      info.height === 1024 &&
      data.length === meta.decodedBytes &&
      data.length === 6 * 1024 * 1024,
    "decoded budget",
  );
  let minimumMargin = 256;
  for (const [i, f] of meta.frames.entries()) {
    const action = i < 12 ? "primary" : "secondary",
      index = i % 12;
    assert(
      f.name === `${action}-se-${String(index).padStart(2, "0")}` &&
        f.index === index &&
        f.action === action,
      "ordered frame",
    );
    assert(
      f.phase === (index < 5 ? "windup" : index === 5 ? "active" : "recovery"),
      "impact phase",
    );
    assert(
      f.root.every((v, axis) => Math.abs(v - meta.root[axis]) < 0.001) &&
        JSON.stringify(f.root) === JSON.stringify(meta.frames[0].root) &&
        JSON.stringify(f.feet) === JSON.stringify(meta.frames[0].feet),
      "root / foot stability",
    );
    assert(
      Object.keys(f.boneLengths).length === 15 &&
        Object.entries(f.boneLengths).every(
          ([name, length]) =>
            Math.abs(length - meta.frames[0].boneLengths[name]) < 1e-5,
        ),
      "rig lengths",
    );
    assert(
      f.x === (i % 6) * 256 &&
        f.y === Math.floor(i / 6) * 256 &&
        f.width === 256 &&
        f.height === 256,
      "frame region",
    );
    assert(
      f.weaponBounds.every((v) => Number.isFinite(v) && v >= 8 && v <= 248),
      "weapon clipping",
    );
    const pixels = await sharp(png)
      .extract({ left: f.x, top: f.y, width: 256, height: 256 })
      .raw()
      .toBuffer();
    assert(hash(pixels) === f.pixelSha256, "frame identity");
    let opaque = 0;
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++) {
        const at = (y * 256 + x) * 4,
          alpha = pixels[at + 3];
        if (alpha === 0)
          assert(
            pixels[at] === 0 && pixels[at + 1] === 0 && pixels[at + 2] === 0,
            "transparent RGB halo",
          );
        else {
          assert(alpha > 4, "resampling fringe");
          opaque++;
          minimumMargin = Math.min(minimumMargin, x, y, 255 - x, 255 - y);
        }
      }
    assert(opaque > 3000 && minimumMargin >= 8, "alpha clipping / empty frame");
  }
  assert(
    meta.frames[5].pixelSha256 !== meta.frames[17].pixelSha256,
    "distinct attack impacts",
  );
  return {
    frames: 24,
    clips: 2,
    bytes: png.length,
    decodedBytes: data.length,
    minimumMargin,
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(await validateWarriorAttacks(process.argv[2]));

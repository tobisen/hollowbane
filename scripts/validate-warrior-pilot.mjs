import sharp from "sharp";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export async function validateWarriorPilot(
  directory = "public/dev/warrior-pilot",
) {
  const meta = JSON.parse(await readFile(`${directory}/warrior.json`, "utf8"));
  const bytes = await readFile(`${directory}/warrior.png`);
  const assert = (ok, reason) => {
    if (!ok) throw Error(`Warrior pilot: ${reason}`);
  };
  const hash = (data) => createHash("sha256").update(data).digest("hex");
  for (const [key, file] of [
    ["producerSha256", "assets/source/q3/warrior-rig-v1/warrior.py"],
    ["rigSha256", "assets/source/q3/warrior-rig-v1/warrior.blend"],
    ["referenceSha256", "public/assets/menu-warrior-v1.webp"],
  ])
    assert(
      hash(await readFile(file)) === meta.provenance?.[key],
      `source provenance ${key}`,
    );
  assert(
    meta.atlas === "warrior.png" && meta.blender === "4.5.3 LTS",
    "export format / renderer version",
  );
  assert(
    meta.version === 1 &&
      meta.direction === "southeast" &&
      meta.cell === 256 &&
      meta.columns === 6 &&
      meta.rows === 4 &&
      meta.frames.length === 24,
    "atlas contract",
  );
  assert(
    JSON.stringify(meta.root) === "[128,210]" &&
      meta.productionApproved === false,
    "root / preview isolation",
  );
  assert(
    bytes.length === meta.bytes &&
      bytes.length <= 768 * 1024 &&
      hash(bytes) === meta.atlasSha256,
    "file size / atlas identity",
  );
  const { data, info } = await sharp(bytes)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert(
    info.width === 1536 &&
      info.height === 1024 &&
      data.length === meta.decodedBytes &&
      data.length <= 6 * 1024 * 1024,
    "dimensions / decoded budget",
  );
  assert(
    JSON.stringify(meta.clips) ===
      JSON.stringify({
        idle: { start: 0, count: 8, fps: 6 },
        walk: { start: 8, count: 16, fps: 18 },
      }),
    "clip sequence",
  );
  const unique = new Set();
  const reports = [];
  for (const [i, f] of meta.frames.entries()) {
    const action = i < 8 ? "idle" : "walk",
      index = i < 8 ? i : i - 8;
    assert(
      f.name === `${action}-se-${String(index).padStart(2, "0")}` &&
        f.action === action &&
        f.index === index &&
        f.x === (i % 6) * 256 &&
        f.y === Math.floor(i / 6) * 256 &&
        f.width === 256 &&
        f.height === 256,
      `sequence / region ${i}`,
    );
    assert(
      f.root.every((v, j) => Math.abs(v - meta.root[j]) < 0.001),
      `root alignment ${i}`,
    );
    const pixels = await sharp(bytes)
      .extract({ left: f.x, top: f.y, width: 256, height: 256 })
      .raw()
      .toBuffer();
    assert(hash(pixels) === f.pixelSha256, `frame identity ${i}`);
    assert(!unique.has(f.pixelSha256), `duplicate pose ${i}`);
    unique.add(f.pixelSha256);
    let opaque = 0,
      soft = 0,
      isolatedSoft = 0;
    const bounds = [256, 256, -1, -1];
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++) {
        const a = pixels[(y * 256 + x) * 4 + 3];
        if (a > 0) {
          bounds[0] = Math.min(bounds[0], x);
          bounds[1] = Math.min(bounds[1], y);
          bounds[2] = Math.max(bounds[2], x);
          bounds[3] = Math.max(bounds[3], y);
          assert(
            x >= 8 && x < 248 && y >= 8 && y < 248,
            `alpha containment ${i}`,
          );
        }
        if (a >= 128) opaque++;
        else if (a > 0) {
          soft++;
          let near = false;
          for (let dy = -2; dy <= 2; dy++)
            for (let dx = -2; dx <= 2; dx++) {
              const nx = x + dx,
                ny = y + dy;
              if (
                nx >= 0 &&
                nx < 256 &&
                ny >= 0 &&
                ny < 256 &&
                pixels[(ny * 256 + nx) * 4 + 3] >= 128
              )
                near = true;
            }
          if (!near) isolatedSoft++;
        } else
          assert(
            pixels[(y * 256 + x) * 4] === 0 &&
              pixels[(y * 256 + x) * 4 + 1] === 0 &&
              pixels[(y * 256 + x) * 4 + 2] === 0,
            `transparent RGB ${i}`,
          );
      }
    assert(opaque > 2500 && opaque < 18000, `occupancy ${i}`);
    assert(
      soft / opaque < 0.15 && isolatedSoft < 6,
      `alpha fringe ${i}: opaque=${opaque}, soft=${soft}, isolated=${isolatedSoft}`,
    );
    assert(
      f.weaponBounds.length === 4 &&
        f.weaponBounds.every(Number.isFinite) &&
        f.weaponBounds[0] >= 8 &&
        f.weaponBounds[1] >= 8 &&
        f.weaponBounds[2] < 248 &&
        f.weaponBounds[3] < 248 &&
        f.weaponBounds[0] < f.weaponBounds[2] &&
        f.weaponBounds[1] < f.weaponBounds[3],
      `weapon containment ${i}`,
    );
    for (const [bone, length] of Object.entries(meta.frames[0].boneLengths))
      assert(
        Math.abs(f.boneLengths[bone] - length) < 0.00001,
        `bone scale ${i}:${bone}`,
      );
    assert(
      f.contacts.length === 2 && f.contacts.some((c) => c.planted),
      `support contact ${i}`,
    );
    for (const c of f.contacts)
      assert(
        c.sole.every(Number.isFinite) &&
          c.sole[2] >= 0 &&
          (!c.planted || c.sole[2] === 0),
        `ground contact ${i}`,
      );
    reports.push({ name: f.name, opaque, soft, isolatedSoft, bounds });
  }
  // Ground anchoring includes linear stance travel, not a fixed foot in mid-air.
  const walk = meta.frames.slice(8);
  for (const side of ["L", "R"])
    for (let i = 1; i < 16; i++) {
      const a = walk[i - 1].contacts.find((c) => c.side === side),
        b = walk[i].contacts.find((c) => c.side === side);
      if (a.planted && b.planted)
        assert(
          Math.abs(b.sole[1] - a.sole[1] - 0.9 / 16) < 0.00001,
          `stance velocity ${side}:${i}`,
        );
    }
  return {
    bytes: bytes.length,
    decodedBytes: data.length,
    frames: reports,
    artApproval: "manual review required",
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(
    JSON.stringify(await validateWarriorPilot(process.argv[2]), null, 2),
  );

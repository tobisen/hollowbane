import { afterEach, expect, it } from "vitest";
import { mkdtemp, copyFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import source from "../public/dev/warrior-movement/warrior.json";
import { validateWarriorMovement } from "../scripts/validate-warrior-movement.mjs";
import sharp from "sharp";
const temporary: string[] = [];
it("each loop seam is no larger than its largest internal pose step", async () => {
  for (const clip of Object.values(source.clips)) {
    const pixels: Uint8Array[] = [];
    for (const frame of source.frames.slice(
      clip.start,
      clip.start + clip.count,
    ))
      pixels.push(
        await sharp("public/dev/warrior-movement/warrior.png")
          .extract({ left: frame.x, top: frame.y, width: 256, height: 256 })
          .raw()
          .toBuffer(),
      );
    const distance = (a: Uint8Array, b: Uint8Array) =>
      a.reduce((total, v, i) => total + Math.abs(v - b[i]!), 0);
    const largest = Math.max(
      ...pixels.slice(1).map((p, i) => distance(p, pixels[i]!)),
    );
    expect(distance(pixels[0]!, pixels.at(-1)!)).toBeLessThanOrEqual(
      largest * 1.1,
    );
  }
});
afterEach(async () => {
  await Promise.all(
    temporary.splice(0).map((p) => rm(p, { recursive: true, force: true })),
  );
});
it("audits fixed rig/root, all40 unique poses, planted velocity and a distinct flight gait", async () => {
  const result = await validateWarriorMovement();
  expect(result.frames).toBe(40);
  expect(result.flightFrames).toBe(4);
  expect(result.walkCyclesPerSecond).toBeLessThan(3);
  expect(result.runCyclesPerSecond).toBeGreaterThan(result.walkCyclesPerSecond);
  expect(result.decodedBytes).toBe(10 * 1024 * 1024);
});
it.each(["root", "stance", "sequence", "flight"])(
  "rejects invalid %s movement evidence",
  async (kind) => {
    const path = await mkdtemp(join(tmpdir(), "warrior-cadence-"));
    temporary.push(path);
    const meta = structuredClone(source);
    if (kind === "root")
      meta.frames[24]!.root[0] = meta.frames[24]!.root[0]! + 1;
    if (kind === "stance")
      meta.frames[9]!.contacts[0]!.sole[1] =
        meta.frames[9]!.contacts[0]!.sole[1]! + 0.01;
    if (kind === "sequence") meta.frames[24]!.index = 1;
    if (kind === "flight")
      for (const frame of meta.frames.slice(24))
        for (const foot of frame.contacts) {
          foot.planted = true;
          foot.sole[2] = 0;
        }
    await copyFile(
      "public/dev/warrior-movement/warrior.png",
      join(path, "warrior.png"),
    );
    await writeFile(join(path, "warrior.json"), JSON.stringify(meta));
    await expect(validateWarriorMovement(path)).rejects.toThrow(
      /root|planted velocity|ordered frame|flight/,
    );
  },
);

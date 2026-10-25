import { afterEach, expect, it } from "vitest";
import { mkdtemp, copyFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";
import source from "../public/dev/warrior-pilot/warrior.json";
import { validateWarriorPilot } from "../scripts/validate-warrior-pilot.mjs";
const temporary: string[] = [];
afterEach(async () => {
  await Promise.all(
    temporary
      .splice(0)
      .map((path) => rm(path, { recursive: true, force: true })),
  );
});
async function fixture() {
  const path = await mkdtemp(join(tmpdir(), "warrior-validation-"));
  temporary.push(path);
  await copyFile(
    "public/dev/warrior-pilot/warrior.png",
    join(path, "warrior.png"),
  );
  return { path, meta: structuredClone(source) };
}
it("audits all 24 pilot frames and strict decoded/download budgets", async () => {
  const result = await validateWarriorPilot();
  expect(result.frames).toHaveLength(24);
  expect(result.decodedBytes).toBe(6 * 1024 * 1024);
});
it.each(["root", "sequence", "weapon", "scale"])(
  "rejects corrupted %s metadata",
  async (kind) => {
    const { path, meta } = await fixture();
    if (kind === "root") meta.frames[1]!.root[0] = 129;
    if (kind === "sequence") meta.frames[1]!.index = 4;
    if (kind === "weapon") meta.frames[1]!.weaponBounds[2] = 256;
    if (kind === "scale") meta.frames[1]!.boneLengths.head += 0.01;
    await writeFile(join(path, "warrior.json"), JSON.stringify(meta));
    await expect(validateWarriorPilot(path)).rejects.toThrow(
      /root alignment|sequence|weapon containment|bone scale/,
    );
  },
);
it("rejects clipped pixels even when the file and frame hashes are recomputed", async () => {
  const { path, meta } = await fixture();
  const pixels = await sharp(join(path, "warrior.png")).raw().toBuffer();
  pixels.set([255, 255, 255, 255], 0);
  const bytes = await sharp(pixels, {
    raw: { width: 1536, height: 1024, channels: 4 },
  })
    .png()
    .toBuffer();
  const hash = (value: Uint8Array) =>
    createHash("sha256").update(value).digest("hex");
  meta.atlasSha256 = hash(bytes);
  meta.bytes = bytes.length;
  meta.frames[0]!.pixelSha256 = hash(
    await sharp(bytes)
      .extract({ left: 0, top: 0, width: 256, height: 256 })
      .raw()
      .toBuffer(),
  );
  await writeFile(join(path, "warrior.png"), bytes);
  await writeFile(join(path, "warrior.json"), JSON.stringify(meta));
  await expect(validateWarriorPilot(path)).rejects.toThrow("alpha containment");
});

it("audits refined art while preserving accepted roots, rig lengths and foot contacts", async () => {
  const { readFile } = await import("node:fs/promises");
  const refined = JSON.parse(
    await readFile("public/dev/warrior-refined/warrior.json", "utf8"),
  ) as typeof source;
  const result = await validateWarriorPilot("public/dev/warrior-refined");
  expect(result.frames).toHaveLength(24);
  expect(refined.productionApproved).toBe(false);
  expect(refined.atlasSha256).not.toBe(source.atlasSha256);
  for (const [index, frame] of refined.frames.entries()) {
    const approved = source.frames[index]!;
    expect(frame.root).toEqual(approved.root);
    expect(frame.boneLengths).toEqual(approved.boneLengths);
    expect(frame.contacts).toEqual(approved.contacts);
    expect(frame.weaponBounds).toEqual(approved.weaponBounds);
  }
});

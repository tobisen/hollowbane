import { expect, it } from "vitest";
import { mkdtemp, readFile, writeFile, copyFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateWarriorAttacks } from "../scripts/validate-warrior-attacks.mjs";
import sharp from "sharp";

it("validates the two original nonlooping attacks, alpha/root/rig and source fingerprints", async () => {
  expect(await validateWarriorAttacks()).toMatchObject({
    frames: 24,
    clips: 2,
    decodedBytes: 6 * 1024 * 1024,
    minimumMargin: 14,
  });
});
it("both attack endpoints match approved idle pixels exactly, preventing the observed leg snap", async () => {
  const expected = await sharp("public/dev/warrior-movement/warrior.png")
    .extract({ left: 0, top: 0, width: 256, height: 256 })
    .raw()
    .toBuffer();
  const meta = JSON.parse(
    await readFile("public/dev/warrior-combat/warrior.json", "utf8"),
  );
  for (const i of [0, 11, 12, 23]) {
    const f = meta.frames[i];
    const actual = await sharp("public/dev/warrior-combat/warrior.png")
      .extract({ left: f.x, top: f.y, width: 256, height: 256 })
      .raw()
      .toBuffer();
    expect(actual.equals(expected)).toBe(true);
  }
});
it.each(["impact", "root", "foot", "weapon", "region", "source"])(
  "rejects %s drift",
  async (kind) => {
    const dir = await mkdtemp(join(tmpdir(), "warrior-attack-"));
    try {
      const meta = JSON.parse(
        await readFile("public/dev/warrior-combat/warrior.json", "utf8"),
      );
      if (kind === "impact") meta.clips.primary.impact = 4;
      if (kind === "root") meta.frames[5].root[0]++;
      if (kind === "foot") meta.frames[5].feet[0][0] += 0.1;
      if (kind === "weapon") meta.frames[5].weaponBounds[2] = 255;
      if (kind === "region") meta.frames[5].x = 0;
      if (kind === "source") meta.provenance.producerSha256 = "bad";
      await writeFile(join(dir, "warrior.json"), JSON.stringify(meta));
      await copyFile(
        "public/dev/warrior-combat/warrior.png",
        join(dir, "warrior.png"),
      );
      await expect(validateWarriorAttacks(dir)).rejects.toThrow(
        /phase contract|root \/ foot|weapon clipping|frame region|provenance/,
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  },
);

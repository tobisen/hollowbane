import { expect, it } from "vitest";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateWarriorAttackDirections } from "../scripts/validate-warrior-attack-directions.mjs";

it("validates all eight nonmirrored attack views, exact approved pixels and recovery endpoints", async () => {
  const result = await validateWarriorAttackDirections();
  expect(Object.keys(result)).toEqual([
    "n",
    "ne",
    "e",
    "se",
    "s",
    "sw",
    "w",
    "nw",
  ]);
  expect(Object.values(result).reduce((sum, v) => sum + v.frames, 0)).toBe(192);
  expect(
    Math.min(...Object.values(result).map((v) => v.minimumMargin)),
  ).toBeGreaterThanOrEqual(8);
});
it.each(["mirror", "root", "feet", "impact", "weapon", "pixels", "source"])(
  "rejects %s drift before candidate acceptance",
  async (kind) => {
    const dir = await mkdtemp(join(tmpdir(), "warrior-attack-views-"));
    try {
      const meta = JSON.parse(
        await readFile(
          "public/dev/warrior-attack-directions/warrior.json",
          "utf8",
        ),
      );
      if (kind === "mirror") meta.views.n.mirrored = true;
      if (kind === "root") meta.views.n.frames[0].root[1]++;
      if (kind === "feet") meta.views.n.frames[0].feet[0][0] += 0.1;
      if (kind === "impact") meta.clips.primary.impact = 4;
      if (kind === "weapon") meta.views.n.frames[0].weaponBounds[0] = 0;
      if (kind === "pixels") meta.views.n.frames[0].pixelSha256 = "bad";
      if (kind === "source") meta.provenance.rigSha256 = "bad";
      await writeFile(join(dir, "warrior.json"), JSON.stringify(meta));
      await copyFile(
        "public/dev/warrior-attack-directions/n.png",
        join(dir, "n.png"),
      );
      await expect(validateWarriorAttackDirections(dir)).rejects.toThrow(
        /orientation|rig\/root|rotated feet|impact timing|weapon clipping|pixel identity|provenance/,
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  },
);

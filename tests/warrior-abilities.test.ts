import { expect, it } from "vitest";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateWarriorAbilities } from "../scripts/validate-warrior-abilities.mjs";

it("validates both existing abilities in all eight views with exact idle endpoints", async () => {
  const result = await validateWarriorAbilities();
  expect(Object.keys(result)).toHaveLength(8);
  expect(Object.values(result).reduce((sum, v) => sum + v.frames, 0)).toBe(192);
  expect(
    Math.min(...Object.values(result).map((v) => v.minimumMargin)),
  ).toBeGreaterThanOrEqual(8);
});

it.each(["mirror", "root", "feet", "activation", "weapon", "pixels", "source"])(
  "rejects ability %s drift",
  async (kind) => {
    const dir = await mkdtemp(join(tmpdir(), "warrior-ability-"));
    try {
      const meta = JSON.parse(
        await readFile("public/dev/warrior-abilities/warrior.json", "utf8"),
      );
      if (kind === "mirror") meta.views.n.mirrored = true;
      if (kind === "root") meta.views.n.frames[0].root[1]++;
      if (kind === "feet") meta.views.n.frames[0].feet[0][0] += 0.1;
      if (kind === "activation") meta.clips["oath-echo"].impact = 4;
      if (kind === "weapon") meta.views.n.frames[0].weaponBounds[0] = 0;
      if (kind === "pixels") meta.views.n.frames[0].pixelSha256 = "bad";
      if (kind === "source") meta.provenance.rigSha256 = "bad";
      await writeFile(join(dir, "warrior.json"), JSON.stringify(meta));
      await copyFile("public/dev/warrior-abilities/n.png", join(dir, "n.png"));
      await expect(validateWarriorAbilities(dir)).rejects.toThrow(
        /orientation|rig\/root|rotated feet|activation timing|weapon containment|pixel identity|provenance/,
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  },
);

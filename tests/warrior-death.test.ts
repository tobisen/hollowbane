import { expect, it } from "vitest";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateWarriorDeath } from "../scripts/validate-warrior-death.mjs";

it("validates all eight death falls, grounded heels, exact idle start and stable terminal pixels", async () => {
  const result = await validateWarriorDeath();
  expect(Object.keys(result)).toHaveLength(8);
  expect(Object.values(result).reduce((sum, v) => sum + v.frames, 0)).toBe(128);
  expect(
    Math.min(...Object.values(result).map((v) => v.minimumMargin)),
  ).toBeGreaterThanOrEqual(8);
});

it.each([
  "mirror",
  "root",
  "feet",
  "activation",
  "weapon",
  "pixels",
  "source",
  "ground",
  "terminal",
])("rejects death %s drift", async (kind) => {
  const dir = await mkdtemp(join(tmpdir(), "warrior-death-"));
  try {
    const meta = JSON.parse(
      await readFile("public/dev/warrior-death/warrior.json", "utf8"),
    );
    if (kind === "mirror") meta.views.n.mirrored = true;
    if (kind === "root") meta.views.n.frames[0].root[1]++;
    if (kind === "feet") meta.views.n.frames[0].feet[0][0] += 0.1;
    if (kind === "activation") meta.clips.death.loop = true;
    if (kind === "weapon") meta.views.n.frames[0].weaponBounds[0] = 0;
    if (kind === "pixels") meta.views.n.frames[0].pixelSha256 = "bad";
    if (kind === "source") meta.provenance.rigSha256 = "bad";
    if (kind === "ground") meta.views.n.frames[0].groundMinimum = -1;
    if (kind === "terminal") meta.views.n.frames[15].fallRadians = 0;
    await writeFile(join(dir, "warrior.json"), JSON.stringify(meta));
    await copyFile("public/dev/warrior-death/n.png", join(dir, "n.png"));
    await expect(validateWarriorDeath(dir)).rejects.toThrow(
      /orientation|rig\/root|planted collapse|clip contract|weapon containment|pixel identity|provenance|ground\/geometry|stable terminal/,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

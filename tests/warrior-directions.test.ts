import { afterEach, expect, it } from "vitest";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateWarriorDirections } from "../scripts/validate-warrior-directions.mjs";

const temporary: string[] = [];
afterEach(async () => {
  await Promise.all(
    temporary.splice(0).map((p) => rm(p, { recursive: true, force: true })),
  );
});
it("audits the eight original rig views, 320 padded poses, unchanged SE pixels and loop seams", async () => {
  const result = await validateWarriorDirections();
  expect(Object.keys(result).sort()).toEqual([
    "e",
    "n",
    "ne",
    "nw",
    "s",
    "se",
    "sw",
    "w",
  ]);
  expect(Object.values(result).reduce((sum, r) => sum + r.frames, 0)).toBe(320);
  expect(
    Math.min(...Object.values(result).map((r) => r.minimumMargin)),
  ).toBeGreaterThanOrEqual(8);
  expect(result.s!.minimumMargin).toBeGreaterThanOrEqual(12);
}, 15_000);
it.each(["mirroring", "root", "rotation", "contact", "timing"])(
  "rejects %s drift",
  async (kind) => {
    const directory = await mkdtemp(join(tmpdir(), "warrior-directions-"));
    temporary.push(directory);
    const meta = JSON.parse(
      await readFile("public/dev/warrior-directions/warrior.json", "utf8"),
    );
    if (kind === "mirroring") meta.views.n.mirrored = true;
    if (kind === "rotation") meta.views.n.rotationDegrees = 180;
    if (kind === "root") meta.views.n.frames[0].root[0] += 1;
    if (kind === "contact") meta.views.n.frames[0].contacts[0].sole[0] += 0.1;
    if (kind === "timing") meta.clips.run.fps += 1;
    await copyFile(
      "public/dev/warrior-directions/n.png",
      join(directory, "n.png"),
    );
    await writeFile(join(directory, "warrior.json"), JSON.stringify(meta));
    await expect(validateWarriorDirections(directory)).rejects.toThrow(
      /orientation|rig\/root|rotated contact|clip timing/,
    );
  },
);

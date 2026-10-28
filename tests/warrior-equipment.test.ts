import { describe, expect, it } from "vitest";
import { mkdtemp, cp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateWarriorEquipment } from "../scripts/validate-warrior-equipment.mjs";

describe("original Warrior shield assets", () => {
  it("validates all poses and limited body variants in two bounded atlases", async () => {
    expect(await validateWarriorEquipment()).toEqual({
      pngBytes: 3688973,
      decodedBytes: 24 * 1024 ** 2,
      atlases: 2,
      frames: 880,
      bodyFrames: 64,
    });
  });
  it("rejects a translated idle alias even when the atlas PNG and cropped pixels are unchanged", async () => {
    const directory = await mkdtemp(join(tmpdir(), "hollowbane-shield-alias-"));
    try {
      await cp("public/dev/warrior-equipment", directory, { recursive: true });
      const file = join(directory, "shield.json");
      const atlas = JSON.parse(await readFile(file, "utf8")) as {
        frames: Record<string, { spriteSourceSize: { x: number } }>;
      };
      atlas.frames["primary-se-00"]!.spriteSourceSize.x++;
      await writeFile(file, JSON.stringify(atlas));
      await expect(validateWarriorEquipment(directory)).rejects.toThrow(
        "packed alias primary-se-00",
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

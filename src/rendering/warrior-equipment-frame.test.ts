import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import equipment from "../../public/dev/warrior-equipment/equipment.json";
import assets from "./warrior-equipment-assets.json";
import { warriorEquipmentFrame } from "./warrior-equipment-frame";
import type { WarriorSet } from "./warrior-pose";

describe("production equipment atlas identity", () => {
  it("matches every approved pose and packed alias without a second animation clock", () => {
    const folders: Record<WarriorSet, string> = {
      movement: "warrior-directions",
      attacks: "warrior-attack-directions",
      abilities: "warrior-abilities",
      hit: "warrior-reactions",
      death: "warrior-death",
    };
    let count = 0;
    for (const [set, folder] of Object.entries(folders)) {
      const manifest = JSON.parse(
        readFileSync(`public/dev/${folder}/warrior.json`, "utf8"),
      ) as { views: Record<string, { frames: { action: string }[] }> };
      for (const [direction, view] of Object.entries(manifest.views))
        for (const [frame, record] of view.frames.entries()) {
          const pose = { set: set as WarriorSet, frame, clip: record.action };
          const expected = (
            equipment.framesByPose as Record<string, Record<string, string[]>>
          )[set]![direction]![frame];
          expect(warriorEquipmentFrame(pose, direction)).toBe(expected);
          count++;
        }
    }
    expect(count).toBe(880);
    expect(
      warriorEquipmentFrame({ set: "death", frame: 16, clip: "death" }, "se"),
    ).toBeNull();
    expect(
      warriorEquipmentFrame({ set: "movement", frame: 8, clip: "idle" }, "se"),
    ).toBeNull();
    expect(
      warriorEquipmentFrame({ set: "hit", frame: 0.5, clip: "hit" }, "se"),
    ).toBeNull();
    expect(
      warriorEquipmentFrame({ set: "hit", frame: 0, clip: "hit" }, "future"),
    ).toBeNull();
  });
  it("publishes only the exact verified PNG/JSON bytes behind production aliases", () => {
    for (const file of assets.files) {
      const bytes = readFileSync(`public/dev/${assets.source}/${file.source}`);
      expect(bytes.length).toBe(file.bytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        file.sha256,
      );
      expect(file.file).toMatch(/^assets\/warrior\/equipment-/);
    }
    expect(
      assets.textures.shield.decodedBytes + assets.textures.body.decodedBytes,
    ).toBe(24 * 1024 ** 2);
    expect(assets.configuration.main).toBe("ash-blade");
    expect(assets.configuration.off).toBe("bark-guard");
  });
});

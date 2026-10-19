import Phaser from "phaser";
import type { AreaLayout } from "../simulation/area-anchors";
import { onGround } from "../world/navigation";
/** Original logical geometry preview; detailed biome artwork remains W3. */
export function drawWorldFloor(
  ink: Phaser.GameObjects.Graphics,
  layout: AreaLayout,
): void {
  ink.clear();
  const t = layout.map.terrain;
  const dungeon = layout.map.area === "ancient-crypt";
  for (let y = 0; y < t.height; y++)
    for (let x = 0; x < t.width; x++) {
      const ground = t.cells[y * t.width + x] === "ground";
      const left = t.origin.x + x * t.cellSize,
        top = t.origin.y + y * t.cellSize;
      const corners = [
        { x: left, y: top },
        { x: left + t.cellSize, y: top },
        { x: left + t.cellSize, y: top + t.cellSize },
        { x: left, y: top + t.cellSize },
      ].map((p) => new Phaser.Math.Vector2(onGround(p).x, onGround(p).y));
      ink
        .fillStyle(
          ground
            ? dungeon
              ? 0x44424b
              : 0x354735
            : dungeon
              ? 0x17151f
              : 0x111e19,
          1,
        )
        .fillPoints(corners, true);
      if (ground)
        ink
          .lineStyle(1, dungeon ? 0x68616c : 0x52634a, 0.35)
          .strokePoints(corners, true);
    }
  for (const object of layout.map.objects) {
    const p = onGround(object.position);
    ink
      .fillStyle(dungeon ? 0x8b8291 : 0x787761, 1)
      .fillEllipse(
        p.x,
        p.y,
        object.radius * 128 * Math.SQRT2,
        object.radius * 64 * Math.SQRT2,
      )
      .lineStyle(2, 0xb7ad91, 0.8)
      .strokeEllipse(
        p.x,
        p.y,
        object.radius * 128 * Math.SQRT2,
        object.radius * 64 * Math.SQRT2,
      );
  }
}

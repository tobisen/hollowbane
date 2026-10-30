import Phaser from "phaser";
import type { AreaMap } from "../simulation/area-map";
import {
  act1CanopyOverlapsGround,
  act1GroundContours,
  act1Project,
} from "../world/act1-view";
import { appearanceHash } from "../world/environment-view";
import type { Act1EnvironmentReport } from "./act1-environment";

/** Opt-in painted environment. No dynamic alpha, foliage motion or point lights. */
export function drawClassicEnvironment(
  scene: Phaser.Scene,
  map: AreaMap,
): Act1EnvironmentReport {
  const t = map.terrain;
  const earthBase = scene.add.graphics().setDepth(-1000);
  earthBase.fillStyle(0x272d21).fillRect(-5000, -2000, 12000, 10000);
  // Trace complete contours rather than showing each collision cell as a stair step.
  // Reverse-wound inner islands retain their darker, non-walkable appearance.
  const contours = act1GroundContours(map)
    .map((points) => ({
      points,
      area: points.reduce((sum, a, i) => {
        const b = points[(i + 1) % points.length]!;
        return sum + a.x * b.y - b.x * a.y;
      }, 0),
    }))
    .sort((a, b) => b.area - a.area);
  for (const contour of contours) {
    let points = contour.points;
    for (let pass = 0; pass < 3; pass++)
      points = points.flatMap((a, i) => {
        const b = points[(i + 1) % points.length]!;
        return [
          { x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 },
          { x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 },
        ];
      });
    const projected = points.map((point) => {
      const p = act1Project(point, "b");
      return new Phaser.Math.Vector2(p.x, p.y);
    });
    earthBase
      .fillStyle(contour.area > 0 ? 0x383b2d : 0x272d21)
      .fillPoints(projected, true);
    earthBase.lineStyle(24, 0x303628, 0.4).strokePoints(projected, true);
  }
  // One restrained world-fixed painted layer, no mask seams or dynamic alpha.
  scene.add
    .tileSprite(768, 2800, 10000, 8000, "classic-earth")
    .setTileScale(2)
    .setDepth(-998)
    .setAlpha(0.38);
  const shadows = scene.add.graphics().setDepth(-997);
  const report: Act1EnvironmentReport = {
    treeCount: 0,
    fullCanopies: 0,
    cutawayTrees: 0,
    landmark: { x: 43, y: 12 },
  };
  const ground = (x: number, y: number) =>
    x >= 0 &&
    y >= 0 &&
    x < t.width &&
    y < t.height &&
    t.cells[y * t.width + x] === "ground";
  for (let y = 1; y < t.height - 1; y += 2)
    for (let x = 1; x < t.width - 1; x += 2) {
      const hash = appearanceHash(map.seed + 11, x, y);
      if (
        ground(x, y) ||
        hash % 5 === 0 ||
        ![-3, -1, 1, 3].some((dx) =>
          [-3, -1, 1, 3].some((dy) => ground(x + dx, y + dy)),
        )
      )
        continue;
      const foot = { x: x + 0.5, y: y + 0.5 },
        p = act1Project(foot, "b");
      report.treeCount++;
      // Conservative full sprite envelope, not a runtime opacity switch.
      if (act1CanopyOverlapsGround(map, foot, "b", 256, 244)) {
        report.cutawayTrees++;
        continue;
      }
      report.fullCanopies++;
      shadows
        .fillStyle(0x13160f, 0.18)
        .fillEllipse(p.x + 12, p.y + 3, 100, 36)
        .fillStyle(0x13160f, 0.22)
        .fillEllipse(p.x + 8, p.y + 2, 70, 24);
      scene.add
        .image(p.x, p.y, "classic-oak")
        .setOrigin(0.5, 0.91)
        .setDepth(p.y);
    }
  for (const object of map.objects) {
    const p = act1Project(object.position, "b"),
      width = object.radius * 128 * Math.SQRT2;
    shadows
      .fillStyle(0x141710, 0.18)
      .fillEllipse(p.x + 10, p.y + 4, width * 1.2, width * 0.6)
      .fillStyle(0x141710, 0.23)
      .fillEllipse(p.x + 7, p.y + 3, width, width * 0.42);
    if (object.appearance.includes("shrine")) {
      scene.add
        .image(p.x, p.y, "classic-bell")
        .setOrigin(0.5, 0.84)
        .setScale(0.8)
        .setDepth(p.y);
    } else {
      // Explicit retained geometry placeholder; generated rock variants failed halo review.
      const ink = scene.add.graphics().setDepth(p.y);
      ink.fillStyle(0x515145).fillPoints(
        [
          { x: p.x - width / 2, y: p.y },
          { x: p.x - width * 0.3, y: p.y - 43 },
          { x: p.x + width * 0.2, y: p.y - 53 },
          { x: p.x + width / 2, y: p.y - 7 },
          { x: p.x + width * 0.15, y: p.y + 24 },
        ].map((p) => new Phaser.Math.Vector2(p.x, p.y)),
        true,
      );
      ink.fillStyle(0x3b3e34).fillPoints(
        [
          { x: p.x - width / 2, y: p.y },
          { x: p.x - width * 0.3, y: p.y - 43 },
          { x: p.x, y: p.y - 12 },
          { x: p.x + width * 0.15, y: p.y + 24 },
        ].map((p) => new Phaser.Math.Vector2(p.x, p.y)),
        true,
      );
    }
  }
  return report;
}

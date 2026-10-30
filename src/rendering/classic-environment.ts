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
  // Broad worn paths join authored spaces without adding decorative collision.
  const roads = [
    [
      { x: 4, y: 29 },
      { x: 12, y: 30 },
      { x: 21, y: 31 },
      { x: 29, y: 29 },
    ],
    [
      { x: 29, y: 29 },
      { x: 35, y: 24 },
      { x: 42, y: 14 },
    ],
    [
      { x: 42, y: 14 },
      { x: 32, y: 12 },
      { x: 23, y: 11 },
    ],
    [
      { x: 23, y: 11 },
      { x: 17, y: 19 },
      { x: 12, y: 30 },
    ],
  ];
  for (const road of roads) {
    const points = road.map((p) => {
      const at = act1Project(p, "b");
      return new Phaser.Math.Vector2(at.x, at.y);
    });
    earthBase.lineStyle(104, 0x494333, 0.18).strokePoints(points, false);
    earthBase.lineStyle(64, 0x514735, 0.16).strokePoints(points, false);
  }
  // One restrained world-fixed painted layer, no mask seams or dynamic alpha.
  scene.add
    .tileSprite(768, 2800, 10000, 8000, "classic-earth")
    .setTileScale(2.7)
    .setDepth(-998)
    .setAlpha(0.24);
  if (!scene.textures.exists("classic-contact")) {
    const texture = scene.textures.createCanvas("classic-contact", 128, 64)!;
    const context = texture.context;
    context.scale(1, 0.5);
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 60);
    gradient.addColorStop(0, "rgba(9,12,8,0.55)");
    gradient.addColorStop(0.5, "rgba(9,12,8,0.24)");
    gradient.addColorStop(1, "rgba(9,12,8,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    texture.refresh();
  }
  const shadow = (x: number, y: number, width: number, height: number) =>
    scene.add
      .image(x, y, "classic-contact")
      .setDisplaySize(width, height)
      .setDepth(-997);
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
      // Broad bands form deliberate groves; jitter breaks the old equal-spacing rows.
      if (Math.sin(x * 0.43) + Math.cos(y * 0.38) < -0.35) continue;
      const scale = 0.82 + (hash % 5) * 0.045;
      const foot = {
          x: x + 0.28 + (hash % 43) / 100,
          y: y + 0.28 + ((hash >>> 8) % 43) / 100,
        },
        p = act1Project(foot, "b");
      report.treeCount++;
      // Conservative full sprite envelope, not a runtime opacity switch.
      if (act1CanopyOverlapsGround(map, foot, "b", 256 * scale, 244 * scale)) {
        report.cutawayTrees++;
        if (hash % 3 === 0)
          scene.add
            .image(p.x, p.y, "classic-undergrowth")
            .setOrigin(0.5, 0.75)
            .setScale(0.7)
            .setDepth(-996);
        continue;
      }
      report.fullCanopies++;
      shadow(p.x + 8, p.y + 2, 100 * scale, 36 * scale);
      scene.add
        .image(p.x, p.y, "classic-oak")
        .setOrigin(0.5, 0.91)
        .setScale(scale)
        .setDepth(p.y);
    }
  for (const object of map.objects) {
    const p = act1Project(object.position, "b"),
      width = object.radius * 128 * Math.SQRT2;
    shadow(p.x + 7, p.y + 3, width * 1.15, width * 0.5);
    if (object.appearance.includes("shrine")) {
      scene.add
        .image(p.x, p.y, "classic-bell")
        .setOrigin(0.5, 0.84)
        .setScale(0.8)
        .setDepth(p.y);
    } else {
      scene.add
        .image(p.x, p.y, "classic-rocks")
        .setOrigin(0.5, 0.75)
        .setScale(0.65)
        .setDepth(p.y);
      scene.add
        .image(p.x - width * 0.4, p.y + 14, "classic-undergrowth")
        .setOrigin(0.5, 0.75)
        .setScale(0.65)
        .setDepth(-996);
    }
  }
  return report;
}

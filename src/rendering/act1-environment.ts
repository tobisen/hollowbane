import Phaser from "phaser";
import { areaWalkable, type AreaMap } from "../simulation/area-map";
import {
  act1CanopyOverlapsGround,
  act1GroundContours,
  act1Project,
  type Act1Variant,
} from "../world/act1-view";
import { appearanceHash } from "../world/environment-view";
import type { Point } from "../world/isometric";

export interface Act1EnvironmentReport {
  treeCount: number;
  fullCanopies: number;
  cutawayTrees: number;
  landmark: Point;
}

type Ink = Phaser.GameObjects.Graphics;

function polygon(ink: Ink, points: Point[], color: number): void {
  ink.fillStyle(color).fillPoints(
    points.map((p) => new Phaser.Math.Vector2(p.x, p.y)),
    true,
  );
}

function soften(points: Point[]): Point[] {
  return points.flatMap((a, i) => {
    const b = points[(i + 1) % points.length]!;
    return [
      { x: a.x * 0.8 + b.x * 0.2, y: a.y * 0.8 + b.y * 0.2 },
      { x: a.x * 0.2 + b.x * 0.8, y: a.y * 0.2 + b.y * 0.8 },
    ];
  });
}

function blob(center: Point, rx: number, ry: number, seed: number): Point[] {
  return soften(
    Array.from({ length: 11 }, (_, i) => {
      const angle = (i / 11) * Math.PI * 2;
      const r = 0.85 + (appearanceHash(seed, i, 0) % 16) / 100;
      return {
        x: center.x + Math.cos(angle) * rx * r,
        y: center.y + Math.sin(angle) * ry * r,
      };
    }),
  );
}

/** Asymmetric broad soil chips avoid a repeated round-dot texture. */
function earthMark(
  center: Point,
  rx: number,
  ry: number,
  seed: number,
): Point[] {
  const count = 5 + (seed % 3),
    turn = ((seed >>> 8) % 100) / 100;
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count + turn) * Math.PI * 2,
      radius = 0.48 + (appearanceHash(seed, i, 2) % 55) / 100;
    return {
      x: center.x + Math.cos(angle) * rx * radius,
      y: center.y + Math.sin(angle) * ry * radius,
    };
  });
}

/** Original coarse shapes only: static ground, broad shadows and permanent tree cutaways.
 * No raster terrain, animated foliage, one-pixel decoration or opacity switching.
 */
export function drawAct1Environment(
  scene: Phaser.Scene,
  map: AreaMap,
  variant: Act1Variant,
): Act1EnvironmentReport {
  const project = (point: Point) => act1Project(point, variant),
    heightScale = variant === "a" ? 1 : 0.8,
    groundInk = scene.add.graphics().setDepth(-1000),
    shadowInk = scene.add.graphics().setDepth(-998),
    t = map.terrain;
  const worldPolygon = (points: Point[], color: number) =>
    polygon(groundInk, points.map(project), color);
  worldPolygon(
    [
      { x: -10, y: -10 },
      { x: t.width + 10, y: -10 },
      { x: t.width + 10, y: t.height + 10 },
      { x: -10, y: t.height + 10 },
    ],
    0x1d251d,
  );
  // Large interlocking woodland masses stay below all playable terrain and actors.
  for (let y = 1; y < t.height; y += 3)
    for (let x = 1; x < t.width; x += 3) {
      if (t.cells[y * t.width + x] !== "solid") continue;
      const hash = appearanceHash(map.seed, x, y);
      worldPolygon(
        blob({ x: x + 0.5, y: y + 0.5 }, 3.4, 2.6, hash),
        [0x20291d, 0x252d20, 0x1c241b][hash % 3]!,
      );
    }
  for (const contour of act1GroundContours(map)) {
    const edge = soften(contour),
      // Interior islands wind in reverse; retain their collision-visible dark ground.
      area = contour.reduce((sum, a, i) => {
        const b = contour[(i + 1) % contour.length]!;
        return sum + a.x * b.y - b.x * a.y;
      }, 0);
    polygon(groundInk, edge.map(project), area > 0 ? 0x383c2c : 0x1d251d);
    groundInk.lineStyle(12, 0x303727, 1).strokePoints(
      edge.map((p) => new Phaser.Math.Vector2(project(p).x, project(p).y)),
      true,
    );
  }
  // Deliberate broad regions carry the palette; sparse world-scale variation never tiles.
  const regions = [
    { x: 12, y: 30, rx: 8.3, ry: 6.2, color: 0x41412f },
    { x: 29, y: 29, rx: 9.3, ry: 6.8, color: 0x3e402d },
    { x: 23, y: 11, rx: 8.2, ry: 6.1, color: 0x3b3e2b },
    { x: 42, y: 14, rx: 6.7, ry: 6.1, color: 0x424031 },
  ];
  for (const [i, region] of regions.entries())
    worldPolygon(blob(region, region.rx, region.ry, i + 10), region.color);
  const routes = [
    [
      { x: 12, y: 30 },
      { x: 29, y: 29 },
    ],
    [
      { x: 29, y: 29 },
      { x: 42, y: 14 },
    ],
    [
      { x: 42, y: 14 },
      { x: 23, y: 11 },
    ],
    [
      { x: 23, y: 11 },
      { x: 12, y: 30 },
    ],
    [
      { x: 23, y: 11 },
      { x: 29, y: 29 },
    ],
  ] as const;
  for (const [index, [a, b]] of routes.entries()) {
    const dx = b.x - a.x,
      dy = b.y - a.y,
      distance = Math.hypot(dx, dy),
      normal = { x: -dy / distance, y: dx / distance };
    const sides = [-1, 1].map((sign) =>
      Array.from({ length: 10 }, (_, i) => {
        const fraction = i / 9,
          width = 0.9 + Math.sin(fraction * Math.PI) * 0.45,
          bend = Math.sin(fraction * Math.PI * 2) * 0.25;
        return {
          x: a.x + dx * fraction + normal.x * (sign * width + bend),
          y: a.y + dy * fraction + normal.y * (sign * width + bend),
        };
      }),
    );
    const ribbon = [...sides[0]!, ...sides[1]!.reverse()];
    if (ribbon.every((p) => areaWalkable(map, p))) {
      worldPolygon(soften(ribbon), index % 2 ? 0x4b4635 : 0x484331);
      // Worn soil breaks the ribbon silhouette into broad irregular margins.
      for (let step = 1; step < distance * 3; step++) {
        const hash = appearanceHash(index + 80, step, 3),
          fraction = step / (distance * 3),
          sign = hash % 2 ? 1 : -1,
          width = 0.9 + Math.sin(fraction * Math.PI) * 0.45,
          bend = Math.sin(fraction * Math.PI * 2) * 0.25,
          center = {
            x: a.x + dx * fraction + normal.x * (sign * width + bend),
            y: a.y + dy * fraction + normal.y * (sign * width + bend),
          };
        worldPolygon(
          earthMark(center, 0.18 + (hash % 5) * 0.045, 0.16, hash),
          hash % 3 ? 0x41412e : 0x4b4635,
        );
      }
    }
  }
  for (let y = 3; y < t.height - 3; y += 4)
    for (let x = 3; x < t.width - 3; x += 4) {
      const hash = appearanceHash(map.seed, x, y),
        center = { x: x + (hash % 3), y: y + ((hash >>> 4) % 3) };
      if (hash % 3 !== 0 || !areaWalkable(map, center, 2.4)) continue;
      const patch = blob(center, 1.9, 1.4, hash);
      worldPolygon(patch, hash % 2 ? 0x3b3d2c : 0x434130);
    }

  // Coarse material marks are opaque and world anchored. Their minimum width is
  // several pixels at unit zoom, with no subpixel grass, bright speckles or grid seams.
  for (let y = 0; y < t.height; y++)
    for (let x = 0; x < t.width; x++) {
      if (t.cells[y * t.width + x] !== "ground") continue;
      const hash = appearanceHash(map.seed + 24, x, y),
        point = {
          x: x + 0.12 + (hash % 73) / 100,
          y: y + 0.12 + ((hash >>> 8) % 73) / 100,
        };
      const roadDistance = Math.min(
        ...routes.map(([a, b]) => {
          const dx = b.x - a.x,
            dy = b.y - a.y,
            fraction = Math.max(
              0,
              Math.min(
                1,
                ((point.x - a.x) * dx + (point.y - a.y) * dy) /
                  (dx * dx + dy * dy),
              ),
            );
          return Math.hypot(
            point.x - a.x - dx * fraction,
            point.y - a.y - dy * fraction,
          );
        }),
      );
      const nearRoad = roadDistance < 1.1,
        clearingEdge = regions.some((r) => {
          const distance =
            ((point.x - r.x) / r.rx) ** 2 + ((point.y - r.y) / r.ry) ** 2;
          return distance > 0.6 && distance < 1.25;
        }),
        margin = (roadDistance > 0.8 && roadDistance < 2.2) || clearingEdge;
      // Marks cluster on weathered margins; clearing and road centers stay mostly bare.
      if (
        hash % 2 !== 0 ||
        (!margin && hash % 7 !== 0) ||
        (roadDistance < 0.65 && hash % 11 !== 0)
      )
        continue;
      worldPolygon(
        earthMark(
          point,
          0.18 + (hash % 5) * 0.045,
          0.12 + ((hash >>> 4) % 3) * 0.04,
          hash,
        ),
        nearRoad
          ? [0x464332, 0x4a4534, 0x474332][hash % 3]!
          : [0x3d3f2d, 0x41422f, 0x3e402e][hash % 3]!,
      );
      const offset = { x: point.x + 0.26, y: point.y + 0.18 };
      if (areaWalkable(map, offset, 0.15)) {
        worldPolygon(
          earthMark(offset, 0.12 + ((hash >>> 12) % 3) * 0.04, 0.09, hash + 1),
          nearRoad ? 0x454231 : 0x3e402d,
        );
        if (hash % 13 === 0) {
          const p = project(offset),
            vy = variant === "a" ? 1 : 1.375;
          polygon(
            groundInk,
            [
              { x: p.x - 8, y: p.y + 2 * vy },
              { x: p.x - 4, y: p.y - 3 * vy },
              { x: p.x + 8, y: p.y - 2 * vy },
              { x: p.x + 5, y: p.y + 3 * vy },
            ],
            0x565446,
          );
        }
      }
    }

  const ground = (x: number, y: number) =>
    x >= 0 &&
    y >= 0 &&
    x < t.width &&
    y < t.height &&
    t.cells[y * t.width + x] === "ground";
  const report: Act1EnvironmentReport = {
    treeCount: 0,
    fullCanopies: 0,
    cutawayTrees: 0,
    landmark: { x: 43, y: 12 },
  };
  // Trees grow in broad boundary groups, outside walkable ground. Near-side crowns
  // that could cover any actor silhouette are replaced once at scene construction.
  for (let y = 1; y < t.height - 1; y += 2)
    for (let x = 1; x < t.width - 1; x += 2) {
      const hash = appearanceHash(map.seed + 11, x, y);
      if (ground(x, y) || hash % 5 === 0) continue;
      if (
        ![-3, -1, 1, 3].some((dx) =>
          [-3, -1, 1, 3].some((dy) => ground(x + dx, y + dy)),
        )
      )
        continue;
      const foot = {
        x: t.origin.x + (x + 0.5) * t.cellSize,
        y: t.origin.y + (y + 0.5) * t.cellSize,
      };
      const width = 106 + (hash % 3) * 11,
        height = (124 + (hash % 4) * 8) * heightScale,
        cutaway = act1CanopyOverlapsGround(map, foot, variant, width, height),
        p = project(foot),
        tree = scene.add.graphics().setDepth(p.y);
      shadowInk
        .fillStyle(0x131b15, 0.45)
        .fillEllipse(p.x + 14, p.y + 3, width * 1.1, width * 0.33);
      report.treeCount++;
      if (cutaway) {
        report.cutawayTrees++;
        // Permanent low shrub silhouettes replace missing crowns; their tops stay
        // close to the ground and cannot cover a character's upper body.
        polygon(
          tree,
          blob(
            { x: p.x - 14, y: p.y - 1 },
            width * 0.43,
            19 * heightScale,
            hash,
          ),
          0x293322,
        );
        polygon(
          tree,
          blob(
            { x: p.x + 18, y: p.y + 2 },
            width * 0.32,
            15 * heightScale,
            hash + 2,
          ),
          0x303a27,
        );
        polygon(
          tree,
          blob(
            { x: p.x - 29, y: p.y - 4 },
            width * 0.18,
            11 * heightScale,
            hash + 3,
          ),
          0x37402b,
        );
        polygon(
          tree,
          [
            { x: p.x - 17, y: p.y + 3 },
            { x: p.x - 10, y: p.y - 27 * heightScale },
            { x: p.x + 7, y: p.y - 30 * heightScale },
            { x: p.x + 17, y: p.y },
          ],
          0x39372b,
        );
        tree
          .fillStyle(0x5b5139)
          .fillEllipse(p.x - 1, p.y - 27 * heightScale, 17, 7);
        tree
          .lineStyle(7, 0x2b2d22)
          .lineBetween(p.x - 8, p.y - 5, p.x - 27, p.y + 3)
          .lineBetween(p.x + 8, p.y - 6, p.x + 23, p.y + 3);
      } else {
        report.fullCanopies++;
        polygon(
          tree,
          [
            { x: p.x - 14, y: p.y + 4 },
            { x: p.x - 7, y: p.y - height * 0.7 },
            { x: p.x + 7, y: p.y - height * 0.7 },
            { x: p.x + 13, y: p.y + 2 },
          ],
          0x34352a,
        );
        tree
          .lineStyle(8, 0x34352a)
          .lineBetween(
            p.x - 2,
            p.y - height * 0.5,
            p.x - 28,
            p.y - height * 0.7,
          )
          .lineBetween(
            p.x + 2,
            p.y - height * 0.44,
            p.x + 28,
            p.y - height * 0.64,
          );
        polygon(
          tree,
          blob(
            { x: p.x, y: p.y - height * 0.67 },
            width / 2,
            height * 0.33,
            hash,
          ),
          0x242e21,
        );
        polygon(
          tree,
          blob(
            { x: p.x - width * 0.12, y: p.y - height * 0.73 },
            width * 0.31,
            height * 0.22,
            hash + 1,
          ),
          hash % 2 ? 0x303b28 : 0x2d3826,
        );
      }
    }

  for (const object of map.objects) {
    const p = project(object.position),
      ink = scene.add.graphics().setDepth(p.y),
      width = object.radius * 128 * Math.SQRT2,
      depth = object.radius * (variant === "a" ? 64 : 88) * Math.SQRT2;
    shadowInk
      .fillStyle(0x171d16, 0.55)
      .fillEllipse(p.x + 9, p.y + 5, width * 1.2, depth * 1.1);
    if (object.appearance.includes("shrine")) {
      report.landmark = object.position;
      drawShrine(ink, p, width, depth, heightScale);
    } else if (object.appearance.includes("fence")) {
      const h = 35 * heightScale;
      ink
        .lineStyle(7, 0x393c30)
        .lineBetween(p.x - width / 2, p.y, p.x - width / 2 - 3, p.y - h)
        .lineBetween(p.x + width / 2, p.y, p.x + width / 2 + 3, p.y - h * 0.85)
        .lineStyle(6, 0x51513d)
        .lineBetween(
          p.x - width / 2,
          p.y - h * 0.7,
          p.x + width / 2,
          p.y - h * 0.45,
        );
    } else {
      polygon(
        ink,
        [
          { x: p.x - width * 0.5, y: p.y },
          { x: p.x - width * 0.38, y: p.y - depth * 0.45 - 20 * heightScale },
          { x: p.x + width * 0.16, y: p.y - depth * 0.5 - 29 * heightScale },
          { x: p.x + width * 0.5, y: p.y - depth * 0.12 },
          { x: p.x + width * 0.18, y: p.y + depth * 0.35 },
        ],
        0x525346,
      );
      polygon(
        ink,
        [
          { x: p.x - width * 0.5, y: p.y },
          { x: p.x - width * 0.38, y: p.y - depth * 0.45 - 20 * heightScale },
          { x: p.x, y: p.y - depth * 0.15 },
          { x: p.x + width * 0.18, y: p.y + depth * 0.35 },
        ],
        0x3b4035,
      );
    }
  }
  return report;
}

function drawShrine(
  ink: Ink,
  p: Point,
  width: number,
  depth: number,
  scale: number,
): void {
  const h = 96 * scale;
  ink.fillStyle(0x45473b).fillEllipse(p.x, p.y, width, depth);
  polygon(
    ink,
    [
      { x: p.x - width * 0.38, y: p.y },
      { x: p.x - width * 0.32, y: p.y - h * 0.74 },
      { x: p.x - width * 0.22, y: p.y - h },
      { x: p.x - width * 0.08, y: p.y - h * 0.82 },
      { x: p.x - width * 0.12, y: p.y - h * 0.22 },
      { x: p.x + width * 0.2, y: p.y - h * 0.15 },
      { x: p.x + width * 0.15, y: p.y - h * 0.62 },
      { x: p.x + width * 0.28, y: p.y - h * 0.7 },
      { x: p.x + width * 0.37, y: p.y - h * 0.4 },
      { x: p.x + width * 0.38, y: p.y + 3 },
    ],
    0x77715a,
  );
  ink
    .fillStyle(0x4a4d3e)
    .fillRect(p.x - width * 0.31, p.y - h * 0.69, width * 0.09, h * 0.65)
    .fillStyle(0x393c32)
    .fillRect(p.x + width * 0.2, p.y - h * 0.49, width * 0.11, h * 0.45)
    .fillStyle(0x353a2e)
    .fillEllipse(p.x, p.y - 9, width * 0.43, depth * 0.4)
    .fillStyle(0x8b7752)
    .fillEllipse(p.x, p.y - 12, width * 0.3, depth * 0.25);
}

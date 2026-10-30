import type { AreaMap } from "../simulation/area-map";
import type { Point } from "./isometric";

export type Act1Variant = "a" | "b";

/** Ground-projection pilot. Camera zoom stays one in both variants. */
export function act1Project(point: Point, variant: Act1Variant): Point {
  return {
    x: (point.x - point.y) * 64 + 768,
    y: (point.x + point.y) * (variant === "a" ? 32 : 44) + 512,
  };
}

export function act1Unproject(point: Point, variant: Act1Variant): Point {
  const difference = (point.x - 768) / 64;
  const sum = (point.y - 512) / (variant === "a" ? 32 : 44);
  return { x: (sum + difference) / 2, y: (sum - difference) / 2 };
}

/** Conservative screen-space tree test, including a 100px actor above each ground cell.
 * All ground counts, even cells occupied by a prop: movement never toggles foliage opacity.
 */
export function act1CanopyOverlapsGround(
  map: AreaMap,
  foot: Point,
  variant: Act1Variant,
  width: number,
  height: number,
): boolean {
  const center = act1Project(foot, variant),
    t = map.terrain,
    halfY = (variant === "a" ? 32 : 44) * t.cellSize,
    halfX = 64 * t.cellSize;
  for (let y = 0; y < t.height; y++)
    for (let x = 0; x < t.width; x++) {
      if (t.cells[y * t.width + x] !== "ground") continue;
      const ground = act1Project(
        {
          x: t.origin.x + (x + 0.5) * t.cellSize,
          y: t.origin.y + (y + 0.5) * t.cellSize,
        },
        variant,
      );
      if (
        ground.x + halfX + 28 >= center.x - width / 2 &&
        ground.x - halfX - 28 <= center.x + width / 2 &&
        ground.y + halfY >= center.y - height &&
        ground.y - halfY - 100 <= center.y - height * 0.32
      )
        return true;
    }
  return false;
}

/** Trace cell boundaries into continuous polygons; no independently sampled tile seams. */
export function act1GroundContours(map: AreaMap): Point[][] {
  const t = map.terrain;
  const ground = (x: number, y: number) =>
    x >= 0 &&
    x < t.width &&
    y >= 0 &&
    y < t.height &&
    t.cells[y * t.width + x] === "ground";
  const edges = new Map<string, Point[]>();
  const key = (p: Point) => `${p.x},${p.y}`;
  const edge = (a: Point, b: Point) => {
    const group = edges.get(key(a)) ?? [];
    group.push(b);
    edges.set(key(a), group);
  };
  for (let y = 0; y < t.height; y++)
    for (let x = 0; x < t.width; x++) {
      if (!ground(x, y)) continue;
      if (!ground(x, y - 1)) edge({ x, y }, { x: x + 1, y });
      if (!ground(x + 1, y)) edge({ x: x + 1, y }, { x: x + 1, y: y + 1 });
      if (!ground(x, y + 1)) edge({ x: x + 1, y: y + 1 }, { x, y: y + 1 });
      if (!ground(x - 1, y)) edge({ x, y: y + 1 }, { x, y });
    }
  const contours: Point[][] = [];
  while (edges.size) {
    const first = edges.keys().next().value!;
    const [x, y] = first.split(",").map(Number);
    let p: Point = { x: x!, y: y! };
    const contour: Point[] = [];
    do {
      contour.push({
        x: t.origin.x + p.x * t.cellSize,
        y: t.origin.y + p.y * t.cellSize,
      });
      const group = edges.get(key(p));
      if (!group) break;
      const next = group.pop()!;
      if (group.length === 0) edges.delete(key(p));
      p = next;
    } while (key(p) !== first);
    if (contour.length > 2) contours.push(contour);
  }
  return contours;
}

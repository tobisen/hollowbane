import type { AreaLayout } from "../simulation/area-anchors";
export interface EnvironmentProp {
  kind: "oak" | "tree" | "ruin" | "rock";
  x: number;
  y: number;
  width: number;
}
/** Local appearance hash only: never consumes simulation randomness or alters maps. */
export function appearanceHash(seed: number, x: number, y: number): number {
  let n =
    (seed ^ Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263)) >>> 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
  return (n ^ (n >>> 16)) >>> 0;
}
export function environmentProps(layout: AreaLayout): EnvironmentProp[] {
  if (layout.map.area !== "haunted-forest") return [];
  const t = layout.map.terrain,
    props: EnvironmentProp[] = [];
  for (let y = 0; y < t.height; y++)
    for (let x = 0; x < t.width; x++) {
      const h = appearanceHash(layout.map.seed, x, y);
      if (
        t.cells[y * t.width + x] !== "solid" ||
        h % 4 !== 0 ||
        props.length >= 140
      )
        continue;
      props.push({
        kind: h % 5 === 0 ? "tree" : "oak",
        x: t.origin.x + (x + 0.5) * t.cellSize,
        y: t.origin.y + (y + 0.5) * t.cellSize,
        width: h % 5 === 0 ? 240 + (h % 50) : 420 + (h % 90),
      });
    }
  for (const object of layout.map.objects)
    props.push({
      kind: object.appearance.includes("boulder") ? "rock" : "ruin",
      ...object.position,
      width: Math.max(48, object.radius * 180),
    });
  return props;
}

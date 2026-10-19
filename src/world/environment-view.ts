import type { AreaLayout } from "../simulation/area-anchors";
export interface EnvironmentProp {
  kind:
    | "oak"
    | "tree"
    | "ruin"
    | "rock"
    | "monument"
    | "arch"
    | "wall"
    | "pillar"
    | "lamp";
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
  if (layout.map.area === "ancient-crypt") {
    const t = layout.map.terrain,
      props: EnvironmentProp[] = [];
    for (let y = 0; y < t.height; y++)
      for (let x = 0; x < t.width; x++) {
        if (t.cells[y * t.width + x] !== "solid") continue;
        if (
          ![
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ].some(
            ([dx, dy]) => t.cells[(y + dy!) * t.width + x + dx!] === "ground",
          )
        )
          continue;
        const p = {
          x: t.origin.x + (x + 0.5) * t.cellSize,
          y: t.origin.y + (y + 0.5) * t.cellSize,
        };
        props.push({ kind: "wall", ...p, width: 128 * t.cellSize });
        if (appearanceHash(layout.map.seed, x, y) % 13 === 0)
          props.push({ kind: "lamp", ...p, width: 65 });
      }
    for (const object of layout.map.objects)
      props.push({ kind: "pillar", ...object.position, width: 84 });
    for (const anchor of [
      layout.spawn,
      ...layout.exits.map((e) => e.trigger),
    ]) {
      const wall = props
        .filter((p) => p.kind === "wall")
        .sort(
          (a, b) =>
            Math.hypot(a.x - anchor.x, a.y - anchor.y) -
            Math.hypot(b.x - anchor.x, b.y - anchor.y),
        )[0];
      if (wall) props.push({ kind: "arch", x: wall.x, y: wall.y, width: 180 });
    }
    return props;
  }
  const graveyard = layout.map.area === "forgotten-graveyard";
  if (layout.map.area !== "haunted-forest" && !graveyard) return [];
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
        kind: graveyard
          ? h % 5 === 0
            ? "tree"
            : "monument"
          : h % 5 === 0
            ? "tree"
            : "oak",
        x: t.origin.x + (x + 0.5) * t.cellSize,
        y: t.origin.y + (y + 0.5) * t.cellSize,
        width: graveyard
          ? h % 5 === 0
            ? 250
            : 85 + (h % 45)
          : h % 5 === 0
            ? 240 + (h % 50)
            : 420 + (h % 90),
      });
    }
  // Historical open prototype floors get perimeter scenery, never new obstacles.
  if (!props.length)
    for (let i = 0; i < 4; i++) {
      const y = t.origin.y + ((i + 0.5) * t.height * t.cellSize) / 4;
      for (const x of [t.origin.x - 1, t.origin.x + (t.width + 1) * t.cellSize])
        props.push({
          kind: graveyard ? "monument" : "oak",
          x,
          y,
          width: graveyard ? 125 : 440,
        });
    }
  for (const object of layout.map.objects)
    props.push({
      kind: object.appearance.includes("boulder") ? "rock" : "ruin",
      ...object.position,
      width: Math.max(48, object.radius * 180),
    });
  if (graveyard) {
    const exit = layout.exits.find((e) => e.id === "crypt");
    let nearest: { x: number; y: number; distance: number } | undefined;
    if (exit)
      for (let y = 0; y < t.height; y++)
        for (let x = 0; x < t.width; x++) {
          if (t.cells[y * t.width + x] !== "solid") continue;
          const p = {
            x: t.origin.x + (x + 0.5) * t.cellSize,
            y: t.origin.y + (y + 0.5) * t.cellSize,
          };
          const distance = Math.hypot(
            p.x - exit.trigger.x,
            p.y - exit.trigger.y,
          );
          if (!nearest || distance < nearest.distance)
            nearest = { ...p, distance };
        }
    if (nearest)
      props.push({ kind: "arch", x: nearest.x, y: nearest.y, width: 200 });
  }
  return props;
}

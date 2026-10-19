import type { AreaLayout } from "../simulation/area-anchors";
export interface CampProp {
  texture: "world-camp-shelter" | "world-camp-fire" | "world-props";
  frame: number;
  x: number;
  y: number;
  width: number;
}
/** Scenery is outside navigable terrain: neither historic nor generated layouts change. */
export function campProps(layout: AreaLayout): CampProp[] {
  if (layout.map.area !== "ashen-refuge") return [];
  const t = layout.map.terrain,
    left = t.origin.x,
    top = t.origin.y,
    right = left + t.width * t.cellSize,
    bottom = top + t.height * t.cellSize;
  return [
    {
      texture: "world-camp-shelter",
      frame: 0,
      x: left + 2,
      y: top - 0.9,
      width: 240,
    },
    {
      texture: "world-camp-shelter",
      frame: 0,
      x: right - 1,
      y: top - 0.9,
      width: 205,
    },
    {
      texture: "world-camp-fire",
      frame: 0,
      x: (left + right) / 2,
      y: top - 0.6,
      width: 140,
    },
    {
      texture: "world-props",
      frame: 0,
      x: left - 0.9,
      y: top + 1.5,
      width: 135,
    },
    {
      texture: "world-props",
      frame: 2,
      x: right + 0.8,
      y: top + 1,
      width: 180,
    },
    {
      texture: "world-props",
      frame: 1,
      x: left - 1.2,
      y: bottom - 1,
      width: 245,
    },
    {
      texture: "world-props",
      frame: 1,
      x: right + 1.4,
      y: bottom - 1,
      width: 215,
    },
    { texture: "world-props", frame: 3, x: left + 1, y: top - 0.45, width: 75 },
    {
      texture: "world-props",
      frame: 3,
      x: right - 1,
      y: top - 0.45,
      width: 75,
    },
  ];
}

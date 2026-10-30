import type { AreaMap } from "./area-map";

/** Authored, developer-only geometry. Never participates in saved world dispatch. */
export const SLICE_ROOMS = [
  { name: "Gate of Ash", x: 3, y: 3, width: 10, height: 10 },
  { name: "Pillared Sepulchre", x: 20, y: 3, width: 12, height: 10 },
  { name: "The Sunken Choir", x: 20, y: 20, width: 12, height: 12 },
  { name: "Cinder Cloister", x: 3, y: 22, width: 10, height: 10 },
] as const;
export const SLICE_START = { x: 8, y: 8 };
export const SLICE_LANDMARKS = SLICE_ROOMS.map((r) => ({
  x: r.x + r.width / 2,
  y: r.y + r.height / 2,
}));
export function dungeonSliceMap(): AreaMap {
  const width = 36,
    height = 36;
  const cells: ("ground" | "solid")[] = Array.from(
    { length: width * height },
    () => "solid",
  );
  const carve = (x: number, y: number, w: number, h: number) => {
    for (let row = y; row < y + h; row++)
      for (let col = x; col < x + w; col++) cells[row * width + col] = "ground";
  };
  for (const r of SLICE_ROOMS) carve(r.x, r.y, r.width, r.height);
  // Four-cell connectors and generous junction aprons form a complete loop.
  carve(11, 6, 12, 4);
  carve(24, 10, 4, 13);
  carve(10, 25, 13, 4);
  carve(6, 10, 4, 15);
  // A broad side chapel gives the connector cluster a recognizable branch.
  carve(13, 14, 7, 6);
  carve(9, 15, 6, 4);
  return {
    area: "ancient-crypt",
    seed: 0,
    terrain: { width, height, cellSize: 1, origin: { x: 0, y: 0 }, cells },
    objects: [
      {
        id: "choir-tomb",
        position: { x: 29, y: 28 },
        radius: 0.8,
        blocking: true,
        appearance: "slice-stone-tomb",
      },
      {
        id: "sepulchre-pier",
        position: { x: 29, y: 6 },
        radius: 0.65,
        blocking: true,
        appearance: "slice-stone-pier",
      },
    ],
  };
}

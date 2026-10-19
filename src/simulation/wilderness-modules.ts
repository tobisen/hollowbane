import { areaWalkable, type AreaObject } from "./area-map";
export const WILDERNESS_MODULE_VERSION = 1;
export const MODULE_SIZE = 7;
export const MODULE_PORTS = ["north", "east", "south", "west"] as const;
export type ModulePort = (typeof MODULE_PORTS)[number];
export interface WildernessModule {
  readonly id: string;
  readonly kind: "path" | "clearing" | "forest" | "obstacles" | "ruins";
  /** Original logical masks; # is solid and . is walkable. Never image collision. */
  readonly rows: readonly string[];
  readonly objects: readonly Omit<AreaObject, "id">[];
}
const open = [
  "#######",
  "#.....#",
  "#.....#",
  "#.....#",
  "#.....#",
  "#.....#",
  "#######",
];
export const WILDERNESS_MODULES: readonly WildernessModule[] = [
  {
    id: "crossing",
    kind: "path",
    rows: [
      "#######",
      "#######",
      "###.###",
      "##...##",
      "###.###",
      "#######",
      "#######",
    ],
    objects: [],
  },
  { id: "glade", kind: "clearing", rows: open, objects: [] },
  {
    id: "grove",
    kind: "forest",
    rows: [
      "#######",
      "##...##",
      "#.....#",
      "#.....#",
      "##....#",
      "###..##",
      "#######",
    ],
    objects: [],
  },
  {
    id: "boulder-glade",
    kind: "obstacles",
    rows: open,
    objects: [
      {
        position: { x: 1.5, y: 1.5 },
        radius: 0.38,
        blocking: true,
        appearance: "wilderness-boulder-footprint",
      },
    ],
  },
  {
    id: "broken-court",
    kind: "ruins",
    rows: open,
    objects: [
      {
        position: { x: 1.5, y: 1.5 },
        radius: 0.38,
        blocking: true,
        appearance: "wilderness-ruin-footprint",
      },
      {
        position: { x: 5.5, y: 5.5 },
        radius: 0.38,
        blocking: true,
        appearance: "wilderness-ruin-footprint",
      },
    ],
  },
];
export function validWildernessModule(module: WildernessModule): boolean {
  return (
    module.id.length > 0 &&
    module.rows.length === MODULE_SIZE &&
    module.rows.every(
      (row) => row.length === MODULE_SIZE && /^[#.]+$/.test(row),
    ) &&
    module.rows[3]![3] === "." &&
    module.objects.every(
      (o) =>
        Number.isFinite(o.radius) &&
        o.radius > 0 &&
        o.appearance.length > 0 &&
        Number.isFinite(o.position.x) &&
        Number.isFinite(o.position.y) &&
        o.position.x - o.radius > 0 &&
        o.position.y - o.radius > 0 &&
        o.position.x + o.radius < MODULE_SIZE &&
        o.position.y + o.radius < MODULE_SIZE &&
        Math.abs(o.position.x - 3.5) > o.radius + 0.7 &&
        Math.abs(o.position.y - 3.5) > o.radius + 0.7 &&
        areaWalkable(
          {
            area: "haunted-forest",
            seed: 0,
            terrain: {
              width: MODULE_SIZE,
              height: MODULE_SIZE,
              cellSize: 1,
              origin: { x: 0, y: 0 },
              cells: module.rows.flatMap((row) =>
                [...row].map((c) =>
                  c === "." ? ("ground" as const) : ("solid" as const),
                ),
              ),
            },
            objects: [],
          },
          o.position,
          o.radius,
        ),
    )
  );
}
/** Local uint32 stream; independent of loot, visits, wall time and module rendering. */
export function wildernessRandom(seed: number): () => number {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
    throw Error("Wilderness seed must be uint32");
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let n = state;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}
export function moduleChoice(
  seed: number,
  catalog = WILDERNESS_MODULES,
): { module: WildernessModule; rotation: number } {
  if (
    !catalog.length ||
    new Set(catalog.map((m) => m.id)).size !== catalog.length ||
    !catalog.every(validWildernessModule)
  )
    throw Error("Invalid wilderness catalog");
  const random = wildernessRandom(seed);
  return {
    module: catalog[Math.floor(random() * catalog.length)]!,
    rotation: Math.floor(random() * 4),
  };
}
export function stampModule(
  module: WildernessModule,
  rotation: number,
  ports: readonly ModulePort[],
) {
  if (
    !validWildernessModule(module) ||
    !Number.isInteger(rotation) ||
    rotation < 0 ||
    rotation > 3 ||
    ports.some((p) => !MODULE_PORTS.includes(p))
  )
    throw Error("Invalid wilderness module placement");
  const rotate = (x: number, y: number) => {
    for (let i = 0; i < rotation; i++) [x, y] = [MODULE_SIZE - y, x];
    return { x, y };
  };
  const cells: ("solid" | "ground")[] = Array.from(
    { length: MODULE_SIZE ** 2 },
    () => "solid",
  );
  for (let y = 0; y < MODULE_SIZE; y++)
    for (let x = 0; x < MODULE_SIZE; x++) {
      const p = rotate(x + 0.5, y + 0.5);
      cells[Math.floor(p.y) * MODULE_SIZE + Math.floor(p.x)] =
        module.rows[y]![x] === "." ? "ground" : "solid";
    }
  for (const port of ports)
    for (let n = 0; n < 4; n++) {
      const x = port === "west" ? n : port === "east" ? MODULE_SIZE - 1 - n : 3;
      const y =
        port === "north" ? n : port === "south" ? MODULE_SIZE - 1 - n : 3;
      cells[y * MODULE_SIZE + x] = "ground";
    }
  return {
    cells,
    objects: module.objects.map((o) => ({
      ...o,
      position: rotate(o.position.x, o.position.y),
    })),
  };
}

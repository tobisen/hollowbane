import { areaSeed, areaDefinition, type WorldPoint } from "./world";
import type { AreaLayout } from "./area-anchors";
import type { AreaObject } from "./area-map";
import { areaWalkable } from "./area-map";
import { wildernessRandom } from "./wilderness-modules";
import { wildernessConnected } from "./wilderness-layout";
export const DUNGEON_LAYOUT_VERSION = 1;
export interface RoomTemplate {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly pillar: boolean;
}
export const DUNGEON_ROOMS: readonly RoomTemplate[] = [
  { id: "small-cell", width: 5, height: 5, pillar: false },
  { id: "long-hall", width: 9, height: 5, pillar: true },
  { id: "square-vault", width: 7, height: 7, pillar: true },
];
export interface DungeonRoom {
  readonly id: string;
  readonly template: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly role: "entrance" | "exit" | "side";
  readonly center: WorldPoint;
}
export interface PlacementZone {
  readonly id: string;
  readonly kind: "monster" | "treasure";
  readonly room: string;
  readonly position: WorldPoint;
  readonly radius: number;
}
export interface DungeonLayout {
  readonly version: 1;
  readonly layout: AreaLayout;
  readonly rooms: readonly DungeonRoom[];
  readonly corridors: readonly { from: string; to: string }[];
  readonly zones: readonly PlacementZone[];
  readonly fallback: boolean;
}
function validTemplate(t: RoomTemplate): boolean {
  return (
    t.id.length > 0 &&
    [t.width, t.height].every(
      (n) => Number.isInteger(n) && n >= 5 && n <= 9 && n % 2 === 1,
    )
  );
}
function compose(
  seed: number,
  catalog: readonly RoomTemplate[],
  fallback: boolean,
): DungeonLayout {
  const derived = areaSeed(seed, "ancient-crypt"),
    random = wildernessRandom(derived);
  const start = 3,
    exit = 5,
    seen = new Set([start]),
    stack = [start],
    edges: { from: number; to: number }[] = [];
  while (stack.length) {
    const from = stack[stack.length - 1]!,
      x = from % 3,
      y = Math.floor(from / 3);
    const neighbors = [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 },
    ]
      .filter((p) => p.x >= 0 && p.x < 3 && p.y >= 0 && p.y < 3)
      .map((p) => p.y * 3 + p.x)
      .filter((n) => !seen.has(n));
    if (!neighbors.length) {
      stack.pop();
      continue;
    }
    const to = neighbors[Math.floor(random() * neighbors.length)]!;
    edges.push({ from, to });
    seen.add(to);
    stack.push(to);
  }
  // Optional leaf rooms create side branches/dead ends without disconnecting the route.
  for (const id of [...seen])
    if (
      id !== start &&
      id !== exit &&
      edges.filter((e) => e.from === id || e.to === id).length === 1 &&
      random() < 0.5
    ) {
      seen.delete(id);
      const index = edges.findIndex((e) => e.from === id || e.to === id);
      edges.splice(index, 1);
    }
  const width = 35,
    height = 35,
    origin = { x: -17.5, y: -17.5 };
  const cells: ("ground" | "solid")[] = Array.from(
      { length: width * height },
      () => "solid",
    ),
    objects: AreaObject[] = [],
    zones: PlacementZone[] = [],
    rooms: DungeonRoom[] = [];
  const carve = (x: number, y: number) => {
    cells[y * width + x] = "ground";
  };
  for (const id of [...seen].sort((a, b) => a - b)) {
    const template =
      fallback || id === start || id === exit
        ? DUNGEON_ROOMS[2]!
        : catalog[Math.floor(random() * catalog.length)]!;
    const cx = 6 + (id % 3) * 11,
      cy = 6 + Math.floor(id / 3) * 11;
    const x = cx - Math.floor(template.width / 2),
      y = cy - Math.floor(template.height / 2),
      center = { x: origin.x + cx + 0.5, y: origin.y + cy + 0.5 };
    const room: DungeonRoom = {
      id: `room-${id}`,
      template: template.id,
      x: origin.x + x,
      y: origin.y + y,
      width: template.width,
      height: template.height,
      role: id === start ? "entrance" : id === exit ? "exit" : "side",
      center,
    };
    rooms.push(room);
    for (let row = y; row < y + template.height; row++)
      for (let col = x; col < x + template.width; col++) carve(col, row);
    if (!fallback && template.pillar && id !== start && id !== exit)
      objects.push({
        id: `pillar-${id}`,
        position: { x: room.x + 1.5, y: room.y + 1.5 },
        radius: 0.35,
        blocking: true,
        appearance: "dungeon-pillar-footprint",
      });
    if (id !== start && id !== exit)
      for (const [index, kind] of (["monster", "treasure"] as const).entries())
        zones.push({
          id: `zone-${id}-${kind}`,
          room: room.id,
          kind,
          position: { x: center.x + (index ? 1 : -1), y: center.y + 1 },
          radius: 0.25,
        });
  }
  for (const edge of edges) {
    const a = rooms.find((r) => r.id === `room-${edge.from}`)!.center,
      b = rooms.find((r) => r.id === `room-${edge.to}`)!.center;
    let x = Math.floor(a.x - origin.x),
      y = Math.floor(a.y - origin.y);
    const tx = Math.floor(b.x - origin.x),
      ty = Math.floor(b.y - origin.y);
    carve(x, y);
    while (x !== tx || y !== ty) {
      if (x !== tx) x += Math.sign(tx - x);
      else y += Math.sign(ty - y);
      carve(x, y);
    }
  }
  const entrance = rooms.find((r) => r.role === "entrance")!,
    end = rooms.find((r) => r.role === "exit")!;
  const layout: AreaLayout = {
    map: {
      area: "ancient-crypt",
      seed: derived,
      terrain: { width, height, cellSize: 1, origin, cells },
      objects,
    },
    spawn: entrance.center,
    exits: areaDefinition("ancient-crypt").connections.map((c) => ({
      id: c.id,
      trigger: end.center,
      arrival: { x: end.center.x + 1.5, y: end.center.y },
    })),
  };
  return {
    version: DUNGEON_LAYOUT_VERSION,
    layout,
    rooms,
    corridors: edges.map((e) => ({
      from: `room-${e.from}`,
      to: `room-${e.to}`,
    })),
    zones,
    fallback,
  };
}
export function validDungeon(dungeon: DungeonLayout): boolean {
  if (!wildernessConnected(dungeon.layout)) return false;
  const rooms = new Set(dungeon.rooms.map((r) => r.id));
  return (
    rooms.size === dungeon.rooms.length &&
    dungeon.rooms.filter((r) => r.role === "entrance").length === 1 &&
    dungeon.rooms.filter((r) => r.role === "exit").length === 1 &&
    dungeon.corridors.every(
      (e) => rooms.has(e.from) && rooms.has(e.to) && e.from !== e.to,
    ) &&
    new Set(dungeon.zones.map((z) => z.id)).size === dungeon.zones.length &&
    dungeon.zones.every(
      (z) =>
        rooms.has(z.room) &&
        areaWalkable(dungeon.layout.map, z.position, z.radius),
    )
  );
}
/** Pure candidate generation; adoption into persisted runtime layouts is a later versioned step. */
export function generateDungeon(
  seed: number,
  catalog: readonly RoomTemplate[] = DUNGEON_ROOMS,
): DungeonLayout {
  if (
    !catalog.length ||
    !catalog.every(validTemplate) ||
    new Set(catalog.map((t) => t.id)).size !== catalog.length
  )
    throw Error("Invalid dungeon templates");
  const candidate = compose(seed, catalog, false);
  if (validDungeon(candidate)) return candidate;
  const fallback = compose(seed, DUNGEON_ROOMS, true);
  if (!validDungeon(fallback)) throw Error("Invalid authored dungeon fallback");
  return fallback;
}

import { areaDefinition, areaSeed, type AreaId } from "./world";
import {
  validAreaLayout,
  WORLD_ACTOR_RADIUS,
  type AreaLayout,
} from "./area-anchors";
import { areaWalkable, type AreaObject } from "./area-map";
import { areaNavigation, segmentWalkable } from "../world/navigation";
import {
  MODULE_SIZE,
  WILDERNESS_MODULES,
  moduleChoice,
  stampModule,
  wildernessRandom,
  type ModulePort,
  type WildernessModule,
} from "./wilderness-modules";
export const WILDERNESS_LAYOUT_VERSION = 1;
const COLUMNS = 5,
  ROWS = 4;
const STEPS: readonly {
  x: number;
  y: number;
  port: ModulePort;
  reverse: ModulePort;
}[] = [
  { x: 0, y: -1, port: "north", reverse: "south" },
  { x: 1, y: 0, port: "east", reverse: "west" },
  { x: 0, y: 1, port: "south", reverse: "north" },
  { x: -1, y: 0, port: "west", reverse: "east" },
];
export interface WildernessLayout {
  readonly version: 1;
  readonly layout: AreaLayout;
  readonly modules: readonly {
    id: string;
    rotation: number;
    column: number;
    row: number;
    ports: readonly ModulePort[];
  }[];
  /** Local outdoor safety guard only; broader DBL-371/372 remain pending. */
  readonly fallback: boolean;
}
function compose(
  area: AreaId,
  seed: number,
  fallback: boolean,
  catalog: readonly WildernessModule[] = WILDERNESS_MODULES,
): WildernessLayout {
  const derived = areaSeed(seed, area),
    random = wildernessRandom(derived);
  const ports: ModulePort[][] = Array.from(
    { length: COLUMNS * ROWS },
    () => [],
  );
  const seen = new Set([0]),
    stack = [0];
  // Randomized depth-first spanning tree: all modules belong to the same landscape.
  while (stack.length) {
    const current = stack[stack.length - 1]!,
      x = current % COLUMNS,
      y = Math.floor(current / COLUMNS);
    const choices = STEPS.filter(
      (s) =>
        x + s.x >= 0 &&
        x + s.x < COLUMNS &&
        y + s.y >= 0 &&
        y + s.y < ROWS &&
        !seen.has((y + s.y) * COLUMNS + x + s.x),
    );
    if (!choices.length) {
      stack.pop();
      continue;
    }
    const step = choices[Math.floor(random() * choices.length)]!,
      next = (y + step.y) * COLUMNS + x + step.x;
    ports[current]!.push(step.port);
    ports[next]!.push(step.reverse);
    seen.add(next);
    stack.push(next);
  }
  const width = COLUMNS * MODULE_SIZE,
    height = ROWS * MODULE_SIZE;
  const origin = { x: -width / 2, y: -height / 2 };
  const center = (index: number) => ({
    x: origin.x + (index % COLUMNS) * MODULE_SIZE + 3.5,
    y: origin.y + Math.floor(index / COLUMNS) * MODULE_SIZE + 3.5,
  });
  const anchors = [2 * COLUMNS, 2 * COLUMNS + COLUMNS - 1];
  const cells: ("solid" | "ground")[] = Array.from(
      { length: width * height },
      () => "solid",
    ),
    objects: AreaObject[] = [];
  const modules: WildernessLayout["modules"][number][] = [];
  for (let index = 0; index < ports.length; index++) {
    const column = index % COLUMNS,
      row = Math.floor(index / COLUMNS);
    const choice = moduleChoice(Math.floor(random() * 4294967296), catalog);
    const module: WildernessModule =
      fallback || index === 0 || anchors.includes(index)
        ? WILDERNESS_MODULES.find((m) => m.kind === "clearing")!
        : choice.module;
    const rotation = fallback ? 0 : choice.rotation;
    const stamp = stampModule(module, rotation, ports[index]!);
    for (let y = 0; y < MODULE_SIZE; y++)
      for (let x = 0; x < MODULE_SIZE; x++)
        cells[(row * MODULE_SIZE + y) * width + column * MODULE_SIZE + x] =
          stamp.cells[y * MODULE_SIZE + x]!;
    for (const [i, object] of stamp.objects.entries())
      objects.push({
        ...object,
        id: `wilderness-${index}-${i}`,
        position: {
          x: origin.x + column * MODULE_SIZE + object.position.x,
          y: origin.y + row * MODULE_SIZE + object.position.y,
        },
      });
    modules.push({
      id: module.id,
      rotation,
      column,
      row,
      ports: [...ports[index]!],
    });
  }
  return {
    version: WILDERNESS_LAYOUT_VERSION,
    fallback,
    modules,
    layout: {
      map: {
        area,
        seed: derived,
        terrain: { width, height, cellSize: 1, origin, cells },
        objects,
      },
      spawn: center(0),
      exits: areaDefinition(area).connections.map((edge, i) => {
        const trigger = center(anchors[i]!);
        return {
          id: edge.id,
          trigger,
          arrival: { x: trigger.x + 1.5, y: trigger.y },
        };
      }),
    },
  };
}
/** Outdoor-only generation; no runtime/save migration or dungeon generation. */
export function generateWilderness(
  area: "haunted-forest" | "forgotten-graveyard",
  seed: number,
  catalog: readonly WildernessModule[] = WILDERNESS_MODULES,
): WildernessLayout {
  if (area !== "haunted-forest" && area !== "forgotten-graveyard")
    throw Error("Not an outdoor wilderness area");
  const generated = compose(area, seed, false, catalog);
  if (wildernessConnected(generated.layout)) return generated;
  const fallback = compose(area, seed, true);
  if (!wildernessConnected(fallback.layout))
    throw Error("Invalid authored wilderness fallback");
  return fallback;
}
/** Checks exact actor clearance and swept edges, not merely adjacent ground labels. */
export function wildernessConnected(layout: AreaLayout): boolean {
  if (!validAreaLayout(layout)) return false;
  const t = layout.map.terrain,
    nav = areaNavigation(layout.map);
  const point = (index: number) => ({
    x: t.origin.x + ((index % t.width) + 0.5) * t.cellSize,
    y: t.origin.y + (Math.floor(index / t.width) + 0.5) * t.cellSize,
  });
  const first =
    Math.floor((layout.spawn.y - t.origin.y) / t.cellSize) * t.width +
    Math.floor((layout.spawn.x - t.origin.x) / t.cellSize);
  const visited = new Set([first]),
    queue = [first];
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const current = queue[cursor]!,
      from = point(current),
      x = current % t.width,
      y = Math.floor(current / t.width);
    for (const step of STEPS) {
      const nx = x + step.x,
        ny = y + step.y,
        next = ny * t.width + nx;
      if (
        nx < 0 ||
        ny < 0 ||
        nx >= t.width ||
        ny >= t.height ||
        visited.has(next)
      )
        continue;
      const to = point(next);
      if (
        areaWalkable(layout.map, to, WORLD_ACTOR_RADIUS) &&
        segmentWalkable(nav, from, to)
      ) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
  const reached = (p: { readonly x: number; readonly y: number }) => {
    const index =
      Math.floor((p.y - t.origin.y) / t.cellSize) * t.width +
      Math.floor((p.x - t.origin.x) / t.cellSize);
    return visited.has(index) && segmentWalkable(nav, point(index), p);
  };
  if (
    !reached(layout.spawn) ||
    !layout.exits.every((e) => reached(e.trigger) && reached(e.arrival))
  )
    return false;
  // Exclude isolated walkable fragments, including pockets around props.
  return t.cells.every(
    (cell, index) =>
      cell !== "ground" ||
      !areaWalkable(layout.map, point(index), WORLD_ACTOR_RADIUS) ||
      visited.has(index),
  );
}

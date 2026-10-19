import { generateValidated, generationAttemptSeed } from "./generation-retry";
import { validGeneratedPlacement } from "./generation-validation";
import { areaDefinition, areaSeed, type AreaId } from "./world";
import type { AreaLayout } from "./area-anchors";
import type { AreaObject } from "./area-map";
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
  /** True only when all bounded candidate attempts were rejected. */
  readonly fallback: boolean;
}
function compose(
  area: AreaId,
  seed: number,
  fallback: boolean,
  catalog: readonly WildernessModule[] = WILDERNESS_MODULES,
  attempt = 0,
): WildernessLayout {
  const derived = areaSeed(seed, area),
    random = wildernessRandom(generationAttemptSeed(derived, attempt));
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
  return generateValidated(
    (attempt) => compose(area, seed, false, catalog, attempt),
    (generated) => validGeneratedPlacement(generated.layout),
    () => compose(area, seed, true),
  );
}
/** Compatibility name for the version-one wilderness generator. */
export { connectedGeneratedArea as wildernessConnected } from "./generation-validation";

import type { Point } from "../world/isometric";
import { areaNavigation, type Navigation } from "../world/navigation";
import type { AreaMap } from "./area-map";
import { createCombat, stepCombat } from "./combat";
import { finishEncounter, spawnMonster, type Encounter } from "./encounter";
import { createWalker } from "./locomotion";
import { stepMonsterAI } from "./monster-ai";

/** Authored outdoor study only; never dispatched by campaign generation or saves. */
export const ACT1_START = { x: 12, y: 30 };
export const ACT1_CLEARINGS = [
  { name: "Fenward Crossing", x: 12, y: 30, rx: 10, ry: 8 },
  { name: "Cinder Meadow", x: 29, y: 29, rx: 11, ry: 9 },
  { name: "Briar Rise", x: 23, y: 11, rx: 10, ry: 8 },
  { name: "Weathered Shrine", x: 42, y: 14, rx: 8, ry: 8 },
] as const;

function segmentDistance(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x,
    dy = end.y - start.y;
  const fraction = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) /
        (dx * dx + dy * dy),
    ),
  );
  return Math.hypot(
    point.x - start.x - fraction * dx,
    point.y - start.y - fraction * dy,
  );
}

export function act1ReadabilityMap(): AreaMap {
  const width = 54,
    height = 48;
  const loop = [
    ACT1_CLEARINGS[0],
    ACT1_CLEARINGS[2],
    ACT1_CLEARINGS[3],
    ACT1_CLEARINGS[1],
  ];
  const cells: ("ground" | "solid")[] = Array.from(
    { length: width * height },
    (_, index) => {
      const point = {
        x: (index % width) + 0.5,
        y: Math.floor(index / width) + 0.5,
      };
      const clearing = ACT1_CLEARINGS.some(
        (c) =>
          ((point.x - c.x) / c.rx) ** 2 + ((point.y - c.y) / c.ry) ** 2 <= 1,
      );
      // A 4.25-unit center threshold includes the half-cell diagonal apron:
      // the rasterized terrain retains a 3.5-unit radius along every connector.
      const connector = loop.some(
        (start, i) =>
          segmentDistance(point, start, loop[(i + 1) % loop.length]!) <= 4.25,
      );
      return clearing || connector ? "ground" : "solid";
    },
  );
  return {
    area: "haunted-forest",
    seed: 42,
    terrain: { width, height, cellSize: 1, origin: { x: 0, y: 0 }, cells },
    objects: [
      {
        id: "act1-shrine",
        position: { x: 43, y: 12 },
        radius: 0.7,
        blocking: true,
        appearance: "act1-shrine",
      },
      ...[
        { id: "west", x: 5, y: 30, radius: 0.7 },
        { id: "north", x: 22, y: 5, radius: 0.65 },
        { id: "south", x: 30, y: 36, radius: 0.7 },
        { id: "east", x: 47, y: 16, radius: 0.7 },
      ].map((rock) => ({
        id: `act1-${rock.id}-rock`,
        position: { x: rock.x, y: rock.y },
        radius: rock.radius,
        blocking: true,
        appearance: "act1-rock",
      })),
    ],
  };
}

/** Existing combat actors and profiles, with only their authored start changed. */
export function createAct1Encounter(): Encounter {
  const combat = createCombat();
  combat.actors = combat.actors.slice(0, 1);
  combat.actors[0]!.controller.walker = createWalker(ACT1_START);
  // The authored brains own hostility; disable the legacy training auto-attack.
  combat.hostilesActive = false;
  const encounter: Encounter = {
    combat,
    brains: [],
    nextId: 1,
    seed: combat.seed,
    corpseTicks: 600,
    spawned: 0,
    despawned: 0,
    work: { pathRequests: 0, decisions: 0, separationCorrections: 0 },
  };
  const nav = areaNavigation(act1ReadabilityMap());
  for (const [role, position] of [
    ["melee", { x: 29, y: 29 }],
    ["flanker", { x: 32, y: 29 }],
  ] as const)
    if (spawnMonster(encounter, role, position, 0, false, nav) === null)
      throw new Error("Invalid authored outdoor encounter spawn");
  return encounter;
}

/** The standard encounter order with this study's logical-map navigation. */
export function stepAct1Encounter(
  encounter: Encounter,
  nav: Navigation,
  movement: Point = { x: 0, y: 0 },
  inputScale = 1,
): void {
  encounter.work = {
    ...stepMonsterAI(encounter.combat, encounter.brains, nav),
    separationCorrections: 0,
  };
  stepCombat(encounter.combat, nav, movement, inputScale);
  finishEncounter(encounter, nav);
}

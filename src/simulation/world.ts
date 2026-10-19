/** Logical world contracts. No renderer, browser, character or save ownership. */
export const AREA_IDS = [
  "ashen-refuge",
  "haunted-forest",
  "forgotten-graveyard",
  "ancient-crypt",
] as const;
export type AreaId = (typeof AREA_IDS)[number];
export interface WorldPoint {
  readonly x: number;
  readonly y: number;
}
export interface AreaConnection {
  readonly id: string;
  readonly destination: AreaId;
  readonly arrival: string;
}
export interface AreaDefinition {
  readonly id: AreaId;
  readonly name: string;
  readonly biome: "camp" | "wilderness" | "graveyard" | "dungeon";
  readonly level: number;
  readonly safe: boolean;
  readonly connections: readonly AreaConnection[];
}
export const WORLD_CONTENT_VERSION = 1;
export const WORLD_AREAS: readonly AreaDefinition[] = [
  {
    id: "ashen-refuge",
    name: "Ashen Refuge",
    biome: "camp",
    level: 1,
    safe: true,
    connections: [
      { id: "forest", destination: "haunted-forest", arrival: "camp" },
    ],
  },
  {
    id: "haunted-forest",
    name: "Haunted Forest",
    biome: "wilderness",
    level: 1,
    safe: false,
    connections: [
      { id: "camp", destination: "ashen-refuge", arrival: "forest" },
      {
        id: "graveyard",
        destination: "forgotten-graveyard",
        arrival: "forest",
      },
    ],
  },
  {
    id: "forgotten-graveyard",
    name: "Forgotten Graveyard",
    biome: "graveyard",
    level: 3,
    safe: false,
    connections: [
      { id: "forest", destination: "haunted-forest", arrival: "graveyard" },
      { id: "crypt", destination: "ancient-crypt", arrival: "graveyard" },
    ],
  },
  {
    id: "ancient-crypt",
    name: "Ancient Crypt",
    biome: "dungeon",
    level: 5,
    safe: false,
    connections: [
      { id: "graveyard", destination: "forgotten-graveyard", arrival: "crypt" },
    ],
  },
];
export function areaDefinition(id: AreaId): AreaDefinition {
  const area = WORLD_AREAS.find((entry) => entry.id === id);
  if (!area) throw new Error("Unknown world area");
  return area;
}
/** Identity hashing avoids generation-order dependence and shared RNG consumption. */
export function areaSeed(worldSeed: number, id: AreaId): number {
  if (!Number.isInteger(worldSeed) || worldSeed < 0 || worldSeed > 0xffffffff)
    throw new Error("World seed must be uint32");
  areaDefinition(id);
  let hash = (2166136261 ^ worldSeed) >>> 0;
  for (const char of `world-${WORLD_CONTENT_VERSION}:${id}`) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  }
  return hash;
}
export function validateWorldRegistry(
  areas: readonly AreaDefinition[],
): boolean {
  if (
    areas.length !== AREA_IDS.length ||
    new Set(areas.map((a) => a.id)).size !== areas.length
  )
    return false;
  if (!AREA_IDS.every((id) => areas.some((a) => a.id === id))) return false;
  for (const area of areas) {
    if (
      new Set(area.connections.map((c) => c.id)).size !==
      area.connections.length
    )
      return false;
    for (const edge of area.connections) {
      const destination = areas.find((a) => a.id === edge.destination);
      const reverse = destination?.connections.find(
        (c) => c.id === edge.arrival,
      );
      if (
        !reverse ||
        reverse.destination !== area.id ||
        reverse.arrival !== edge.id
      )
        return false;
    }
  }
  const seen = new Set<AreaId>();
  const pending: AreaId[] = ["ashen-refuge"];
  while (pending.length) {
    const id = pending.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    pending.push(
      ...areas.find((a) => a.id === id)!.connections.map((c) => c.destination),
    );
  }
  return seen.size === areas.length;
}

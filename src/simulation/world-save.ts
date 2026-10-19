import { AREA_IDS, areaSeed, type AreaId, type WorldPoint } from "./world";
import { planWorldContainers } from "./world-containers";
import { worldLayout, layoutFingerprint } from "./world-layout";
import { areaWalkable } from "./area-map";
import { WORLD_ACTOR_RADIUS, exitNear } from "./area-anchors";
import type { WorldDrop } from "./world-loot";
import { validateGeneratedItem } from "./item-save";
export interface ExplorationSnapshot {
  version: 1 | 2 | 3;
  containers?: import("./world-containers").ContainerState;
  contentVersion: number;
  seed: number;
  area: AreaId;
  position: WorldPoint;
  visited: AreaId[];
  areas: {
    id: AreaId;
    seed: number;
    drops: WorldDrop[];
    deaths: number[];
    layoutFingerprint?: string;
    discovery?: import("./world-discovery").AreaDiscovery;
  }[];
}
function record(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw Error("Invalid exploration object");
  return v as Record<string, unknown>;
}
function keys(v: Record<string, unknown>, names: string[]) {
  if (Object.keys(v).sort().join() !== names.sort().join())
    throw Error("Unexpected exploration fields");
}
function integer(v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  if (typeof v !== "number" || !Number.isSafeInteger(v) || v < min || v > max)
    throw Error("Invalid exploration integer");
  return v;
}
function point(v: unknown): WorldPoint {
  const p = record(v);
  keys(p, ["x", "y"]);
  if (
    typeof p.x !== "number" ||
    typeof p.y !== "number" ||
    !Number.isFinite(p.x) ||
    !Number.isFinite(p.y)
  )
    throw Error("Invalid exploration position");
  return { x: p.x, y: p.y };
}
function area(v: unknown): AreaId {
  if (!AREA_IDS.includes(v as AreaId))
    throw Error(
      "Unknown exploration area; original retained, camp session unchanged",
    );
  return v as AreaId;
}
export function validateExploration(value: unknown): ExplorationSnapshot {
  const w = record(value);
  keys(w, [
    "version",
    "contentVersion",
    "seed",
    "area",
    "position",
    "visited",
    "areas",
    ...(w.version === 2 || w.version === 3 ? ["containers"] : []),
  ]);
  if (
    (w.version !== 1 && w.version !== 2 && w.version !== 3) ||
    (w.contentVersion !== 1 && w.contentVersion !== 2)
  )
    throw Error("Unsupported exploration version");
  const contentVersion = w.contentVersion as number;
  const seed = integer(w.seed, 0, 0xffffffff),
    current = area(w.area),
    position = point(w.position);
  if (
    contentVersion === 1 &&
    current !== "ashen-refuge" &&
    current !== "haunted-forest"
  )
    throw Error(
      "Area runtime unavailable in this world version; original retained",
    );
  if (!Array.isArray(w.visited) || w.visited.length > 4)
    throw Error("Invalid exploration discovery");
  const visited = w.visited.map(area);
  if (new Set(visited).size !== visited.length || !visited.includes(current))
    throw Error("Invalid exploration discovery");
  if (!Array.isArray(w.areas) || w.areas.length !== 4)
    throw Error("Invalid exploration areas");
  const areas = w.areas.map((value) => {
    const a = record(value);
    keys(a, [
      "id",
      "seed",
      "drops",
      "deaths",
      ...(contentVersion === 2 ? ["layoutFingerprint"] : []),
      ...(w.version === 3 ? ["discovery"] : []),
    ]);
    const id = area(a.id);
    if (
      a.seed !== areaSeed(seed, id) ||
      !Array.isArray(a.drops) ||
      a.drops.length > 128 ||
      !Array.isArray(a.deaths) ||
      a.deaths.length > 4096
    )
      throw Error("Invalid exploration area state");
    const layout = worldLayout(id, seed, contentVersion);
    const fingerprint = layoutFingerprint(layout);
    if (contentVersion === 2 && a.layoutFingerprint !== fingerprint)
      throw Error("World layout fingerprint mismatch; original retained");
    let discovery: ExplorationSnapshot["areas"][number]["discovery"];
    if (w.version === 3) {
      const d = record(a.discovery);
      keys(d, ["version", "fingerprint", "cells"]);
      if (
        d.version !== 1 ||
        d.fingerprint !== fingerprint ||
        !Array.isArray(d.cells) ||
        d.cells.length > layout.map.terrain.cells.length
      )
        throw Error("Discovery layout mismatch");
      const cells = d.cells.map((v) =>
        integer(v, 0, layout.map.terrain.cells.length - 1),
      );
      if (new Set(cells).size !== cells.length)
        throw Error("Duplicate discovery cell");
      discovery = { version: 1, fingerprint, cells };
    }
    const map = layout.map;
    const drops = a.drops.map((value) => {
      const d = record(value);
      keys(d, ["item", "position", "tick", "source"]);
      const position = point(d.position);
      if (!areaWalkable(map, position, WORLD_ACTOR_RADIUS))
        throw Error("Invalid parked world drop");
      return {
        item: validateGeneratedItem(d.item),
        position: { ...position },
        tick: integer(d.tick),
        source: integer(d.source, -2),
      };
    });
    const deaths = a.deaths.map((v) => integer(v));
    if (
      new Set(deaths).size !== deaths.length ||
      (id === current && drops.length)
    )
      throw Error("Duplicate exploration state");
    return {
      id,
      ...(discovery ? { discovery } : {}),
      seed: areaSeed(seed, id),
      drops,
      deaths,
      ...(contentVersion === 2 ? { layoutFingerprint: fingerprint } : {}),
    };
  });
  if (
    new Set(areas.map((a) => a.id)).size !== 4 ||
    !areaWalkable(
      worldLayout(current, seed, contentVersion).map,
      position,
      WORLD_ACTOR_RADIUS,
    )
  )
    throw Error("Invalid exploration layout or position");
  let containers: ExplorationSnapshot["containers"];
  if (w.version === 2 || w.version === 3) {
    const c = record(w.containers);
    keys(c, ["version", "gold", "opened"]);
    if (c.version !== 1 || !Array.isArray(c.opened) || c.opened.length > 24)
      throw Error("Invalid container state");
    const valid = new Set(
      AREA_IDS.flatMap((id) =>
        planWorldContainers(worldLayout(id, seed, contentVersion)).map(
          (c) => c.id,
        ),
      ),
    );
    const opened = c.opened.map((v) => integer(v));
    if (
      new Set(opened).size !== opened.length ||
      opened.some((id) => !valid.has(id))
    )
      throw Error("Invalid opened container identity");
    containers = { version: 1, gold: integer(c.gold), opened };
  }
  return {
    version: w.version,
    ...(containers ? { containers } : {}),
    contentVersion,
    seed,
    area: current,
    position,
    visited,
    areas,
  };
}
/** Recover under the saved layout rules; never restart on an exit interaction zone. */
export function restoredPosition(snapshot: ExplorationSnapshot): WorldPoint {
  const layout = worldLayout(
    snapshot.area,
    snapshot.seed,
    snapshot.contentVersion,
  );
  return exitNear(layout, snapshot.position) ? layout.spawn : snapshot.position;
}

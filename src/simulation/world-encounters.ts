import type { AreaLayout } from "./area-anchors";
import {
  areaDefinition,
  AREA_IDS,
  type AreaId,
  type WorldPoint,
} from "./world";
import { areaNavigation, canWalk, segmentWalkable } from "../world/navigation";
import { wildernessRandom } from "./wilderness-modules";
import type { MonsterRole } from "./monsters";
export const WORLD_ENCOUNTER_VERSION = 1;
export const ENCOUNTER_SAFE_RADIUS = 9;
export type EncounterTier = "normal" | "champion" | "elite";
export interface WorldMonsterSpawn {
  readonly id: number;
  readonly pack: number;
  readonly role: MonsterRole;
  readonly position: WorldPoint;
  readonly tier: EncounterTier;
}
export interface BiomeEncounters {
  readonly packs: number;
  readonly roles: readonly MonsterRole[];
  readonly groupSize: number;
}
export const BIOME_ENCOUNTERS: Readonly<Record<AreaId, BiomeEncounters>> = {
  "ashen-refuge": { packs: 0, roles: [], groupSize: 0 },
  "haunted-forest": {
    packs: 5,
    roles: ["flanker", "melee", "ranged"],
    groupSize: 3,
  },
  "forgotten-graveyard": {
    packs: 6,
    roles: ["melee", "tank", "support", "ranged"],
    groupSize: 3,
  },
  "ancient-crypt": {
    packs: 7,
    roles: ["tank", "caster", "support", "melee"],
    groupSize: 4,
  },
};
/** Version-one encounter identities/stream are separate from map and loot RNG. */
export function planWorldEncounters(
  layout: AreaLayout,
): readonly WorldMonsterSpawn[] {
  const area = areaDefinition(layout.map.area),
    table = BIOME_ENCOUNTERS[area.id];
  if (area.safe) return [];
  const nav = areaNavigation(layout.map),
    t = layout.map.terrain;
  const random = wildernessRandom((layout.map.seed ^ 0x57340001) >>> 0);
  const reserved = [
    layout.spawn,
    ...layout.exits.flatMap((e) => [e.trigger, e.arrival]),
  ];
  const candidates: WorldPoint[] = [];
  for (let y = 0; y < t.height; y++)
    for (let x = 0; x < t.width; x++) {
      const p = {
        x: t.origin.x + (x + 0.5) * t.cellSize,
        y: t.origin.y + (y + 0.5) * t.cellSize,
      };
      if (
        canWalk(nav, p) &&
        reserved.every(
          (a) => Math.hypot(a.x - p.x, a.y - p.y) >= ENCOUNTER_SAFE_RADIUS,
        )
      )
        candidates.push(p);
    }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j]!, candidates[i]!];
  }
  const result: WorldMonsterSpawn[] = [],
    centers: WorldPoint[] = [];
  const identity = (AREA_IDS.indexOf(area.id) + 1) * 1000;
  for (const center of candidates) {
    if (centers.length >= table.packs) break;
    if (centers.some((p) => Math.hypot(p.x - center.x, p.y - center.y) < 6))
      continue;
    const positions: WorldPoint[] = [];
    for (const [dx, dy] of [
      [0, 0],
      [1.1, 0],
      [0, 1.1],
      [-1.1, 0],
      [0, -1.1],
      [1.1, 1.1],
      [-1.1, -1.1],
    ]) {
      const p = { x: center.x + dx!, y: center.y + dy! };
      if (
        canWalk(nav, p) &&
        segmentWalkable(nav, center, p) &&
        reserved.every(
          (a) => Math.hypot(a.x - p.x, a.y - p.y) >= ENCOUNTER_SAFE_RADIUS,
        ) &&
        result.every(
          (a) => Math.hypot(a.position.x - p.x, a.position.y - p.y) >= 0.9,
        )
      )
        positions.push(p);
      if (positions.length === table.groupSize) break;
    }
    if (positions.length !== table.groupSize) continue;
    const pack = centers.length,
      roll = random();
    const tier: EncounterTier =
      roll < 0.08 ? "elite" : roll < 0.35 ? "champion" : "normal";
    for (const [member, position] of positions.entries())
      result.push({
        id: identity + pack * 10 + member,
        pack: identity + pack,
        role: table.roles[(pack + member) % table.roles.length]!,
        position,
        tier: member === 0 ? tier : "normal",
      });
    centers.push(center);
  }
  return result;
}

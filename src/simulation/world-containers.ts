import type { AreaLayout } from "./area-anchors";
import { AREA_IDS, areaDefinition, type WorldPoint } from "./world";
import { areaNavigation, canWalk, segmentWalkable } from "../world/navigation";
import { wildernessRandom } from "./wilderness-modules";
import { generateLoot } from "./loot";
import type { ItemContent } from "./item-content";
import { placeLoot, type LootWorld } from "./world-loot";
export interface WorldContainer {
  id: number;
  position: WorldPoint;
  kind: "chest" | "barrel" | "crate";
  rare: boolean;
}
/** Container rules v1. Generated layouts already validate all clear ground as connected.
 * Placement consumes a separate stream and adds no collision or layout mutations. */
export function planWorldContainers(layout: AreaLayout): WorldContainer[] {
  if (areaDefinition(layout.map.area).safe) return [];
  const random = wildernessRandom((layout.map.seed ^ 0x434f4e31) >>> 0);
  const nav = areaNavigation(layout.map),
    t = layout.map.terrain;
  const candidates: WorldPoint[] = [];
  for (let y = 0; y < t.height; y++)
    for (let x = 0; x < t.width; x++) {
      const p = {
        x: t.origin.x + (x + 0.5) * t.cellSize,
        y: t.origin.y + (y + 0.5) * t.cellSize,
      };
      if (
        canWalk(nav, p) &&
        [
          layout.spawn,
          ...layout.exits.flatMap((e) => [e.trigger, e.arrival]),
        ].every((a) => Math.hypot(a.x - p.x, a.y - p.y) >= 3)
      )
        candidates.push(p);
    }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j]!, candidates[i]!];
  }
  const result: WorldContainer[] = [];
  for (const p of candidates) {
    if (result.length >= 6) break;
    if (
      result.some((c) => Math.hypot(c.position.x - p.x, c.position.y - p.y) < 4)
    )
      continue;
    const index = result.length;
    result.push({
      id: 50000 + AREA_IDS.indexOf(layout.map.area) * 100 + index,
      position: p,
      kind: index % 3 === 0 ? "chest" : index % 3 === 1 ? "barrel" : "crate",
      rare: index === 0,
    });
  }
  return result;
}
export interface ContainerState {
  version: 1;
  gold: number;
  opened: number[];
}
export function canOpenContainer(
  layout: AreaLayout,
  container: WorldContainer,
  player: WorldPoint,
): boolean {
  return (
    Math.hypot(
      player.x - container.position.x,
      player.y - container.position.y,
    ) <= 2 &&
    segmentWalkable(areaNavigation(layout.map), player, container.position)
  );
}
/** Stage all changes first. A full/blocked drop leaves both gold and opened state untouched. */
export function openWorldContainer(
  layout: AreaLayout,
  container: WorldContainer,
  player: WorldPoint,
  state: ContainerState,
  loot: LootWorld,
  tick: number,
  content: ItemContent,
): boolean {
  if (
    state.opened.includes(container.id) ||
    !canOpenContainer(layout, container, player)
  )
    return false;
  const level = areaDefinition(layout.map.area).level;
  const seed = (layout.map.seed ^ Math.imul(container.id, 0x9e3779b1)) >>> 0;
  const gold = (container.rare ? 40 : 8) * level + (seed % 13);
  if (!Number.isSafeInteger(state.gold + gold)) return false;
  const item = generateLoot(
    {
      seed,
      sequence: 0,
      areaLevel: level,
      monsterLevel: level,
      table: loot.table,
    },
    content,
  );
  const staged = { ...loot, drops: [...loot.drops] };
  if (
    item &&
    !placeLoot(
      staged,
      item,
      container.position,
      tick,
      container.id,
      areaNavigation(layout.map),
    )
  )
    return false;
  loot.drops = staged.drops;
  state.gold += gold;
  state.opened.push(container.id);
  return true;
}

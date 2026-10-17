import type { CombatEvent, CombatWorld } from "./combat";
import { generateLoot, type GeneratedItem } from "./loot";
import { identifyItem } from "./item-save";
import {
  canWalk,
  fromGround,
  onGround,
  segmentWalkable,
  type Navigation,
} from "../world/navigation";
import type { Point } from "../world/isometric";
export interface WorldDrop {
  item: GeneratedItem;
  position: Point;
  tick: number;
  source: number;
}
export interface LootWorld {
  seed: number;
  sequence: number;
  areaLevel: number;
  monsterLevel: number;
  table: string;
  drops: WorldDrop[];
  deaths: Set<number>;
  attempts: number;
  noDrop: number;
  blocked: number;
  capacity: number;
}
export function createLootWorld(seed = 42): LootWorld {
  return {
    seed: seed >>> 0,
    sequence: 0,
    areaLevel: 12,
    monsterLevel: 12,
    table: "court",
    drops: [],
    deaths: new Set(),
    attempts: 0,
    noDrop: 0,
    blocked: 0,
    capacity: 128,
  };
}
/** Deterministic bounded ring search. Ground spacing also protects readable labels. */
export function placeLoot(
  world: LootWorld,
  item: GeneratedItem,
  origin: Point,
  tick: number,
  source: number,
  nav: Navigation,
): WorldDrop | null {
  if (
    world.drops.length >= world.capacity ||
    world.drops.some((d) => d.item.id === item.id)
  ) {
    world.blocked++;
    return null;
  }
  const p = onGround(origin);
  for (let ring = 0; ring <= 12; ring++)
    for (let i = 0; i < (ring ? ring * 8 : 1); i++) {
      const angle = ring ? (i / (ring * 8)) * Math.PI * 2 : 0;
      const point = fromGround({
        x: p.x + Math.cos(angle) * ring * 28,
        y: p.y + Math.sin(angle) * ring * 28,
      });
      if (
        canWalk(nav, point) &&
        world.drops.every((d) => {
          const a = onGround(d.position),
            b = onGround(point);
          return Math.hypot(a.x - b.x, a.y - b.y) >= 26;
        })
      ) {
        const drop = { item, position: point, tick, source };
        world.drops.push(drop);
        return drop;
      }
    }
  world.blocked++;
  return null;
}
/** Call after combat/skill tick, while corpse positions still exist. Sorted + deduplicated. */
export function consumeLootDeaths(
  loot: LootWorld,
  combat: CombatWorld,
  nav: Navigation,
  events: readonly CombatEvent[] = combat.events,
): WorldDrop[] {
  const added: WorldDrop[] = [];
  for (const event of [...events]
    .filter(
      (e): e is Exclude<CombatEvent, { kind: "phase" }> => e.kind === "death",
    )
    .sort((a, b) => a.tick - b.tick || a.target - b.target)) {
    const actor = combat.actors.find((a) => a.id === event.target);
    if (!actor || actor.id === 0 || actor.hp > 0 || loot.deaths.has(actor.id))
      continue;
    loot.deaths.add(actor.id);
    loot.attempts++;
    if (loot.sequence > 0xffffffff) {
      loot.seed = (loot.seed + 1) >>> 0;
      loot.sequence = 0;
    }
    const item = generateLoot({
      seed: loot.seed,
      sequence: loot.sequence++,
      monsterLevel: loot.monsterLevel,
      areaLevel: loot.areaLevel,
      table: loot.table,
    });
    if (!item) {
      loot.noDrop++;
      continue;
    }
    const drop = placeLoot(
      loot,
      item,
      actor.controller.walker.position,
      event.tick,
      actor.id,
      nav,
    );
    if (drop) added.push(drop);
  }
  return added;
}
export function canInspectDrop(
  drop: WorldDrop,
  player: Point,
  nav: Navigation,
): boolean {
  const a = onGround(player),
    b = onGround(drop.position);
  return (
    Math.hypot(a.x - b.x, a.y - b.y) <= 110 &&
    segmentWalkable(nav, player, drop.position)
  );
}
export function identifyWorldDrop(
  drop: WorldDrop,
  player: Point,
  nav: Navigation,
): boolean {
  if (!canInspectDrop(drop, player, nav)) return false;
  drop.item = identifyItem(drop.item);
  return true;
}
/** Stable directional selection; all drops remain available and unreachable ones report range. */
export function selectLoot(
  loot: LootWorld,
  selected: string | null,
  delta: number,
): string | null {
  if (!loot.drops.length) return null;
  const i = loot.drops.findIndex((d) => d.item.id === selected);
  return (
    loot.drops[(i + delta + loot.drops.length) % loot.drops.length]?.item.id ??
    null
  );
}

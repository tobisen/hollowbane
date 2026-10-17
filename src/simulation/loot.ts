import { createRng } from "./core";
import {
  ITEM_CONTENT,
  type Affix,
  type ItemContent,
  type ItemStats,
  type Quality,
} from "./item-content";
export interface LootContext {
  seed: number;
  sequence: number;
  monsterLevel: number;
  areaLevel: number;
  table: string;
}
export interface RolledAffix {
  id: string;
  value: number;
}
export interface GeneratedItem {
  schema: 1;
  contentVersion: number;
  id: string;
  origin: LootContext;
  base: string;
  level: number;
  requirement: number;
  quality: Quality;
  identified: boolean;
  name: string;
  stats: ItemStats;
  affixes: RolledAffix[];
  unique: string | null;
}
export function weighted<T>(
  values: readonly T[],
  weight: (v: T) => number,
  random: () => number,
): T {
  const total = values.reduce((s, v) => s + weight(v), 0);
  if (
    !values.length ||
    !Number.isFinite(total) ||
    total <= 0 ||
    values.some((v) => !Number.isSafeInteger(weight(v)) || weight(v) < 0)
  )
    throw Error("Invalid weights");
  let r = random() * total;
  for (const v of values) {
    r -= weight(v);
    if (r < 0) return v;
  }
  return values[values.length - 1]!;
}
export function validateLootContext(c: LootContext): void {
  if (
    !c ||
    !Number.isSafeInteger(c.seed) ||
    c.seed < 0 ||
    c.seed > 0xffffffff ||
    !Number.isSafeInteger(c.sequence) ||
    c.sequence < 0 ||
    c.sequence > 0xffffffff ||
    ![c.monsterLevel, c.areaLevel].every(
      (v) => Number.isSafeInteger(v) && v >= 1 && v <= 99,
    ) ||
    typeof c.table !== "string"
  )
    throw Error("Invalid loot context");
}
/** Each roll has its own stream. Neither combat RNG nor another roll is consumed. */
export function generateLoot(
  context: LootContext,
  content: ItemContent = ITEM_CONTENT,
): GeneratedItem | null {
  validateLootContext(context);
  const table = content.tables.find((t) => t.id === context.table);
  if (!table) throw Error("Unknown drop table");
  // Avalanche the counter/seed before LCG expansion; nearby seeds must not share
  // the same first encounter outcomes. Content v2 records this algorithm change.
  let mixed =
    (context.seed ^ Math.imul(context.sequence + 1, 0x9e3779b1)) >>> 0;
  mixed = Math.imul(mixed ^ (mixed >>> 16), 0x85ebca6b);
  mixed = Math.imul(mixed ^ (mixed >>> 13), 0xc2b2ae35);
  const random = createRng((mixed ^ (mixed >>> 16)) >>> 0);
  if (random() * 10000 >= table.chance) return null;
  const level = Math.max(
    1,
    Math.min(
      99,
      Math.max(context.monsterLevel, context.areaLevel) + table.levelModifier,
    ),
  );
  const available = table.bases.filter(
    (b) => content.bases.find((x) => x.id === b.id)!.level <= level,
  );
  if (!available.length) return null;
  const baseId = weighted(
    available,
    (b) => b.weight * content.bases.find((x) => x.id === b.id)!.weight,
    random,
  ).id;
  const base = content.bases.find((b) => b.id === baseId)!;
  let quality = weighted(
    Object.entries(table.quality),
    (v) => v[1],
    random,
  )[0] as Quality;
  const templates = content.uniques.filter(
    (u) => u.base === base.id && u.level <= level,
  );
  let unique: string | null = null;
  const stats = { ...base.stats };
  let name = base.name;
  const affixes: RolledAffix[] = [];
  const chosen: Affix[] = [];
  if (quality === "unique" && !templates.length) quality = "rare";
  if (quality === "unique") {
    const u = templates[Math.floor(random() * templates.length)]!;
    unique = u.id;
    name = u.name;
    for (const [s, v] of Object.entries(u.stats))
      stats[s as keyof ItemStats] = (stats[s as keyof ItemStats] ?? 0) + v;
  }
  if (quality === "magic" || quality === "rare") {
    const count =
      quality === "magic"
        ? 1 + Math.floor(random() * 2)
        : 3 + Math.floor(random() * 2);
    for (let i = 0; i < count; i++) {
      const pool = content.affixes.filter(
        (a) =>
          a.categories.includes(base.category) &&
          level >= a.minLevel &&
          level <= a.maxLevel &&
          !chosen.some(
            (b) =>
              b.group === a.group ||
              b.excludes.includes(a.group) ||
              a.excludes.includes(b.group),
          ) &&
          chosen.filter((b) => b.kind === a.kind).length <
            (quality === "magic" ? 1 : 2),
      );
      if (!pool.length) break;
      const a = weighted(pool, (a) => a.weight, random);
      chosen.push(a);
      const value = a.min + Math.floor(random() * (a.max - a.min + 1));
      affixes.push({ id: a.id, value });
      stats[a.stat] = (stats[a.stat] ?? 0) + value;
    }
    name = [
      ...chosen.filter((a) => a.kind === "prefix").map((a) => a.name),
      base.name,
      ...chosen.filter((a) => a.kind === "suffix").map((a) => a.name),
    ].join(" ");
  }
  return {
    schema: 1,
    contentVersion: content.version,
    id: `l${content.version}-${context.seed.toString(16)}-${context.sequence.toString(16)}`,
    origin: { ...context },
    base: base.id,
    level,
    requirement: Math.max(
      base.requirement,
      ...chosen.map((a) => Math.max(1, a.minLevel - 2)),
    ),
    quality,
    identified: quality === "normal",
    name,
    stats,
    affixes,
    unique,
  };
}

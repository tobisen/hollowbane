import {
  ITEM_CONTENT,
  QUALITIES,
  type ItemContent,
  type Quality,
} from "./item-content";
import { generateLoot, type LootContext } from "./loot";
import { validateGeneratedItem } from "./item-save";
export function inspectDropTable(
  level: number,
  tableId = "court",
  content: ItemContent = ITEM_CONTENT,
) {
  const table = content.tables.find((t) => t.id === tableId);
  if (!table || !Number.isInteger(level) || level < 1 || level > 99)
    throw Error("Invalid table/level");
  const bases = table.bases.map((b) => {
    const base = content.bases.find((x) => x.id === b.id)!;
    return {
      id: base.id,
      level: base.level,
      eligible: base.level <= level,
      effectiveWeight: b.weight * base.weight,
      uniqueEligible: content.uniques.some(
        (u) => u.base === base.id && u.level <= level,
      ),
    };
  });
  const total = bases
      .filter((b) => b.eligible)
      .reduce((s, b) => s + b.effectiveWeight, 0),
    uniqueShare = total
      ? bases
          .filter((b) => b.eligible && b.uniqueEligible)
          .reduce((s, b) => s + b.effectiveWeight, 0) / total
      : 0;
  const sum = QUALITIES.reduce((s, q) => s + table.quality[q], 0),
    expected = Object.fromEntries(
      QUALITIES.map((q) => [q, table.quality[q] / sum]),
    ) as Record<Quality, number>;
  expected.rare += expected.unique * (1 - uniqueShare);
  expected.unique *= uniqueShare;
  return {
    table: table.id,
    chance: table.chance / 10000,
    level,
    qualityWeights: { ...table.quality },
    expectedConditionalQuality: expected,
    bases,
    affixes: content.affixes
      .filter((a) => a.minLevel <= level && a.maxLevel >= level)
      .map((a) => ({
        id: a.id,
        kind: a.kind,
        group: a.group,
        categories: a.categories,
        excludes: a.excludes,
        range: [a.min, a.max],
      })),
  };
}
export function simulateLoot(
  context: Omit<LootContext, "sequence">,
  rolls: number,
  content: ItemContent = ITEM_CONTENT,
) {
  if (!Number.isInteger(rolls) || rolls < 1 || rolls > 100000)
    throw Error("Simulation count must be 1–100000");
  const table = content.tables.find((t) => t.id === context.table);
  if (!table) throw Error("Unknown table");
  const level = Math.max(
    1,
    Math.min(
      99,
      Math.max(context.monsterLevel, context.areaLevel) + table.levelModifier,
    ),
  );
  const inspection = inspectDropTable(level, context.table, content),
    quality: Record<Quality, number> = {
      normal: 0,
      magic: 0,
      rare: 0,
      unique: 0,
    },
    bases: Record<string, number> = {},
    examples: Partial<Record<Quality, ReturnType<typeof generateLoot>>> = {};
  let drops = 0;
  for (let sequence = 0; sequence < rolls; sequence++) {
    const item = generateLoot({ ...context, sequence }, content);
    if (!item) continue;
    validateGeneratedItem(item, content);
    drops++;
    quality[item.quality]++;
    bases[item.base] = (bases[item.base] ?? 0) + 1;
    examples[item.quality] ??= item;
    const affixes = item.affixes.map((a) =>
      content.affixes.find((x) => x.id === a.id)!,
    );
    if (
      new Set(affixes.map((a) => a.group)).size !== affixes.length ||
      affixes.some(
        (a) =>
          !a.categories.includes(
            content.bases.find((b) => b.id === item.base)!.category,
          ) ||
          a.minLevel > item.level ||
          a.maxLevel < item.level ||
          affixes.some((b) => a.excludes.includes(b.group)),
      )
    )
      throw Error("Invalid generated affix combination");
  }
  const expectedDrops = rolls * inspection.chance;
  const within = (actual: number, n: number, p: number) =>
    Math.abs(actual - n * p) <= 6 * Math.sqrt(n * p * (1 - p)) + 5;
  const totalWeight = inspection.bases
    .filter((b) => b.eligible)
    .reduce((s, b) => s + b.effectiveWeight, 0);
  const expectedBases = Object.fromEntries(
    inspection.bases.map((b) => [
      b.id,
      b.eligible ? b.effectiveWeight / totalWeight : 0,
    ]),
  );
  const distributionValid =
    within(drops, rolls, inspection.chance) &&
    Object.entries(expectedBases).every(([id, p]) =>
      within(bases[id] ?? 0, drops, p),
    ) &&
    QUALITIES.every((q) =>
      within(quality[q], drops, inspection.expectedConditionalQuality[q]),
    );
  return {
    context,
    rolls,
    drops,
    empty: rolls - drops,
    quality,
    bases,
    expectedDrops,
    expectedBases,
    expectedConditionalQuality: inspection.expectedConditionalQuality,
    distributionValid,
    invalidItems: 0,
    examples,
  };
}

import { ADVANCED_ITEMS } from "./advanced-item-content";
import type { ItemModifier, ModifierCondition } from "./item-modifiers";
import type { GeneratedItem } from "./loot";
function condition(c: ModifierCondition): string {
  switch (c.kind) {
    case "always":
      return "";
    case "health-below":
      return ` while health < ${c.fraction * 100}%`;
    case "target-status":
      return ` against ${c.status} targets`;
    case "element":
      return ` for ${c.element} damage`;
    case "weapon":
      return ` with ${c.weapon} weapons`;
  }
}
export function describeModifier(m: ItemModifier): string {
  const suffix = condition(m.condition);
  if (m.kind === "stat") {
    const value =
      m.operation === "add"
        ? `${m.value >= 0 ? "+" : ""}${m.value}`
        : m.operation === "increase"
          ? `${m.value >= 0 ? "+" : ""}${Math.round(m.value * 100)}%`
          : `×${m.value}`;
    return `${m.stat}: ${value}${suffix}`;
  }
  const e = m.effect;
  const effect =
    e.kind === "damage"
      ? `${e.amount} ${e.element} damage`
      : e.kind === "restore"
        ? `restore ${e.amount} ${e.resource}`
        : `${e.status} ${e.magnitude} for ${e.duration} ticks`;
  return `${m.chanceBasisPoints / 100}% on ${m.event} (${m.eligibility}): ${effect}; recovery ${m.cooldownTicks} ticks${suffix}`;
}
/** Read-only, identified information only. The inventory and world inspector share wording. */
export function describeAdvancedItem(
  item: GeneratedItem,
  equipped: readonly GeneratedItem[] = [],
): string {
  if (!item.identified || !item.advanced) return "";
  const lines = item.advanced.modifiers.map(describeModifier);
  if (item.unique) lines.unshift(`Unique identity: ${item.unique}`);
  if (item.advanced.set) {
    const set = ADVANCED_ITEMS.sets.find(
      (s) => s.id === item.advanced!.set!.id,
    )!;
    const worn = new Set(
      equipped
        .filter((i) => i.identified && i.advanced?.set?.id === set.id)
        .map((i) => i.advanced!.set!.piece),
    );
    lines.unshift(`${set.name} · ${worn.size}/${set.pieces.length} equipped`);
    for (const piece of set.pieces)
      lines.push(`${worn.has(piece.id) ? "✓" : "○"} ${piece.name}`);
    for (const bonus of set.bonuses) {
      lines.push(
        `${worn.size >= bonus.count ? "ACTIVE" : "Inactive"} ${bonus.count}-piece bonus:`,
      );
      // Fixed set bonuses share the same formatter as rolled modifiers.
      for (const m of bonus.modifiers)
        lines.push(
          describeModifier(
            m.kind === "stat"
              ? { ...m, source: `set:${set.id}`, value: m.min }
              : { ...m, source: `set:${set.id}` },
          ),
        );
    }
  }
  return lines.join("\n");
}

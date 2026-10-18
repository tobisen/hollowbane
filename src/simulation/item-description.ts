import { ADVANCED_ITEMS } from "./advanced-item-content";
import type { ItemModifier, ModifierCondition } from "./item-modifiers";
import type { GeneratedItem } from "./loot";
import { SOCKET_CONTENT, SOCKET_KINDS, gemModifiers } from "./socket-content";
import { RUNE_CONTENT } from "./rune-content";
import { runeModifiers, activeRuneRecipe } from "./rune-recipes";
import SKILLS from "../content/skills.json" with { type: "json" };
import { EQUIPMENT_CONTENT } from "./item-content";
import { equipmentModifiers } from "./equipment-modifiers";
import type { CharacterInventory } from "./equipment";
function condition(c: ModifierCondition): string {
  switch (c.kind) {
    case "always":
      return "";
    case "health-below":
      return ` while health < ${c.fraction * 100}%`;
    case "target-status":
      return ` against ${c.status === "poison" ? "poisoned" : c.status === "slow" ? "slowed" : "empowered"} targets`;
    case "element":
      return ` for ${c.element} damage`;
    case "weapon":
      return ` with ${c.weapon} weapons`;
  }
}
export function describeModifier(m: ItemModifier): string {
  const suffix = condition(m.condition);
  if (m.kind === "stat") {
    const percent =
      [
        "attackSpeed",
        "castSpeed",
        "hitRecovery",
        "lifeLeech",
        "manaLeech",
        "dotBonus",
      ].includes(m.stat) || m.stat.endsWith("Resistance");
    const value =
      m.operation === "add"
        ? `${m.value >= 0 ? "+" : ""}${m.value}${percent ? "%" : ""}`
        : m.operation === "increase"
          ? `${m.value >= 0 ? "+" : ""}${Math.round(m.value * 100)}%`
          : `×${m.value}`;
    const raw = m.stat.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
    const definition = m.stat.startsWith("skill.")
      ? SKILLS.find((s) => s.id === m.stat.slice(6))
      : undefined;
    const label = m.stat.startsWith("skill.")
      ? `${definition?.name ?? m.stat.slice(6)} ${definition?.damage === 0 && definition.status?.kind === "power" ? "buff" : "damage"} rank`
      : m.stat === "dotBonus"
        ? "Damage over time"
        : m.stat === "life"
          ? "Maximum health"
          : m.stat === "mana"
            ? "Maximum mana"
            : raw[0]!.toUpperCase() + raw.slice(1);
    return `${label}: ${value}${m.stat === "lifeLeech" || m.stat === "manaLeech" ? " (physical basic weapon hits only)" : ""}${suffix}`;
  }
  const e = m.effect;
  const effect =
    e.kind === "damage"
      ? `${e.amount} ${e.element} damage`
      : e.kind === "restore"
        ? `restore ${e.amount} ${e.resource}`
        : `${e.status} ${e.status === "slow" || e.status === "power" ? `${e.magnitude * 100}%` : e.magnitude} for ${e.duration} ticks`;
  return `${m.chanceBasisPoints / 100}% on ${m.event} (${m.eligibility}): ${effect}; recovery ${m.cooldownTicks} ticks${suffix}`;
}
/** Identified information only; shared by world labels, hover and selected-item inspection. */
export function describeAdvancedItem(
  item: GeneratedItem,
  equipped: readonly GeneratedItem[] = [],
): string {
  if (!item.identified || item.contentVersion < 4) return "";
  const lines = item.advanced?.modifiers.map(describeModifier) ?? [];
  if (item.unique) lines.unshift(`Unique identity: ${item.unique}`);
  const gem = SOCKET_CONTENT.gems.find((g) => g.id === item.base),
    rune = RUNE_CONTENT.components.find((r) => r.id === item.base);
  if (gem || rune) {
    lines.push(
      gem
        ? `Gem grade ${gem.grade} · ${gem.element}`
        : `Sigil component · requires level ${rune!.level}`,
    );
    for (const kind of SOCKET_KINDS) {
      lines.push(`${kind[0]!.toUpperCase() + kind.slice(1)}:`);
      lines.push(
        ...(gem
          ? gemModifiers(item.base, kind, item.id)
          : runeModifiers(item.base, kind, item.id)
        ).map(describeModifier),
      );
    }
  }
  if (item.socketCapacity !== undefined) {
    lines.push(
      `Sockets ${item.embedded?.length ?? 0}/${item.socketCapacity} · ordered insertion`,
    );
    const host = SOCKET_CONTENT.hosts[item.base];
    for (let i = 0; i < item.socketCapacity; i++) {
      const component = item.embedded?.[i];
      lines.push(`${i + 1}. ${component?.name ?? "Empty socket"}`);
      if (component && host)
        lines.push(
          ...(SOCKET_CONTENT.gems.some((g) => g.id === component.base)
            ? gemModifiers(component.base, host.kind, component.id)
            : runeModifiers(component.base, host.kind, component.id)
          ).map(describeModifier),
        );
    }
    const pattern = activeRuneRecipe(item);
    if (pattern) {
      lines.push(
        `Pattern: ${pattern.name} · ${equipped.some((i) => i.id === item.id) ? "ACTIVE" : "inactive until equipped"}`,
      );
      lines.push(
        ...pattern.modifiers.map((m) =>
          describeModifier({ ...m, source: `pattern:${item.id}` }),
        ),
      );
    }
    if (item.socketCapacity > 0)
      lines.push(
        "Extract all contents intact; room for every component is required.",
      );
  }
  if (item.advanced?.set) {
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
/** Numeric derived comparisons handle caps; these differences also expose conditions and proc contracts. */
export function compareItemModifiers(
  before: CharacterInventory,
  after: CharacterInventory,
): { added: string[]; removed: string[] } {
  const ordered = (c: CharacterInventory) =>
    equipmentModifiers(c).modifiers.sort((a, b) => {
      const x = `${a.source}:${a.id}`,
        y = `${b.source}:${b.id}`;
      return x < y ? -1 : x > y ? 1 : 0;
    });
  const a = ordered(before),
    b = ordered(after);
  const signature = (m: ItemModifier) => JSON.stringify(m);
  const old = new Set(a.map(signature)),
    next = new Set(b.map(signature));
  return {
    added: b.filter((m) => !old.has(signature(m))).map(describeModifier),
    removed: a.filter((m) => !next.has(signature(m))).map(describeModifier),
  };
}
export function describeRuneRecipes(): string {
  return RUNE_CONTENT.recipes
    .map((r) =>
      [
        `${r.name} · level ${r.level} · ${r.sequence.length} sockets · ${r.qualities.join("/")}`,
        `Hosts: ${r.bases.map((id) => EQUIPMENT_CONTENT.bases.find((b) => b.id === id)!.name).join(", ")}`,
        r.sequence
          .map((id) => RUNE_CONTENT.components.find((c) => c.id === id)!.name)
          .join(" → "),
        ...r.modifiers.map((m) =>
          describeModifier({ ...m, source: "recipe-book" }),
        ),
      ].join("\n"),
    )
    .join("\n\n");
}

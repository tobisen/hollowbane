import { EQUIPMENT_CONTENT, CATEGORIES, type Category } from "./item-content";
import {
  rollModifiers,
  validateModifierTemplates,
  type ModifierTemplate,
} from "./advanced-item-content";
import type {
  ModifierStat,
  ItemModifier,
  ModifierCondition,
} from "./item-modifiers";
export interface AdvancedAffix {
  id: string;
  name: string;
  kind: "prefix" | "suffix";
  group: string;
  excludes: string[];
  categories: Category[];
  minLevel: number;
  maxLevel: number;
  weight: number;
  modifiers: ModifierTemplate[];
}
function stat(
  id: string,
  stat: ModifierStat,
  min: number,
  max = min,
  condition: ModifierCondition = { kind: "always" },
  operation: "add" | "increase" = "add",
): ModifierTemplate {
  return {
    kind: "stat",
    id,
    stat,
    min,
    max,
    step: operation === "add" ? 1 : 0.01,
    operation,
    condition,
    group: id,
    stacking: "sum",
    priority: 0,
  };
}
const weapons: Category[] = ["blade", "bow", "staff"],
  armor: Category[] = [
    "chest",
    "helm",
    "shield",
    "boots",
    "gloves",
    "belt",
    "ring",
    "amulet",
  ];
function affix(
  id: string,
  name: string,
  kind: AdvancedAffix["kind"],
  categories: Category[],
  level: number,
  modifiers: ModifierTemplate[],
  weight = 8,
): AdvancedAffix {
  return {
    id,
    name,
    kind,
    categories,
    minLevel: level,
    maxLevel: 99,
    modifiers,
    weight,
    group: id,
    excludes: [],
  };
}
export const ADVANCED_AFFIXES: AdvancedAffix[] = [
  ...EQUIPMENT_CONTENT.affixes.map((a) => ({
    id: a.id,
    name: a.name,
    kind: a.kind,
    group: a.group,
    excludes: [...a.excludes],
    categories: [...a.categories],
    minLevel: a.minLevel,
    maxLevel: a.maxLevel,
    weight: a.weight,
    modifiers: [
      stat(a.id, a.stat === "speed" ? "attackSpeed" : a.stat, a.min, a.max),
    ],
  })),
  ...[
    ["ember-lance", "Kindled"],
    ["rime-ring", "Hoarbound"],
    ["storm-thread", "Stormwoven"],
    ["iron-fan", "Ironwrought"],
    ["oath-echo", "Vowbound"],
    ["briar-edge", "Thornmarked"],
  ].map(([skill, name]) =>
    affix(
      `talent-${skill}`,
      name!,
      "prefix",
      ["staff", "amulet", "gloves"],
      12,
      [stat(`talent-${skill}`, `skill.${skill}`, 1, 2)],
      4,
    ),
  ),
  affix("quickhand", "Quickhand", "prefix", [...weapons, "gloves"], 8, [
    stat("quickhand", "attackSpeed", 5, 12),
  ]),
  affix("quick-ash", "of Quick Ash", "suffix", ["staff", "ring", "amulet"], 8, [
    stat("quick-ash", "castSpeed", 5, 12),
  ]),
  affix("resolute", "Resolute", "prefix", armor, 8, [
    stat("resolute", "hitRecovery", 8, 20),
  ]),
  affix(
    "red-return",
    "of Red Return",
    "suffix",
    [...weapons, "ring"],
    12,
    [stat("red-return", "lifeLeech", 1, 3)],
    5,
  ),
  affix(
    "deep-return",
    "of Deep Return",
    "suffix",
    [...weapons, "ring"],
    12,
    [stat("deep-return", "manaLeech", 1, 2)],
    5,
  ),
  affix("briarwrought", "Briarwrought", "prefix", [...weapons, "gloves"], 12, [
    stat("briarwrought", "dotBonus", 8, 20),
  ]),
  affix("storm-shelter", "of Storm Shelter", "suffix", armor, 8, [
    stat("storm-shelter", "lightningResistance", 8, 18),
  ]),
  affix("mire-shelter", "of Mire Shelter", "suffix", armor, 8, [
    stat("mire-shelter", "poisonResistance", 8, 18),
  ]),
  affix(
    "stone-shelter",
    "of Stone Shelter",
    "suffix",
    ["helm", "shield", "chest"],
    24,
    [stat("stone-shelter", "physicalResistance", 1, 3)],
    3,
  ),
  affix(
    "coalburst",
    "Coalburst",
    "prefix",
    weapons,
    12,
    [
      {
        kind: "proc",
        id: "coalburst",
        condition: { kind: "always" },
        event: "hit",
        eligibility: "weapon",
        chanceBasisPoints: 800,
        cooldownTicks: 60,
        effect: { kind: "damage", element: "fire", amount: 6 },
      },
    ],
    4,
  ),
  affix(
    "mire-bite",
    "of Mire Bite",
    "suffix",
    weapons,
    16,
    [
      {
        kind: "proc",
        id: "mire-bite",
        condition: { kind: "always" },
        event: "hit",
        eligibility: "weapon",
        chanceBasisPoints: 800,
        cooldownTicks: 90,
        effect: {
          kind: "status",
          status: "poison",
          magnitude: 2,
          duration: 120,
        },
      },
    ],
    4,
  ),
  affix(
    "harvest",
    "of Quiet Harvest",
    "suffix",
    [...weapons, "amulet"],
    16,
    [
      {
        kind: "proc",
        id: "harvest",
        condition: { kind: "always" },
        event: "kill",
        eligibility: "direct",
        chanceBasisPoints: 10000,
        cooldownTicks: 60,
        effect: { kind: "restore", resource: "life", amount: 4 },
      },
    ],
    4,
  ),
  affix("last-guard", "Lastguard", "prefix", armor, 12, [
    stat("last-guard", "armor", 5, 12, {
      kind: "health-below",
      fraction: 0.35,
    }),
  ]),
  affix("mire-hunter", "Mirehunter", "prefix", weapons, 16, [
    stat(
      "mire-hunter",
      "damage",
      0.05,
      0.15,
      { kind: "target-status", status: "poison" },
      "increase",
    ),
  ]),
  affix(
    "ember-accord",
    "Emberbound",
    "prefix",
    ["staff", "ring", "amulet"],
    16,
    [
      stat(
        "ember-accord",
        "damage",
        0.04,
        0.1,
        { kind: "element", element: "fire" },
        "increase",
      ),
    ],
  ),
];
export function validateAdvancedAffixes(pool: readonly AdvancedAffix[]): void {
  if (!Array.isArray(pool) || !pool.length || pool.length > 256)
    throw Error("Invalid advanced affix pool");
  const ids = new Set<string>();
  for (const a of pool) {
    if (
      !a ||
      Object.keys(a).sort().join(",") !==
        "categories,excludes,group,id,kind,maxLevel,minLevel,modifiers,name,weight" ||
      typeof a.id !== "string" ||
      !/^[a-z][a-z0-9-]{0,47}$/.test(a.id) ||
      ids.has(a.id) ||
      typeof a.name !== "string" ||
      a.name.length < 1 ||
      a.name.length > 64 ||
      /[<>]/.test(a.name) ||
      [...a.name].some((c) => c.charCodeAt(0) < 32) ||
      !["prefix", "suffix"].includes(a.kind) ||
      typeof a.group !== "string" ||
      !/^[a-z][a-z0-9-]{0,47}$/.test(a.group) ||
      !Array.isArray(a.excludes) ||
      a.excludes.length > 32 ||
      a.excludes.some(
        (x: string) =>
          typeof x !== "string" || !/^[a-z][a-z0-9-]{0,47}$/.test(x),
      ) ||
      !Array.isArray(a.categories) ||
      !a.categories.length ||
      a.categories.length > CATEGORIES.length ||
      new Set(a.categories).size !== a.categories.length ||
      a.categories.some(
        (c: Category) => !CATEGORIES.includes(c) || c === "gem" || c === "rune",
      ) ||
      !Number.isSafeInteger(a.minLevel) ||
      a.minLevel < 1 ||
      !Number.isSafeInteger(a.maxLevel) ||
      a.maxLevel < a.minLevel ||
      a.maxLevel > 99 ||
      !Number.isSafeInteger(a.weight) ||
      a.weight < 1 ||
      a.weight > 10000
    )
      throw Error("Invalid advanced affix");
    ids.add(a.id);
    validateModifierTemplates(a.modifiers);
  }
}
function conflict(a: AdvancedAffix, b: AdvancedAffix): boolean {
  return (
    a.group === b.group ||
    a.excludes.includes(b.group) ||
    b.excludes.includes(a.group)
  );
}
export function validateAdvancedAffixSelection(
  ids: readonly string[],
  category: Category,
  level: number,
  quality: string,
  pool = ADVANCED_AFFIXES,
): void {
  const chosen = ids.map((id) => pool.find((a) => a.id === id));
  if (
    !["magic", "rare"].includes(quality) ||
    ids.length > (quality === "magic" ? 2 : 4) ||
    new Set(ids).size !== ids.length ||
    chosen.some(
      (a) =>
        !a ||
        !a.categories.includes(category) ||
        level < a.minLevel ||
        level > a.maxLevel,
    ) ||
    ["prefix", "suffix"].some(
      (kind) =>
        chosen.filter((a) => a!.kind === kind).length >
        (quality === "magic" ? 1 : 2),
    ) ||
    chosen.some((a, i) => chosen.slice(i + 1).some((b) => conflict(a!, b!)))
  )
    throw Error("Invalid advanced affix selection");
}
/** Same maximum affix budget as the legacy roll; expanded pools replace, never append free affixes. */
export function rollAdvancedAffixes(
  base: { name: string; category: Category; requirement: number },
  level: number,
  quality: "magic" | "rare",
  source: string,
  random: () => number,
  pool = ADVANCED_AFFIXES,
): {
  name: string;
  requirement: number;
  affixes: string[];
  modifiers: ItemModifier[];
} {
  const chosen: AdvancedAffix[] = [],
    modifiers: ItemModifier[] = [];
  const draw = () => {
    const n = random();
    if (!Number.isFinite(n) || n < 0 || n >= 1)
      throw Error("Invalid affix RNG");
    return n;
  };
  const count =
    quality === "magic"
      ? 1 + Math.floor(draw() * 2)
      : 3 + Math.floor(draw() * 2);
  for (let i = 0; i < count; i++) {
    const available = pool.filter(
      (a) =>
        a.categories.includes(base.category) &&
        level >= a.minLevel &&
        level <= a.maxLevel &&
        !chosen.some((b) => conflict(a, b)) &&
        chosen.filter((b) => b.kind === a.kind).length <
          (quality === "magic" ? 1 : 2),
    );
    if (!available.length) break;
    const total = available.reduce((s, a) => s + a.weight, 0);
    let n = draw() * total;
    const selected =
      available.find((a) => (n -= a.weight) < 0) ?? available.at(-1)!;
    chosen.push(selected);
    modifiers.push(...rollModifiers(selected.modifiers, source, draw));
  }
  return {
    name: [
      ...chosen.filter((a) => a.kind === "prefix").map((a) => a.name),
      base.name,
      ...chosen.filter((a) => a.kind === "suffix").map((a) => a.name),
    ].join(" "),
    requirement: Math.max(
      base.requirement,
      ...chosen.map((a) => Math.max(1, a.minLevel - 2)),
    ),
    affixes: chosen.map((a) => a.id),
    modifiers,
  };
}
validateAdvancedAffixes(ADVANCED_AFFIXES);

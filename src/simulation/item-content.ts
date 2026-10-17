/** Original, versioned item content. Independent of engine, input and clock. */
export const ITEM_VERSION = 2;
export const QUALITIES = ["normal", "magic", "rare", "unique"] as const;
export type Quality = (typeof QUALITIES)[number];
export const CATEGORIES = [
  "blade",
  "bow",
  "staff",
  "chest",
  "helm",
  "shield",
  "boots",
  "ring",
] as const;
export type Category = (typeof CATEGORIES)[number];
export const STATS = [
  "damage",
  "armor",
  "accuracy",
  "life",
  "mana",
  "fireResistance",
  "coldResistance",
  "speed",
] as const;
export type ItemStat = (typeof STATS)[number];
export type ItemStats = Partial<Record<ItemStat, number>>;
export interface ItemBase {
  id: string;
  name: string;
  category: Category;
  level: number;
  requirement: number;
  weight: number;
  stats: ItemStats;
}
export interface Affix {
  id: string;
  name: string;
  kind: "prefix" | "suffix";
  group: string;
  excludes: string[];
  categories: Category[];
  minLevel: number;
  maxLevel: number;
  weight: number;
  stat: ItemStat;
  min: number;
  max: number;
}
export interface UniqueItem {
  id: string;
  name: string;
  base: string;
  level: number;
  stats: ItemStats;
}
export interface DropTable {
  id: string;
  chance: number;
  levelModifier: number;
  quality: Record<Quality, number>;
  bases: { id: string; weight: number }[];
}
export interface ItemContent {
  version: number;
  bases: ItemBase[];
  affixes: Affix[];
  uniques: UniqueItem[];
  tables: DropTable[];
}
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown, min = 0, max = 100000): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= min && v <= max;
const id = (v: unknown): v is string =>
  typeof v === "string" && /^[a-z][a-z0-9-]{0,47}$/.test(v);
const name = (v: unknown): v is string =>
  typeof v === "string" &&
  v.length > 0 &&
  v.length <= 64 &&
  !/[<>]/.test(v) &&
  [...v].every((c) => c.charCodeAt(0) >= 32);
export function validItemStats(v: unknown): v is ItemStats {
  return (
    record(v) &&
    Object.keys(v).length > 0 &&
    Object.entries(v).every(([k, n]) => STATS.includes(k as ItemStat) && num(n))
  );
}
/** Atomic validation, detached copy; bounded registries and cross references. */
export function validateItemContent(value: unknown): ItemContent {
  const fail = (): never => {
    throw new Error("Invalid or unsupported item content");
  };
  if (!record(value) || value.version !== ITEM_VERSION) return fail();
  for (const key of ["bases", "affixes", "uniques", "tables"]) {
    const list = value[key];
    if (!Array.isArray(list) || list.length === 0 || list.length > 256)
      return fail();
    const seen = new Set<string>();
    for (const x of list as unknown[]) {
      if (!record(x) || !id(x.id) || seen.has(x.id)) return fail();
      seen.add(x.id);
    }
  }
  const d = value as unknown as ItemContent;
  for (const b of d.bases)
    if (
      !name(b.name) ||
      !CATEGORIES.includes(b.category) ||
      !num(b.level, 1, 99) ||
      !num(b.requirement, 0, 99) ||
      !num(b.weight, 1) ||
      !validItemStats(b.stats)
    )
      return fail();
  const groups = new Set(d.affixes.map((a) => a.group));
  for (const a of d.affixes)
    if (
      !name(a.name) ||
      !["prefix", "suffix"].includes(a.kind) ||
      !id(a.group) ||
      !Array.isArray(a.excludes) ||
      a.excludes.some((x) => !groups.has(x)) ||
      !Array.isArray(a.categories) ||
      !a.categories.length ||
      a.categories.some((c) => !CATEGORIES.includes(c)) ||
      !num(a.minLevel, 1, 99) ||
      !num(a.maxLevel, a.minLevel, 99) ||
      !num(a.weight, 1) ||
      !STATS.includes(a.stat) ||
      !num(a.min) ||
      !num(a.max, a.min)
    )
      return fail();
  for (const u of d.uniques)
    if (
      !name(u.name) ||
      !d.bases.some((b) => b.id === u.base) ||
      !num(u.level, 1, 99) ||
      !validItemStats(u.stats)
    )
      return fail();
  for (const t of d.tables) {
    if (
      !num(t.chance, 0, 10000) ||
      !num(t.levelModifier, -20, 20) ||
      !record(t.quality) ||
      Object.keys(t.quality).length !== 4 ||
      !QUALITIES.every((q) => num(t.quality[q])) ||
      !QUALITIES.some((q) => t.quality[q] > 0) ||
      !Array.isArray(t.bases) ||
      !t.bases.length ||
      t.bases.length > 256 ||
      new Set(t.bases.map((b) => b.id)).size !== t.bases.length ||
      t.bases.some(
        (b) => !d.bases.some((x) => x.id === b.id) || !num(b.weight, 1),
      )
    )
      return fail();
  }
  return structuredClone(d);
}
export const ITEM_CONTENT = validateItemContent({
  version: 2,
  bases: [
    {
      id: "ash-blade",
      name: "Ash Blade",
      category: "blade",
      level: 1,
      requirement: 1,
      weight: 30,
      stats: { damage: 6 },
    },
    {
      id: "reed-bow",
      name: "Reed Bow",
      category: "bow",
      level: 1,
      requirement: 1,
      weight: 20,
      stats: { damage: 5, accuracy: 4 },
    },
    {
      id: "cinder-staff",
      name: "Cinder Staff",
      category: "staff",
      level: 3,
      requirement: 2,
      weight: 15,
      stats: { damage: 4, mana: 8 },
    },
    {
      id: "woven-coat",
      name: "Woven Coat",
      category: "chest",
      level: 1,
      requirement: 1,
      weight: 30,
      stats: { armor: 8 },
    },
    {
      id: "iron-cap",
      name: "Iron Cap",
      category: "helm",
      level: 2,
      requirement: 1,
      weight: 20,
      stats: { armor: 4 },
    },
    {
      id: "bark-guard",
      name: "Bark Guard",
      category: "shield",
      level: 3,
      requirement: 2,
      weight: 15,
      stats: { armor: 6 },
    },
    {
      id: "trail-boots",
      name: "Trail Boots",
      category: "boots",
      level: 1,
      requirement: 1,
      weight: 20,
      stats: { armor: 2 },
    },
    {
      id: "copper-band",
      name: "Copper Band",
      category: "ring",
      level: 5,
      requirement: 4,
      weight: 8,
      stats: { mana: 3 },
    },
  ],
  affixes: [
    {
      id: "keen",
      name: "Keen",
      kind: "prefix",
      group: "edge",
      excludes: [],
      categories: ["blade", "bow", "staff"],
      minLevel: 1,
      maxLevel: 14,
      weight: 30,
      stat: "damage",
      min: 1,
      max: 4,
    },
    {
      id: "razored",
      name: "Razored",
      kind: "prefix",
      group: "edge",
      excludes: [],
      categories: ["blade", "bow", "staff"],
      minLevel: 15,
      maxLevel: 99,
      weight: 15,
      stat: "damage",
      min: 5,
      max: 9,
    },
    {
      id: "warded",
      name: "Warded",
      kind: "prefix",
      group: "ward",
      excludes: [],
      categories: ["chest", "helm", "shield", "boots", "ring"],
      minLevel: 1,
      maxLevel: 99,
      weight: 30,
      stat: "armor",
      min: 2,
      max: 7,
    },
    {
      id: "emberward",
      name: "Emberward",
      kind: "prefix",
      group: "fire-ward",
      excludes: ["cold-ward"],
      categories: ["chest", "helm", "shield", "boots", "ring"],
      minLevel: 4,
      maxLevel: 99,
      weight: 15,
      stat: "fireResistance",
      min: 3,
      max: 12,
    },
    {
      id: "rimeward",
      name: "Rimeward",
      kind: "prefix",
      group: "cold-ward",
      excludes: ["fire-ward"],
      categories: ["chest", "helm", "shield", "boots", "ring"],
      minLevel: 4,
      maxLevel: 99,
      weight: 15,
      stat: "coldResistance",
      min: 3,
      max: 12,
    },
    {
      id: "vigor",
      name: "of Vigor",
      kind: "suffix",
      group: "vigor",
      excludes: [],
      categories: [
        "blade",
        "bow",
        "staff",
        "chest",
        "helm",
        "shield",
        "boots",
        "ring",
      ],
      minLevel: 1,
      maxLevel: 99,
      weight: 30,
      stat: "life",
      min: 3,
      max: 12,
    },
    {
      id: "clarity",
      name: "of Clarity",
      kind: "suffix",
      group: "clarity",
      excludes: [],
      categories: [
        "blade",
        "bow",
        "staff",
        "chest",
        "helm",
        "shield",
        "boots",
        "ring",
      ],
      minLevel: 1,
      maxLevel: 99,
      weight: 25,
      stat: "mana",
      min: 2,
      max: 10,
    },
    {
      id: "haste",
      name: "of Haste",
      kind: "suffix",
      group: "haste",
      excludes: [],
      categories: ["blade", "bow", "staff", "boots", "ring"],
      minLevel: 8,
      maxLevel: 99,
      weight: 8,
      stat: "speed",
      min: 1,
      max: 4,
    },
  ],
  uniques: [
    {
      id: "last-coal",
      name: "Last Coal",
      base: "ash-blade",
      level: 8,
      stats: { damage: 10, fireResistance: 15 },
    },
    {
      id: "stillwater",
      name: "Stillwater",
      base: "copper-band",
      level: 12,
      stats: { mana: 24, coldResistance: 12 },
    },
  ],
  tables: [
    {
      id: "court",
      chance: 3500,
      levelModifier: 0,
      quality: { normal: 8000, magic: 1700, rare: 290, unique: 10 },
      bases: [
        { id: "ash-blade", weight: 30 },
        { id: "reed-bow", weight: 20 },
        { id: "cinder-staff", weight: 15 },
        { id: "woven-coat", weight: 30 },
        { id: "iron-cap", weight: 20 },
        { id: "bark-guard", weight: 15 },
        { id: "trail-boots", weight: 20 },
        { id: "copper-band", weight: 8 },
      ],
    },
  ],
});

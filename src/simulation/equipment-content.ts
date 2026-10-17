import { itemContentForVersion, type ItemContent } from "./item-content";
import type { GeneratedItem } from "./loot";
export const EQUIP_SLOTS = [
  "main",
  "off",
  "helmet",
  "chest",
  "gloves",
  "boots",
  "belt",
  "ring1",
  "ring2",
  "amulet",
] as const;
export type EquipSlot = (typeof EQUIP_SLOTS)[number];
export interface EquipmentDefinition {
  base: string;
  width: number;
  height: number;
  slots: EquipSlot[];
  hands: 0 | 1 | 2;
}
export function validateEquipmentContent(
  value: unknown,
  content: ItemContent,
): EquipmentDefinition[] {
  if (!Array.isArray(value) || value.length !== content.bases.length)
    throw Error("Incomplete equipment metadata");
  const ids = new Set<string>();
  for (const raw of value as unknown[]) {
    if (typeof raw !== "object" || raw === null)
      throw Error("Invalid equipment metadata");
    const v = raw as EquipmentDefinition;
    if (
      !content.bases.some((b) => b.id === v.base) ||
      ids.has(v.base) ||
      ![v.width, v.height].every(
        (n) => Number.isInteger(n) && n >= 1 && n <= 10,
      ) ||
      !Array.isArray(v.slots) ||
      !v.slots.length ||
      v.slots.some((s) => !EQUIP_SLOTS.includes(s)) ||
      new Set(v.slots).size !== v.slots.length ||
      ![0, 1, 2].includes(v.hands) ||
      (v.hands === 2 && (v.slots.length !== 1 || v.slots[0] !== "main"))
    )
      throw Error("Invalid equipment footprint or slot");
    ids.add(v.base);
  }
  return structuredClone(value) as EquipmentDefinition[];
}
const definitions: EquipmentDefinition[] = [
  { base: "ash-blade", width: 1, height: 3, slots: ["main"], hands: 1 },
  { base: "reed-bow", width: 2, height: 3, slots: ["main"], hands: 2 },
  { base: "cinder-staff", width: 1, height: 4, slots: ["main"], hands: 2 },
  { base: "woven-coat", width: 2, height: 3, slots: ["chest"], hands: 0 },
  { base: "iron-cap", width: 2, height: 2, slots: ["helmet"], hands: 0 },
  { base: "bark-guard", width: 2, height: 2, slots: ["off"], hands: 1 },
  { base: "trail-boots", width: 2, height: 2, slots: ["boots"], hands: 0 },
  {
    base: "copper-band",
    width: 1,
    height: 1,
    slots: ["ring1", "ring2"],
    hands: 0,
  },
  { base: "sootwrap-gloves", width: 2, height: 2, slots: ["gloves"], hands: 0 },
  { base: "hemp-sash", width: 2, height: 1, slots: ["belt"], hands: 0 },
  { base: "slate-pendant", width: 1, height: 1, slots: ["amulet"], hands: 0 },
];
const registries = new Map(
  [2, 3].map((version) => {
    const c = itemContentForVersion(version);
    return [
      version,
      validateEquipmentContent(
        definitions.filter((d) => c.bases.some((b) => b.id === d.base)),
        c,
      ),
    ] as const;
  }),
);
export function equipmentDefinition(
  item: Pick<GeneratedItem, "base" | "contentVersion">,
): EquipmentDefinition {
  const d = registries
    .get(item.contentVersion)
    ?.find((d) => d.base === item.base);
  if (!d) throw Error("Unsupported equipment definition");
  return d;
}

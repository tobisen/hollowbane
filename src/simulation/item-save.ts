import {
  ITEM_CONTENT,
  itemContentForVersion,
  type ItemContent,
} from "./item-content";
import { generateLoot, type GeneratedItem, type LootContext } from "./loot";
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
function canonical(v: unknown): string {
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  if (object(v))
    return (
      "{" +
      Object.keys(v)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + canonical(v[k]))
        .join(",") +
      "}"
    );
  return JSON.stringify(v);
}
/** Recompute every generated attribute; never trust saved stats or display text. */
export function validateGeneratedItem(
  value: unknown,
  content?: ItemContent,
): GeneratedItem {
  if (object(value) && !content && typeof value.contentVersion === "number")
    content = itemContentForVersion(value.contentVersion);
  if (
    !content ||
    !object(value) ||
    value.schema !== 1 ||
    value.contentVersion !== content.version ||
    typeof value.identified !== "boolean" ||
    !object(value.origin)
  )
    throw Error("Unsupported or malformed item");
  const expected = generateLoot(
    value.origin as unknown as LootContext,
    content,
  );
  if (!expected) throw Error("Item origin does not produce a drop");
  if (expected.identified && !value.identified)
    throw Error("Invalid identification state");
  expected.identified = value.identified;
  if (canonical(expected) !== canonical(value))
    throw Error("Item attributes do not match origin");
  return expected;
}
export function identifyItem(item: GeneratedItem): GeneratedItem {
  const valid = validateGeneratedItem(item);
  return { ...valid, identified: true };
}
export function inspectItem(item: GeneratedItem): {
  name: string;
  quality: GeneratedItem["quality"];
  level: number;
  requirement: number;
  stats: GeneratedItem["stats"] | null;
  identified: boolean;
} {
  const base = itemContentForVersion(item.contentVersion).bases.find(
    (b) => b.id === item.base,
  )!;
  return {
    name: item.identified ? item.name : `Unidentified ${base.name}`,
    quality: item.quality,
    level: item.level,
    requirement: item.identified ? item.requirement : base.requirement,
    stats: item.identified ? { ...item.stats } : null,
    identified: item.identified,
  };
}
/** L1 item archive, not an inventory/equipment model. Atomic bounded parsing. */
export function serializeItems(items: readonly GeneratedItem[]): string {
  if (items.length > 256) throw Error("Item archive capacity exceeded");
  const validated = items.map((i) => validateGeneratedItem(i));
  if (new Set(validated.map((i) => i.id)).size !== validated.length)
    throw Error("Duplicate item identity");
  return JSON.stringify({
    schema: 1,
    contentVersion: ITEM_CONTENT.version,
    items: validated,
  });
}
export function deserializeItems(text: string): GeneratedItem[] {
  if (text.length > 524288) throw Error("Item archive too large");
  const v: unknown = JSON.parse(text);
  if (
    !object(v) ||
    Object.keys(v).sort().join(",") !== "contentVersion,items,schema" ||
    v.schema !== 1 ||
    v.contentVersion !== ITEM_CONTENT.version ||
    !Array.isArray(v.items) ||
    v.items.length > 256
  )
    throw Error("Unsupported item archive");
  const items = v.items.map((i) => validateGeneratedItem(i));
  if (new Set(items.map((i) => i.id)).size !== items.length)
    throw Error("Duplicate item identity");
  return items;
}

import type { GeneratedItem } from "./loot";
/** Bounded one-level ownership tree; embedded components are owned but never independently movable. */
export function itemTree(items: readonly GeneratedItem[]): GeneratedItem[] {
  const result: GeneratedItem[] = [];
  for (const item of items) {
    result.push(item);
    if (item.embedded !== undefined) {
      if (!Array.isArray(item.embedded) || item.embedded.length > 6)
        throw Error("Invalid embedded ownership");
      for (const child of item.embedded) {
        if (!child || child.embedded !== undefined)
          throw Error("Nested item components are forbidden");
        result.push(child);
      }
    }
  }
  return result;
}
export function effectiveRequirement(item: GeneratedItem): number {
  return Math.max(
    item.requirement,
    ...(item.embedded ?? []).map((i) => i.requirement),
  );
}

import { describe, it, expect } from "vitest";
import { ITEM_CONTENT, validateItemContent } from "./item-content";
describe("versioned original item content", () => {
  it("validates all bases, categories and independent copies", () => {
    const d = validateItemContent(ITEM_CONTENT);
    expect(d.bases).toHaveLength(8);
    d.bases[0]!.stats.damage = 999;
    expect(ITEM_CONTENT.bases[0]!.stats.damage).toBe(6);
  });
  it("rejects unsupported, malformed, duplicate and dangling content", () => {
    for (const change of [
      (d: typeof ITEM_CONTENT) => {
        d.version = 2;
      },
      (d: typeof ITEM_CONTENT) => {
        d.bases.push(d.bases[0]!);
      },
      (d: typeof ITEM_CONTENT) => {
        d.affixes[0]!.max = NaN;
      },
      (d: typeof ITEM_CONTENT) => {
        d.tables[0]!.bases[0]!.id = "missing";
      },
      (d: typeof ITEM_CONTENT) => {
        d.affixes[0]!.excludes = ["missing"];
      },
    ]) {
      const d = structuredClone(ITEM_CONTENT);
      change(d);
      expect(() => validateItemContent(d)).toThrow();
    }
    expect(() => validateItemContent(null)).toThrow();
  });
});

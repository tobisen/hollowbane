import { it, expect } from "vitest";
import { RUNE_CONTENT, validateRuneCatalog } from "./rune-content";
it("defines twelve original weighted components and eight complete ordered combinations", () => {
  expect(validateRuneCatalog(RUNE_CONTENT)).toEqual(RUNE_CONTENT);
  expect(RUNE_CONTENT.components).toHaveLength(12);
  expect(RUNE_CONTENT.recipes).toHaveLength(8);
  expect(RUNE_CONTENT.components[0]!.weight).toBeGreaterThan(
    RUNE_CONTENT.components.at(-1)!.weight,
  );
  for (const r of RUNE_CONTENT.recipes)
    expect(r.modifiers.some((m) => m.kind === "stat" && m.value < 0)).toBe(
      true,
    );
});
it("rejects unknown sequences, impossible hosts, low-level requirements, ambiguous recipes and cycles", () => {
  for (const alter of [
    (c: typeof RUNE_CONTENT) => {
      c.recipes[0]!.sequence[0] = "missing";
    },
    (c: typeof RUNE_CONTENT) => {
      c.recipes[0]!.bases = ["copper-band"];
    },
    (c: typeof RUNE_CONTENT) => {
      c.recipes[0]!.level = 1;
    },
    (c: typeof RUNE_CONTENT) => {
      c.recipes.push({
        ...c.recipes[0]!,
        id: "duplicate-pattern",
        name: "Duplicate Pattern",
      });
    },
    (c: typeof RUNE_CONTENT) => {
      Object.assign(c.recipes[0]!.modifiers[0]!, {
        effect: { kind: "trigger", event: "hit" },
      });
    },
    (c: typeof RUNE_CONTENT) => {
      c.components[1]!.id = c.components[0]!.id;
    },
  ]) {
    const copy = structuredClone(RUNE_CONTENT);
    alter(copy);
    expect(() => validateRuneCatalog(copy)).toThrow();
  }
});

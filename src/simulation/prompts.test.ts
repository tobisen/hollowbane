import { it, expect } from "vitest";
import { contextPrompt, actionPrompt } from "./prompts";
import { defaultPadBindings } from "./gamepad-profile";
it("uses active profile and actual custom mappings for contextual prompts", () => {
  const b = defaultPadBindings();
  expect(contextPrompt("menu", "playstation", b)).toContain("Cross: Choose");
  expect(contextPrompt("combat", "xbox", b)).toContain("X: Primary");
  expect(contextPrompt("movement", "generic", b)).not.toContain("Primary");
  b.primary = [0];
  expect(contextPrompt("combat", "xbox", b)).toContain("A: Primary");
  expect(actionPrompt("pickup", "generic", b)).toBe("Unbound");
});

import { describe, it, expect } from "vitest";
import {
  standardProfile,
  defaultPadBindings,
  padActions,
  validatePadBindings,
  buttonGlyph,
} from "./gamepad-profile";
import type { PadSnapshot } from "./devices";
const pad: PadSnapshot = {
  index: 0,
  id: "Xbox",
  mapping: "standard",
  connected: true,
  axes: [0, 0, 0, 0],
  buttons: [0, 0, 1],
};
describe("controller profiles", () => {
  it("maps Xbox, PlayStation and generic standard buttons to identical actions", () => {
    for (const id of ["Xbox", "DualSense 054c", "USB pad"]) {
      const p = standardProfile({ ...pad, id })!;
      expect(padActions(pad, p.bindings)).toEqual(new Set(["primary"]));
    }
    expect(standardProfile({ ...pad, id: "DualSense" })!.family).toBe(
      "playstation",
    );
  });
  it("requires explicit override/custom profile for unknown nonstandard layouts", () => {
    const unknown = { ...pad, mapping: "" };
    expect(standardProfile(unknown)).toBeNull();
    expect(standardProfile(unknown, "generic")).not.toBeNull();
    const custom = {
      ...standardProfile(pad)!,
      id: "vendor",
      axes: [1, 0, 3, 2] as const,
      matches: () => true,
    };
    expect(standardProfile(unknown, "auto", [custom])!.axes).toEqual([
      1, 0, 3, 2,
    ]);
  });
  it("rejects conflicting/out-of-range mappings and supports unbound reservations", () => {
    const b = defaultPadBindings();
    expect(validatePadBindings(b).pickup).toEqual([]);
    b.primary = [0];
    expect(() => validatePadBindings(b)).toThrow(/conflict/);
    b.primary = [32];
    expect(() => validatePadBindings(b)).toThrow();
  });
  it("provides original text glyphs with generic fallbacks", () => {
    expect(buttonGlyph(0, "playstation")).toBe("Cross");
    expect(buttonGlyph(5, "xbox")).toBe("RB");
    expect(buttonGlyph(22, "generic")).toBe("Button 23");
  });
});

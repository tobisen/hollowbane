import { ACTIONS, type Action } from "./actions";
import type { PadSnapshot } from "./devices";
export type PadBindings = Record<Action, number[]>;
export type GlyphFamily = "xbox" | "playstation" | "generic";
export interface PadProfile {
  id: string;
  family: GlyphFamily;
  axes: readonly [number, number, number, number];
  bindings: PadBindings;
  matches: (pad: PadSnapshot) => boolean;
}
export function defaultPadBindings(): PadBindings {
  return {
    interact: [0],
    cancel: [1],
    primary: [2],
    secondary: [3],
    skill1: [5],
    skill2: [7],
    skill3: [4],
    skill4: [6],
    up: [12],
    down: [13],
    left: [14],
    right: [15],
    pause: [9],
    map: [8],
    toggleRun: [10],
    targetLock: [11],
    pickup: [],
    menu: [],
  };
}
export function validatePadBindings(bindings: PadBindings): PadBindings {
  const used = new Set<number>(),
    result = {} as PadBindings;
  for (const a of ACTIONS) {
    if (!Array.isArray(bindings[a]) || bindings[a].length > 2)
      throw new Error(`Invalid binding ${a}`);
    for (const b of bindings[a]) {
      if (!Number.isInteger(b) || b < 0 || b > 31 || used.has(b))
        throw new Error(`Button conflict: ${b}`);
      used.add(b);
    }
    result[a] = [...bindings[a]];
  }
  return result;
}
export function standardProfile(
  pad: PadSnapshot,
  override: "auto" | GlyphFamily = "auto",
  extensions: readonly PadProfile[] = [],
): PadProfile | null {
  const custom = extensions.find((p) => p.matches(pad));
  if (custom) return custom;
  if (pad.mapping !== "standard" && override === "auto") return null;
  const family =
    override !== "auto"
      ? override
      : /playstation|dualsense|dualshock|054c|wireless controller/i.test(pad.id)
        ? "playstation"
        : /xbox|xinput|045e/i.test(pad.id)
          ? "xbox"
          : "generic";
  return {
    id: `standard-${family}`,
    family,
    axes: [0, 1, 2, 3],
    bindings: defaultPadBindings(),
    matches: (p) => p.mapping === "standard",
  };
}
export function padActions(
  pad: PadSnapshot,
  bindings: PadBindings,
): Set<Action> {
  return new Set(
    ACTIONS.filter((a) =>
      bindings[a].some((index) => (pad.buttons[index] ?? 0) >= 0.5),
    ),
  );
}
const XBOX = [
  "A",
  "B",
  "X",
  "Y",
  "LB",
  "RB",
  "LT",
  "RT",
  "View",
  "Menu",
  "L3",
  "R3",
  "D↑",
  "D↓",
  "D←",
  "D→",
  "Home",
];
const PS = [
  "Cross",
  "Circle",
  "Square",
  "Triangle",
  "L1",
  "R1",
  "L2",
  "R2",
  "Create",
  "Options",
  "L3",
  "R3",
  "D↑",
  "D↓",
  "D←",
  "D→",
  "PS",
];
export function buttonGlyph(index: number, family: GlyphFamily): string {
  return (
    (family === "xbox" ? XBOX : family === "playstation" ? PS : [])[index] ??
    `Button ${index + 1}`
  );
}

/** Vendor profiles normalize physical controls into the standard logical layout.
 * Persistent user remaps then apply to that same logical layout. */
export function normalizeVendorPad(
  pad: PadSnapshot,
  profile: PadProfile,
): PadSnapshot {
  const buttons = [...pad.buttons],
    axes = [...pad.axes],
    defaults = defaultPadBindings();
  for (const a of ACTIONS) {
    const logical = defaults[a][0];
    if (logical !== undefined)
      buttons[logical] = Math.max(
        0,
        ...profile.bindings[a].map((i) => pad.buttons[i] ?? 0),
      );
  }
  profile.axes.forEach((physical, logical) => {
    axes[logical] = pad.axes[physical] ?? 0;
  });
  return { ...pad, buttons, axes };
}

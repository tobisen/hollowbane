import {
  buttonGlyph,
  type GlyphFamily,
  type PadBindings,
} from "./gamepad-profile";
import type { Action } from "./actions";
export function actionPrompt(
  action: Action,
  family: GlyphFamily,
  bindings: PadBindings,
): string {
  const b = bindings[action][0];
  return b === undefined ? "Unbound" : buttonGlyph(b, family);
}
export function contextPrompt(
  context: "movement" | "combat" | "menu",
  family: GlyphFamily,
  bindings: PadBindings,
): string {
  const key = (a: Action) => actionPrompt(a, family, bindings);
  if (context === "menu")
    return `${key("interact")}: Choose · ${key("cancel")}: Back · D-pad / LS: Navigate`;
  return `LS: Move · RS: Face · ${key("toggleRun")}: Walk/run · ${context === "combat" ? `${key("primary")}: Primary · ` : ""}${key("pause")}: Menu`;
}

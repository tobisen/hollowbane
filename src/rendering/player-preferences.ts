import { ACTION_KEYS } from "../simulation/actions";
import {
  defaultPreferences,
  validateBindings,
  type Bindings,
} from "../simulation/input";

export const PRESENTATION_STORAGE = "hollowbane.presentation.v1";
export interface PresentationSettings {
  version: 1;
  quality: "auto" | "balanced" | "full";
  volume: number;
  muted: boolean;
}
export function readPresentation(text: string | null): PresentationSettings {
  const fallback: PresentationSettings = {
    version: 1,
    quality: "auto",
    volume: 1,
    muted: false,
  };
  try {
    const p = JSON.parse(
      text ?? "null",
    ) as Partial<PresentationSettings> | null;
    if (
      p?.version !== 1 ||
      !["auto", "balanced", "full"].includes(p.quality ?? "") ||
      typeof p.volume !== "number" ||
      !Number.isFinite(p.volume) ||
      p.volume < 0 ||
      p.volume > 1 ||
      typeof p.muted !== "boolean"
    )
      return fallback;
    return {
      version: 1,
      quality: p.quality!,
      volume: p.volume,
      muted: p.muted,
    };
  } catch {
    return fallback;
  }
}
let session: PresentationSettings | null = null;
export function loadPresentation(): PresentationSettings {
  if (session) return { ...session };
  try {
    return readPresentation(localStorage.getItem(PRESENTATION_STORAGE));
  } catch {
    return readPresentation(null);
  }
}
/** Browser preferences remain separate from every character snapshot. */
export function savePresentation(value: PresentationSettings): boolean {
  const checked = readPresentation(JSON.stringify(value));
  if (
    checked.version !== value.version ||
    checked.quality !== value.quality ||
    checked.volume !== value.volume ||
    checked.muted !== value.muted
  )
    throw Error("Invalid presentation settings");
  session = { ...checked };
  let stored = true;
  try {
    localStorage.setItem(PRESENTATION_STORAGE, JSON.stringify(checked));
  } catch {
    stored = false;
  }
  window.dispatchEvent(new Event("hollowbane-presentation-change"));
  return stored;
}
export const MOVEMENT_LABELS = [
  ["north", "Move up", "ArrowUp"],
  ["south", "Move down", "ArrowDown"],
  ["west", "Move left", "ArrowLeft"],
  ["east", "Move right", "ArrowRight"],
  ["toggleRun", "Toggle run", null],
  ["stop", "Stop", null],
] as const;
/** Reuse the existing schema while reserving menu, skill and world shortcuts. */
export function validatePlayerBindings(bindings: Bindings): Bindings {
  const checked = validateBindings(bindings);
  for (const [action, , arrow] of MOVEMENT_LABELS)
    for (const code of checked[action]) {
      const semantic = ACTION_KEYS[code];
      if (
        (semantic &&
          code !== arrow &&
          !(action === "toggleRun" && code === "KeyR")) ||
        ["KeyE", "KeyJ", "KeyN"].includes(code) ||
        (code === "Space" && action !== "stop")
      )
        throw Error(`Reserved gameplay key: ${code}`);
    }
  return checked;
}
export function safePlayerBindings(bindings: Bindings): Bindings {
  try {
    return validatePlayerBindings(bindings);
  } catch {
    return defaultPreferences().bindings;
  }
}

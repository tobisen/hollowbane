import { DEFAULT_STICK, validateStick, type StickSettings } from "./analog";
import {
  defaultPadBindings,
  validatePadBindings,
  type PadBindings,
  type GlyphFamily,
} from "./gamepad-profile";
export interface ControllerSettings {
  version: 1;
  selected: number | null;
  deviceId: string | null;
  profile: "auto" | GlyphFamily;
  bindings: PadBindings;
  move: StickSettings;
  aim: StickSettings;
  centers: number[];
  axes: [number, number, number, number];
  vibration: boolean;
}
export const CONTROLLER_STORAGE = "hollowbane.controller.v1";
export function defaultControllerSettings(): ControllerSettings {
  return {
    version: 1,
    selected: null,
    deviceId: null,
    profile: "auto",
    bindings: defaultPadBindings(),
    move: { ...DEFAULT_STICK },
    aim: { ...DEFAULT_STICK },
    centers: [0, 0, 0, 0],
    axes: [0, 1, 2, 3],
    vibration: false,
  };
}
export function validateControllerSettings(
  s: ControllerSettings,
): ControllerSettings {
  if (
    s.version !== 1 ||
    !(
      s.selected === null ||
      (Number.isInteger(s.selected) && s.selected >= 0 && s.selected <= 15)
    ) ||
    (s.deviceId !== undefined &&
      s.deviceId !== null &&
      (typeof s.deviceId !== "string" ||
        s.deviceId.length === 0 ||
        s.deviceId.length > 1024)) ||
    !["auto", "xbox", "playstation", "generic"].includes(s.profile) ||
    typeof s.vibration !== "boolean" ||
    !Array.isArray(s.centers) ||
    s.centers.length !== 4 ||
    !s.centers.every((v) => Number.isFinite(v) && Math.abs(v) <= 0.25) ||
    !Array.isArray(s.axes) ||
    s.axes.length !== 4 ||
    !s.axes.every((v) => Number.isInteger(v) && v >= 0 && v <= 15) ||
    new Set(s.axes).size !== 4
  )
    throw new Error("Invalid controller settings");
  const bindings = validatePadBindings(s.bindings);
  for (const action of ["interact", "cancel", "pause"] as const)
    if (!bindings[action].length)
      throw new Error(`Keep ${action} assigned for menu access`);
  return {
    version: 1,
    selected: s.selected,
    deviceId: s.selected === null ? null : (s.deviceId ?? null),
    profile: s.profile,
    vibration: s.vibration,
    bindings,
    move: validateStick(s.move),
    aim: validateStick(s.aim),
    centers: [...s.centers],
    axes: [...s.axes],
  };
}
export function readControllerSettings(
  text: string | null,
): ControllerSettings {
  try {
    return validateControllerSettings(
      JSON.parse(text ?? "null") as ControllerSettings,
    );
  } catch {
    return defaultControllerSettings();
  }
}

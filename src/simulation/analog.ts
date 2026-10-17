import type { Point } from "../world/isometric";
export interface StickSettings {
  deadzone: number;
  outer: number;
  sensitivity: number;
  curve: number;
}
export const DEFAULT_STICK: Readonly<StickSettings> = {
  deadzone: 0.18,
  outer: 1,
  sensitivity: 1,
  curve: 1.4,
};
export function validateStick(s: StickSettings): StickSettings {
  if (
    !Object.values(s).every(Number.isFinite) ||
    s.deadzone < 0.05 ||
    s.deadzone > 0.5 ||
    s.outer < 0.6 ||
    s.outer > 1 ||
    s.outer <= s.deadzone ||
    s.sensitivity < 0.25 ||
    s.sensitivity > 2 ||
    s.curve < 0.5 ||
    s.curve > 3
  )
    throw new Error("Invalid stick settings");
  return { ...s };
}
export function processStick(
  x: number,
  y: number,
  s: StickSettings = DEFAULT_STICK,
): Point {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { x: 0, y: 0 };
  const length = Math.hypot(x, y);
  if (length <= s.deadzone) return { x: 0, y: 0 };
  const amount = Math.min(
    1,
    Math.pow(
      Math.min(1, (length - s.deadzone) / (s.outer - s.deadzone)),
      s.curve,
    ) * s.sensitivity,
  );
  return { x: (x / length) * amount, y: (y / length) * amount };
}

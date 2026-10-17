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

/** Stable center capture; never interpret a held stick as its new neutral. */
export function calibrateCenters(
  samples: readonly (readonly number[])[],
): number[] {
  if (
    samples.length < 20 ||
    samples.some(
      (s) =>
        s.length !== 4 ||
        s.some((v) => !Number.isFinite(v) || Math.abs(v) > 0.25),
    )
  )
    throw new Error("Release both sticks before calibration");
  const centers = [0, 1, 2, 3].map(
    (axis) => samples.reduce((sum, s) => sum + s[axis]!, 0) / samples.length,
  );
  if (samples.some((s) => s.some((v, i) => Math.abs(v - centers[i]!) > 0.04)))
    throw new Error("Keep sticks still during calibration");
  return centers;
}

import type { Point } from "../world/isometric";
import { movementConfig, type Gait, type MovementConfig } from "./locomotion";
export const INPUT_ACTIONS = [
  "north",
  "south",
  "west",
  "east",
  "toggleRun",
  "stop",
  "queue",
  "ability1",
  "ability2",
] as const;
export type InputAction = (typeof INPUT_ACTIONS)[number];
export type Bindings = Record<InputAction, string[]>;
export interface MovementPreferences {
  version: 1;
  gait: Gait;
  config: MovementConfig;
  bindings: Bindings;
}
export function defaultPreferences(): MovementPreferences {
  return {
    version: 1,
    gait: "walk",
    config: movementConfig(),
    bindings: {
      north: ["KeyW", "ArrowUp"],
      south: ["KeyS", "ArrowDown"],
      west: ["KeyA", "ArrowLeft"],
      east: ["KeyD", "ArrowRight"],
      toggleRun: ["KeyR"],
      stop: ["Space"],
      queue: ["ShiftLeft", "ShiftRight"],
      ability1: ["Digit1"],
      ability2: ["Digit2"],
    },
  };
}
export function validateBindings(bindings: Bindings): Bindings {
  const used = new Set<string>(),
    result = {} as Bindings;
  for (const action of INPUT_ACTIONS) {
    const codes = bindings[action];
    if (!Array.isArray(codes) || codes.length < 1 || codes.length > 2)
      throw new RangeError(`Invalid binding: ${action}`);
    for (const code of codes) {
      if (
        !/^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Escape|Shift(Left|Right))$/.test(
          code,
        ) ||
        used.has(code)
      )
        throw new RangeError(`Duplicate or invalid key: ${code}`);
      used.add(code);
    }
    result[action] = [...codes];
  }
  return result;
}
export function actionHeld(
  held: ReadonlySet<string>,
  bindings: Bindings,
  action: InputAction,
): boolean {
  return bindings[action].some((code) => held.has(code));
}
export function movementVector(
  held: ReadonlySet<string>,
  bindings: Bindings,
): Point {
  const down = (action: InputAction) =>
    Number(actionHeld(held, bindings, action));
  return { x: down("east") - down("west"), y: down("south") - down("north") };
}
/** Decode untrusted storage atomically. Commands/held inputs are never persisted. */
export function readPreferences(text: string | null): MovementPreferences {
  try {
    const raw: unknown = JSON.parse(text ?? "null");
    if (!raw || typeof raw !== "object") throw new Error("Missing preferences");
    const p = raw as Record<string, unknown>;
    if (
      p.version !== 1 ||
      (p.gait !== "walk" && p.gait !== "run") ||
      !p.config ||
      typeof p.config !== "object" ||
      !p.bindings ||
      typeof p.bindings !== "object"
    )
      throw new Error("Invalid preferences");
    const defaults = defaultPreferences(),
      values = p.config as Record<string, unknown>;
    for (const key of Object.keys(
      defaults.config,
    ) as (keyof MovementConfig)[]) {
      if (typeof values[key] !== "number") throw new Error("Invalid tuning");
      defaults.config[key] = values[key];
    }
    return {
      version: 1,
      gait: p.gait,
      config: movementConfig(defaults.config),
      bindings: validateBindings(p.bindings as Bindings),
    };
  } catch {
    return defaultPreferences();
  }
}

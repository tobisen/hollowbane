import type { Point } from "../world/isometric";
export const ACTIONS = [
  "interact",
  "cancel",
  "primary",
  "secondary",
  "skill1",
  "skill2",
  "skill3",
  "skill4",
  "up",
  "down",
  "left",
  "right",
  "pause",
  "map",
  "toggleRun",
  "targetLock",
  "pickup",
  "menu",
] as const;
export type Action = (typeof ACTIONS)[number];
export type Device = "keyboard" | "mouse" | "gamepad";
export interface ActionState {
  held: boolean;
  pressed: boolean;
  released: boolean;
}
export interface ActionFrame {
  device: Device;
  move: Point;
  aim: Point;
  actions: Record<Action, ActionState>;
}
export function actionFrame(
  device: Device,
  held: ReadonlySet<Action>,
  previous: ReadonlySet<Action>,
  move: Point = { x: 0, y: 0 },
  aim: Point = { x: 0, y: 0 },
): ActionFrame {
  return {
    device,
    move: { ...move },
    aim: { ...aim },
    actions: Object.fromEntries(
      ACTIONS.map((a) => [
        a,
        {
          held: held.has(a),
          pressed: held.has(a) && !previous.has(a),
          released: !held.has(a) && previous.has(a),
        },
      ]),
    ) as Record<Action, ActionState>,
  };
}
/** Physical keyboard defaults translate into the same semantic actions as pads. */
export const ACTION_KEYS: Partial<Record<string, Action>> = {
  Enter: "interact",
  Escape: "cancel",
  KeyX: "primary",
  KeyQ: "secondary",
  Digit1: "skill1",
  Digit2: "skill2",
  Digit3: "skill3",
  Digit4: "skill4",
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  KeyP: "pause",
  Tab: "map",
  KeyR: "toggleRun",
  KeyT: "targetLock",
  KeyF: "pickup",
  KeyM: "menu",
};
export function keyActions(keys: ReadonlySet<string>): Set<Action> {
  return new Set(
    [...keys].flatMap((k) => (ACTION_KEYS[k] ? [ACTION_KEYS[k]!] : [])),
  );
}

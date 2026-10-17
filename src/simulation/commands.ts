import type { Point } from "../world/isometric";
import { worldToScreen } from "../world/isometric";
import { findPath, type Navigation } from "../world/navigation";
import {
  directionFor,
  retarget,
  stopWalker,
  type Gait,
  type Walker,
} from "./locomotion";
export type MovementCommand =
  | { type: "move"; target: Point; queue?: boolean }
  | { type: "stop" }
  | { type: "face"; target: Point }
  | { type: "gait"; gait: Gait };
export interface CommandResult {
  walker: Walker;
  feedback:
    | "moving"
    | "queued"
    | "blocked"
    | "queue-full"
    | "stopped"
    | "facing"
    | "gait";
}
export const MAX_QUEUED_MOVES = 8;
/** Commands are consumed in event order; ordinary movement is latest-wins, never buffered. */
export function commandMovement(
  walker: Walker,
  nav: Navigation,
  command: MovementCommand,
): CommandResult {
  if (command.type === "stop")
    return { walker: stopWalker(walker), feedback: "stopped" };
  if (command.type === "gait")
    return { walker: { ...walker, gait: command.gait }, feedback: "gait" };
  const target = command.target;
  if (!Number.isFinite(target.x) || !Number.isFinite(target.y))
    return { walker, feedback: "blocked" };
  if (command.type === "face") {
    const vector = {
      x: target.x - walker.position.x,
      y: target.y - walker.position.y,
    };
    return {
      walker: {
        ...stopWalker(walker),
        direction:
          Math.hypot(vector.x, vector.y) > 1e-9
            ? directionFor(worldToScreen(vector))
            : walker.direction,
      },
      feedback: "facing",
    };
  }
  if (command.queue && walker.route.length) {
    if (walker.queuedTargets.length >= MAX_QUEUED_MOVES)
      return { walker, feedback: "queue-full" };
    const previous = walker.queuedTargets.at(-1) ?? walker.route.at(-1)!;
    if (!findPath(nav, previous, target).length)
      return { walker, feedback: "blocked" };
    return {
      walker: {
        ...walker,
        queuedTargets: [...walker.queuedTargets, { ...target }],
      },
      feedback: "queued",
    };
  }
  const next = retarget(walker, nav, target);
  return {
    walker: next,
    feedback:
      next === walker ? "blocked" : next.route.length ? "moving" : "stopped",
  };
}

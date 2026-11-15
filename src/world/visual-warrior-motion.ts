import { movementConfig } from "../simulation/locomotion";
import { worldToScreen, type Point } from "./isometric";

export const VISUAL_WALK_STRIDE = 1.0417198071343716;
export const VISUAL_WALK_CYCLES = 1.2;
/** Prototype-only calibration from source1.65m cycle, body~95px and measured
 * baseline2.88cycles/s. Production MOVEMENT and character stats stay untouched.
 */
export const visualMovement = movementConfig({
  walkSpeed: VISUAL_WALK_STRIDE * VISUAL_WALK_CYCLES,
});

/** The existing sprite diagonals face atan(.5), not45 screen degrees.
 * Existing movement/pathfinding/collision still consume this input intent.
 */
export function visualSteering(input: Point): Point {
  return { x: input.x, y: input.y * (input.x && input.y ? 0.5 : 1) };
}

/** Choose the closest actual source view, including arbitrary clicked paths
 * and collision deflection. Uniform45° screen sectors do not match this atlas.
 */
export function visualFacingIndex(velocity: Point, previous: number): number {
  const p = worldToScreen(velocity);
  if (Math.hypot(p.x, p.y) < 1e-9) return previous;
  const headings = [
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
    [1, 0],
  ];
  let best = previous,
    score = -Infinity;
  for (const [index, [x, y]] of headings.entries()) {
    const h = worldToScreen({ x: x!, y: y! });
    const dot = (p.x * h.x + p.y * h.y) / Math.hypot(h.x, h.y);
    if (dot > score) {
      score = dot;
      best = index;
    }
  }
  return best;
}

export const VISUAL_TRANSITION_SECONDS = 0.1;

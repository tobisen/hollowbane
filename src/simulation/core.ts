/** Rendering-independent fixed-tick primitives. Never use wall time or Math.random here. */
export const TICK_MS = 1000 / 60;
export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
export interface Intent {
  tick: number;
  kind: "wait";
}
export interface Simulation {
  tick: number;
  seed: number;
  trace: Intent[];
}
export function step(state: Simulation, intent: Intent): Simulation {
  if (intent.tick !== state.tick || intent.kind !== "wait")
    throw new Error("Invalid tick intent");
  return {
    ...state,
    tick: state.tick + 1,
    trace: [...state.trace, { ...intent }],
  };
}
export function project(x: number, y: number): { x: number; y: number } {
  return { x: (x - y) * 32, y: (x + y) * 16 };
}
export function unproject(x: number, y: number): { x: number; y: number } {
  return { x: x / 64 + y / 32, y: y / 32 - x / 64 };
}

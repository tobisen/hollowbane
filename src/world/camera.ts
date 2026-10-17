import type { Point } from "./isometric";
export const MIN_ZOOM = 0.8;
export const MAX_ZOOM = 1.6;
export function minimumZoom(viewport?: Point): number {
  return viewport
    ? Math.max(MIN_ZOOM, viewport.x / 1536, viewport.y / 1024)
    : MIN_ZOOM;
}
export function clampZoom(value: number, viewport?: Point): number {
  const minimum = minimumZoom(viewport);
  return Math.max(minimum, Math.min(Math.max(MAX_ZOOM, minimum), value));
}
export function followAlpha(deltaMs: number): number {
  return 1 - Math.exp(-Math.min(100, Math.max(0, deltaMs)) / 180);
}

/** Follow an unclamped logical center; snap the subpixel tail without overshooting. */
export function followPosition(
  current: Point,
  target: Point,
  deltaMs: number,
): Point {
  const alpha = followAlpha(deltaMs);
  const next = {
    x: current.x + (target.x - current.x) * alpha,
    y: current.y + (target.y - current.y) * alpha,
  };
  return Math.hypot(next.x - target.x, next.y - target.y) < 0.02
    ? { ...target }
    : next;
}

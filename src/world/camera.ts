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

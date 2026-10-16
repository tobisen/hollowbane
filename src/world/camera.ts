export const MIN_ZOOM = 0.8;
export const MAX_ZOOM = 1.6;
export function clampZoom(value: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
}
export function followAlpha(deltaMs: number): number {
  return 1 - Math.exp(-Math.min(100, Math.max(0, deltaMs)) / 180);
}

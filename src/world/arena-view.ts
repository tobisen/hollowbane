import type { Point } from "./isometric";
/** Presentation-only camera framing, preserving a full-canvas inverse projection. */
export function arenaView(
  viewport: Point,
  hudTop: number | null,
): { scale: number; center: Point; playBottom: number } {
  if (
    ![viewport.x, viewport.y].every((v) => Number.isFinite(v) && v > 0) ||
    (hudTop !== null && !Number.isFinite(hudTop))
  )
    throw Error("Invalid arena viewport");
  const playBottom =
    hudTop === null
      ? viewport.y
      : Math.max(120, Math.min(viewport.y, hudTop - 16));
  const scale = Math.min(viewport.x / 1280, playBottom / 800);
  return {
    scale,
    center: { x: 768, y: 512 + (viewport.y - playBottom) / (2 * scale) },
    playBottom,
  };
}

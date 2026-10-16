export interface Point {
  x: number;
  y: number;
}
export const TILE_WIDTH = 128;
export const TILE_HEIGHT = 64;
export function worldToScreen(point: Point): Point {
  return {
    x: ((point.x - point.y) * TILE_WIDTH) / 2,
    y: ((point.x + point.y) * TILE_HEIGHT) / 2,
  };
}
export function screenToWorld(point: Point): Point {
  return {
    x: point.x / TILE_WIDTH + point.y / TILE_HEIGHT,
    y: point.y / TILE_HEIGHT - point.x / TILE_WIDTH,
  };
}
export function tileAt(point: Point): Point {
  const p = screenToWorld(point);
  return { x: Math.floor(p.x), y: Math.floor(p.y) };
}

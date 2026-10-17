import type { Point } from "./isometric";
export interface ViewRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
/** CSS pointer coordinates and the displayed camera view; render-buffer size cancels out. */
export function clientToGround(
  client: Point,
  canvas: ViewRect,
  view: ViewRect,
): Point {
  return {
    x: view.x + ((client.x - canvas.x) / canvas.width) * view.width,
    y: view.y + ((client.y - canvas.y) / canvas.height) * view.height,
  };
}
export function groundToClient(
  ground: Point,
  canvas: ViewRect,
  view: ViewRect,
): Point {
  return {
    x: canvas.x + ((ground.x - view.x) / view.width) * canvas.width,
    y: canvas.y + ((ground.y - view.y) / view.height) * canvas.height,
  };
}

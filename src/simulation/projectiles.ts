import type { Point } from "../world/isometric";
export interface Projectile {
  id: number;
  source: number;
  position: Point;
  velocity: Point;
  remaining: number;
}
export function launchProjectile(
  id: number,
  source: number,
  start: Point,
  target: Point,
  speed = 10,
): Projectile {
  const distance = Math.hypot(target.x - start.x, target.y - start.y);
  if (!Number.isFinite(speed) || speed <= 0 || distance < 1e-9)
    throw new Error("Invalid projectile trajectory");
  return {
    id,
    source,
    position: { ...start },
    velocity: {
      x: (((target.x - start.x) / distance) * speed) / 60,
      y: (((target.y - start.y) / distance) * speed) / 60,
    },
    remaining: 180,
  };
}
/** Earliest segment-circle impact, including a projectile starting inside a body. */
export function projectileContact(
  start: Point,
  end: Point,
  center: Point,
  radius = 0.25,
): number | null {
  const dx = end.x - start.x,
    dy = end.y - start.y,
    ox = start.x - center.x,
    oy = start.y - center.y;
  const a = dx * dx + dy * dy,
    c = ox * ox + oy * oy - radius * radius;
  if (c <= 0) return 0;
  if (a === 0) return null;
  const b = 2 * (ox * dx + oy * dy),
    discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  const t = (-b - Math.sqrt(discriminant)) / (2 * a);
  return t >= 0 && t <= 1 ? t : null;
}

/** Feet determine order; stable ID breaks ties. Elevation belongs in footY. */
export function footDepth(footY: number, stableId: number): number {
  if (
    !Number.isFinite(footY) ||
    !Number.isInteger(stableId) ||
    stableId < 0 ||
    stableId >= 10000
  )
    throw new Error("Invalid depth anchor");
  return footY + stableId / 1000000;
}
export function isOccluding(
  actor: { x: number; y: number },
  prop: { x: number; y: number; width: number; height: number },
): boolean {
  return (
    actor.y < prop.y &&
    actor.y > prop.y - prop.height &&
    Math.abs(actor.x - prop.x) < prop.width / 2
  );
}

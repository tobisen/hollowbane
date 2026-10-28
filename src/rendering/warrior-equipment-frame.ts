import {
  WARRIOR_DIRECTIONS,
  type WarriorPose,
  type WarriorSet,
} from "./warrior-pose";

const clips: Record<
  WarriorSet,
  readonly { name: string; start: number; count: number }[]
> = {
  movement: [
    { name: "idle", start: 0, count: 8 },
    { name: "walk", start: 8, count: 16 },
    { name: "run", start: 24, count: 16 },
  ],
  attacks: [
    { name: "primary", start: 0, count: 12 },
    { name: "secondary", start: 12, count: 12 },
  ],
  abilities: [
    { name: "iron-fan", start: 0, count: 12 },
    { name: "oath-echo", start: 12, count: 12 },
  ],
  hit: [{ name: "hit", start: 0, count: 6 }],
  death: [{ name: "death", start: 0, count: 16 }],
};

/** Shared atlas identity only; the existing pose selector owns all timing. */
export function warriorEquipmentFrame(
  pose: WarriorPose,
  direction: string,
): string | null {
  if (
    !Number.isInteger(pose.frame) ||
    !WARRIOR_DIRECTIONS.some((d) => d === direction)
  )
    return null;
  const clip = clips[pose.set].find(
    (c) => pose.frame >= c.start && pose.frame < c.start + c.count,
  );
  if (!clip || clip.name !== pose.clip) return null;
  return `${clip.name}-${direction}-${String(pose.frame - clip.start).padStart(2, "0")}`;
}

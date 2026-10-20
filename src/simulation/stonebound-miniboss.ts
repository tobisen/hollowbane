import type { BossDefinition } from "./boss";
import type { AreaLayout } from "./area-anchors";
import type { WorldMonsterSpawn } from "./world-encounters";

export const CAIRNWARDEN_XP = 160;
/** Upgrade one existing Stonebound identity; old defeated identities stay defeated. */
export function cairnwardenSpawn(
  layout: AreaLayout,
  plan: readonly WorldMonsterSpawn[],
): WorldMonsterSpawn | undefined {
  if (layout.map.area !== "forgotten-graveyard") return;
  return [...plan].reverse().find((spawn) => spawn.role === "tank");
}

export const CAIRNWARDEN: BossDefinition = {
  id: "cairnwarden-rhusk",
  name: "Cairnwarden Rhusk",
  health: 360,
  defense: { defense: 8, armor: 20, physicalResistance: 0.1 },
  attacks: [
    {
      id: "cairn-cleave",
      name: "Cairn cleave · step behind",
      timing: { windup: 60, active: 3, recovery: 66 },
      shape: { kind: "cone", radius: 1.8, halfAngle: Math.PI / 3 },
      damage: 18,
      element: "physical",
      weight: 2,
    },
    {
      id: "oath-fault",
      name: "Oath fault · step sideways",
      timing: { windup: 66, active: 3, recovery: 72 },
      shape: { kind: "line", length: 3.5, width: 0.8 },
      damage: 24,
      element: "physical",
      weight: 1,
    },
    {
      id: "broken-binding",
      name: "Broken binding · retreat beyond the ring",
      timing: { windup: 96, active: 3, recovery: 84 },
      shape: { kind: "circle", radius: 2 },
      damage: 30,
      element: "physical",
      weight: 2,
    },
  ],
  phases: [
    {
      name: "Keeper of the cairn",
      healthAtMost: 1,
      attacks: ["cairn-cleave", "oath-fault"],
      transitionFrames: 90,
    },
    {
      name: "The binding breaks",
      healthAtMost: 0.5,
      attacks: ["oath-fault", "broken-binding"],
      transitionFrames: 120,
    },
  ],
};

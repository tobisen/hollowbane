import { fromGround } from "../world/navigation";
import { createMonster } from "./monsters";
import { ARENA_NAV, type CombatWorld } from "./combat";
import { createBoss, type BossDefinition } from "./boss";
/** Developer fixture, never installed in the campaign. */
export const BOSS_TRIAL: BossDefinition = {
  id: "boundary-sentinel",
  name: "Boundary Sentinel · engine trial",
  health: 240,
  defense: { defense: 8, armor: 20, physicalResistance: 0.1 },
  attacks: [
    {
      id: "sweep",
      name: "Stone sweep · step behind",
      timing: { windup: 48, active: 3, recovery: 54 },
      shape: { kind: "cone", radius: 2, halfAngle: Math.PI / 3 },
      damage: 14,
      element: "physical",
      weight: 1,
    },
    {
      id: "pulse",
      name: "Grave pulse · move away",
      timing: { windup: 72, active: 3, recovery: 66 },
      shape: { kind: "circle", radius: 2.4 },
      damage: 24,
      element: "physical",
      weight: 1,
    },
    {
      id: "fault",
      name: "Fault line · step aside",
      timing: { windup: 60, active: 3, recovery: 60 },
      shape: { kind: "line", length: 4, width: 0.9 },
      damage: 20,
      element: "physical",
      weight: 1,
    },
  ],
  phases: [
    {
      name: "Bound stone",
      healthAtMost: 1,
      attacks: ["sweep", "pulse", "fault"],
      transitionFrames: 60,
    },
    {
      name: "Fractured oath",
      healthAtMost: 0.5,
      attacks: ["sweep", "pulse", "fault"],
      transitionFrames: 90,
    },
  ],
};
export function installBossTrial(world: CombatWorld) {
  const home = fromGround({ x: 790, y: 560 });
  const arena = { center: home, home, radius: 6 };
  world.actors = world.actors.slice(0, 1);
  const actor = createMonster(100, "tank", home).actor;
  world.actors.push(actor);
  const state = createBoss(actor, BOSS_TRIAL, arena, ARENA_NAV);
  return { definition: BOSS_TRIAL, state, arena };
}

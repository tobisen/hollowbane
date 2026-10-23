import type { AreaLayout } from "./area-anchors";
import { areaWalkable } from "./area-map";
import { areaNavigation } from "../world/navigation";
import { createBoss, type BossDefinition } from "./boss";
import type { CombatWorld } from "./combat";
import { createMonster } from "./monsters";
import {
  planWorldEncounters,
  type WorldMonsterSpawn,
} from "./world-encounters";

export const CRYPT_BOSS_XP = 240;
export const CRYPT_BOSS: BossDefinition = {
  id: "sevra-vaultbound",
  name: "Sevra, the Vaultbound",
  health: 840,
  interruptGuardFrames: 180,
  defense: {
    defense: 8,
    armor: 30,
    physicalResistance: 0.2,
    resistances: { cold: 0.25, fire: -0.1, lightning: 0.15 },
  },
  attacks: [
    {
      id: "seal-rake",
      name: "Seal rake · step behind",
      timing: { windup: 66, active: 3, recovery: 72 },
      shape: { kind: "cone", radius: 1.9, halfAngle: Math.PI / 3 },
      damage: 22,
      element: "physical",
      weight: 1,
    },
    {
      id: "cold-edict",
      name: "Cold edict · step sideways",
      timing: { windup: 78, active: 3, recovery: 78 },
      shape: { kind: "line", length: 4, width: 0.8 },
      damage: 24,
      element: "cold",
      weight: 1,
    },
    {
      id: "vault-toll",
      name: "Vault toll · leave the ring",
      timing: { windup: 108, active: 3, recovery: 96 },
      shape: { kind: "circle", radius: 2 },
      damage: 28,
      element: "lightning",
      weight: 1,
    },
    {
      id: "severing-ray",
      name: "Severing ray · cross the line",
      timing: { windup: 84, active: 3, recovery: 84 },
      shape: { kind: "line", length: 4.5, width: 0.65 },
      damage: 26,
      element: "fire",
      weight: 1,
    },
  ],
  phases: [
    {
      name: "The sealed vigil",
      healthAtMost: 1,
      attacks: ["seal-rake", "cold-edict"],
      transitionFrames: 90,
    },
    {
      name: "The open vault",
      healthAtMost: 0.5,
      attacks: ["vault-toll", "severing-ray"],
      transitionFrames: 150,
    },
  ],
};

/** Retain a valid existing identity; reserve clear counterplay space without changing the map. */
export function cryptBossSpawn(
  layout: AreaLayout,
  plan: readonly WorldMonsterSpawn[],
): WorldMonsterSpawn | undefined {
  if (layout.map.area !== "ancient-crypt") return;
  const identity = [...plan].reverse().find((spawn) => spawn.role === "tank");
  if (!identity) return;
  const t = layout.map.terrain;
  const candidates = [];
  for (let y = 0; y < t.height; y++)
    for (let x = 0; x < t.width; x++) {
      const p = {
        x: t.origin.x + (x + 0.5) * t.cellSize,
        y: t.origin.y + (y + 0.5) * t.cellSize,
      };
      if (
        Math.hypot(p.x - layout.spawn.x, p.y - layout.spawn.y) >= 9 &&
        layout.exits.every(
          (e) => Math.hypot(p.x - e.trigger.x, p.y - e.trigger.y) >= 9,
        ) &&
        plan.filter(
          (other) =>
            Math.hypot(p.x - other.position.x, p.y - other.position.y) < 1,
        ).length <= 1 &&
        areaWalkable(layout.map, p, 2.4)
      )
        candidates.push(p);
    }
  candidates.sort(
    (a, b) =>
      Math.hypot(b.x - layout.spawn.x, b.y - layout.spawn.y) -
        Math.hypot(a.x - layout.spawn.x, a.y - layout.spawn.y) ||
      a.y - b.y ||
      a.x - b.x,
  );
  const home = candidates[0];
  if (!home) return;
  const occupant = plan.find(
    (other) =>
      Math.hypot(home.x - other.position.x, home.y - other.position.y) < 1,
  );
  return { ...(occupant ?? identity), position: home };
}

export function installCryptBoss(
  actor: CombatWorld["actors"][number],
  home: { x: number; y: number },
  layout: AreaLayout,
) {
  const arena = { home: { ...home }, center: { ...home }, radius: 4.5 };
  actor.xpReward = CRYPT_BOSS_XP;
  if (actor.movement)
    actor.movement = { ...actor.movement, walkSpeed: 1.8, runSpeed: 1.8 };
  return {
    definition: CRYPT_BOSS,
    state: createBoss(actor, CRYPT_BOSS, arena, areaNavigation(layout.map)),
    arena,
  };
}

/** Explicit memory-only scenario. Renderer owns the isolated world; no save/storage API. */
export function installCryptBossTrial(world: CombatWorld, layout: AreaLayout) {
  const spawn = cryptBossSpawn(layout, planWorldEncounters(layout));
  if (!spawn) throw Error("Crypt boss has no safe arena");
  const player = world.actors[0]!;
  player.controller.walker.position = {
    x: spawn.position.x + 1.2,
    y: spawn.position.y,
  };
  const actor = createMonster(spawn.id, "tank", spawn.position).actor;
  world.actors = [player, actor];
  return installCryptBoss(actor, spawn.position, layout);
}

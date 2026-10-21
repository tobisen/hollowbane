import type { AreaLayout } from "./area-anchors";
import { areaDefinition } from "./world";
import type { CombatWorld } from "./combat";
import type { Encounter } from "./encounter";
import { createMonster } from "./monsters";
import { areaNavigation, canWalk } from "../world/navigation";
import {
  planWorldEncounters,
  ENCOUNTER_SAFE_RADIUS,
  CRYPT_FINALE_ACTOR,
} from "./world-encounters";
import { MONSTER_XP } from "./monster-experience";
import { cryptBossSpawn, installCryptBoss } from "./crypt-boss";
import { createBoss, type BossArena, type BossState } from "./boss";
import {
  CAIRNWARDEN,
  CAIRNWARDEN_XP,
  cairnwardenSpawn,
} from "./stonebound-miniboss";
/** Surviving packs restart on area load; defeated identities never restart or earn again. */
export class WorldEncounterRuntime {
  readonly encounter: Encounter;
  readonly plan: ReturnType<typeof planWorldEncounters>;
  boss: {
    definition: typeof CAIRNWARDEN;
    state: BossState;
    arena: BossArena;
  } | null = null;
  private miniboss;
  private cryptBoss;
  private layout;
  private activated = new Set<number>();
  private nav;
  private level: number;
  constructor(
    world: CombatWorld,
    layout: AreaLayout,
    private deaths: ReadonlySet<number>,
    finaleUnlocked?: boolean,
  ) {
    this.layout = layout;
    const plan = planWorldEncounters(layout);
    const crypt = cryptBossSpawn(layout, plan);
    this.cryptBoss =
      crypt &&
      (finaleUnlocked === undefined
        ? crypt
        : finaleUnlocked
          ? { ...crypt, id: CRYPT_FINALE_ACTOR, pack: CRYPT_FINALE_ACTOR }
          : undefined);
    // The mechanics fixture keeps its original identity. Campaign sessions reserve
    // this arena and use a new identity, preserving every legacy death/loot ledger.
    this.plan = plan.flatMap((spawn) =>
      spawn.id === crypt?.id
        ? this.cryptBoss
          ? [this.cryptBoss]
          : []
        : [spawn],
    );
    this.miniboss = cairnwardenSpawn(layout, this.plan);
    this.nav = areaNavigation(layout.map);
    this.level = areaDefinition(layout.map.area).level;
    this.encounter = {
      combat: world,
      brains: [],
      nextId: 1,
      seed: layout.map.seed,
      corpseTicks: 600,
      spawned: 0,
      despawned: 0,
      work: { pathRequests: 0, decisions: 0, separationCorrections: 0 },
    };
  }
  activate(): void {
    const e = this.encounter,
      player = e.combat.actors[0]!;
    if (player.hp <= 0) return;
    for (const pack of new Set(this.plan.map((p) => p.pack))) {
      if (this.activated.has(pack)) continue;
      const members = this.plan.filter(
        (p) =>
          p.pack === pack &&
          !this.deaths.has(p.id) &&
          !e.combat.experience.deaths.has(p.id),
      );
      if (!members.length) {
        this.activated.add(pack);
        continue;
      }
      if (
        e.brains.length + members.length > 50 ||
        members.some(
          (p) =>
            Math.hypot(
              player.controller.walker.position.x - p.position.x,
              player.controller.walker.position.y - p.position.y,
            ) < ENCOUNTER_SAFE_RADIUS ||
            !canWalk(this.nav, p.position) ||
            e.combat.actors.some(
              (a) =>
                a.hp > 0 &&
                a.id !== 0 &&
                Math.hypot(
                  a.controller.walker.position.x - p.position.x,
                  a.controller.walker.position.y - p.position.y,
                ) < 0.9,
            ),
        )
      )
        continue;
      for (const spawn of members) {
        const { actor, brain } = createMonster(
          spawn.id,
          spawn.role,
          spawn.position,
          spawn.pack,
          e.seed,
          spawn.tier !== "normal",
        );
        const levelScale = 1 + (this.level - 1) * 0.12,
          elite = spawn.tier === "elite";
        actor.xpReward = Math.round(
          MONSTER_XP[spawn.role] *
            (1 + (this.level - 1) * 0.25) *
            (elite ? 1.5 : spawn.tier === "champion" ? 1.25 : 1),
        );
        actor.hp = actor.maxHp = Math.round(
          actor.maxHp * levelScale * (elite ? 1.5 : 1),
        );
        actor.offense.damage *= levelScale * (elite ? 1.2 : 1);
        if (elite) {
          actor.name = actor.name.replace("Champion ", "Elite ");
          actor.defense.armor += 20;
        }
        if (spawn.id === this.miniboss?.id) {
          const arena = {
            center: { ...spawn.position },
            home: { ...spawn.position },
            radius: 6,
          };
          this.boss = {
            definition: CAIRNWARDEN,
            state: createBoss(actor, CAIRNWARDEN, arena, this.nav),
            arena,
          };
          actor.xpReward = CAIRNWARDEN_XP;
        }
        if (spawn.id === this.cryptBoss?.id)
          this.boss = installCryptBoss(actor, spawn.position, this.layout);
        brain.previousHp = actor.hp;
        e.combat.actors.push(actor);
        if (spawn.id !== this.miniboss?.id && spawn.id !== this.cryptBoss?.id)
          e.brains.push(brain);
        e.spawned++;
      }
      this.activated.add(pack);
    }
  }
}

import {
  advanceExpedition,
  newExpedition,
  migrateExpedition,
  EXPEDITION_REWARD,
} from "./world-expedition";
import { grantCharacterXp } from "./monster-experience";
import { beginCampDialogue, newCampConversations } from "./camp-dialogue";
import { discoveryCell, revealDiscovery } from "./world-discovery";
import { planWorldContainers, openWorldContainer } from "./world-containers";
import type { ItemContent } from "./item-content";
import { configureWorldRewards } from "./world-rewards";
import {
  worldLayout,
  layoutFingerprint,
  GENERATED_WORLD_VERSION,
} from "./world-layout";
import { itemTree } from "./item-ownership";
import { WorldTravel } from "./world-travel";
import { stepWorldTravel } from "./world-runtime";
import { AREA_IDS, areaSeed, type AreaId } from "./world";
import {
  restoredPosition,
  validateExploration,
  type ExplorationSnapshot,
} from "./world-save";
import type { CombatWorld } from "./combat";
import type { LootWorld } from "./world-loot";
import type { WorldPoint } from "./world";
/** Only area-local state is parked; item generation keeps one global loot stream. */
export class WorldSession {
  travel: WorldTravel;
  private snapshot: ExplorationSnapshot;
  constructor(
    snapshot?: ExplorationSnapshot,
    seed = 42,
    contentVersion = GENERATED_WORLD_VERSION,
    initialArea: AreaId = "ashen-refuge",
  ) {
    this.snapshot = snapshot
      ? validateExploration(snapshot)
      : {
          version: 2,
          containers: { version: 1, gold: 0, opened: [] },
          contentVersion,
          seed,
          area: initialArea,
          position: worldLayout(initialArea, seed, contentVersion).spawn,
          visited: [initialArea],
          areas: AREA_IDS.map((id) => ({
            id,
            seed: areaSeed(seed, id),
            ...(contentVersion === 2
              ? {
                  layoutFingerprint: layoutFingerprint(
                    worldLayout(id, seed, contentVersion),
                  ),
                }
              : {}),
            drops: [],
            deaths: [],
          })),
        };
    // Explicit nested-state migration; saved map versions/fingerprints are retained.
    if (this.snapshot.version === 1)
      this.snapshot = {
        ...this.snapshot,
        version: 2,
        containers: { version: 1, gold: 0, opened: [] },
      };
    if (this.snapshot.version === 2)
      this.snapshot = {
        ...this.snapshot,
        version: 3,
        areas: this.snapshot.areas.map((a) => ({
          ...a,
          discovery: {
            version: 1,
            fingerprint: layoutFingerprint(
              worldLayout(
                a.id,
                this.snapshot.seed,
                this.snapshot.contentVersion,
              ),
            ),
            cells: [],
          },
        })),
      };
    if (this.snapshot.version === 3)
      this.snapshot = {
        ...this.snapshot,
        version: 4,
        expedition: newExpedition(
          this.snapshot.seed,
          this.snapshot.contentVersion,
        ),
      };
    if (this.snapshot.version === 4)
      this.snapshot = {
        ...this.snapshot,
        version: 5,
        dialogue: newCampConversations(),
      };
    const s = this.snapshot;
    s.expedition = migrateExpedition(s.expedition!);
    this.travel = new WorldTravel(
      s.seed,
      worldLayout(s.area, s.seed, s.contentVersion),
    );
    this.travel.setPosition(restoredPosition(s));
  }
  get expedition() {
    return { ...migrateExpedition(this.snapshot.expedition!) };
  }
  get conversations() {
    return {
      ...this.snapshot.dialogue!,
      met: [...this.snapshot.dialogue!.met],
    };
  }
  beginDialogue(id: string, world: CombatWorld) {
    const player = world.actors[0]!;
    const result = beginCampDialogue(
      this.snapshot.dialogue!,
      id,
      this.travel.state.area,
      player.controller.walker.position,
      player.hp > 0,
      player.controller.timeline.phase === "idle",
    );
    if (result) this.snapshot.dialogue = result.state;
    return result;
  }
  /** Existing generated crypt spawn is a reachable chamber, clear of exit triggers. */
  get objectivePosition(): WorldPoint | null {
    return this.travel.state.area === "ancient-crypt"
      ? this.travel.layout.spawn
      : null;
  }
  canInteractExpedition(world: CombatWorld): boolean {
    const player = world.actors[0]!;
    if (player.hp <= 0 || player.controller.timeline.phase !== "idle")
      return false;
    if (this.expedition.stage === "ready")
      return this.travel.state.area === "ashen-refuge";
    const p = this.objectivePosition;
    return (
      this.expedition.stage === "outbound" &&
      this.expedition.reached === 3 &&
      !!p &&
      Math.hypot(
        player.controller.walker.position.x - p.x,
        player.controller.walker.position.y - p.y,
      ) <= 1
    );
  }
  interactExpedition(world: CombatWorld): boolean {
    if (!this.canInteractExpedition(world)) return false;
    const objective = this.expedition.stage === "outbound";
    if (objective) {
      const gold = this.containerState.gold + EXPEDITION_REWARD.gold;
      if (this.expedition.reward !== "pending" || !Number.isSafeInteger(gold))
        return false;
      // XP/point arithmetic prepares all values before mutation. The ledger, gold,
      // XP and objective are then captured by the existing atomic checkpoint.
      grantCharacterXp(world.experience, EXPEDITION_REWARD.xp);
      this.containerState.gold = gold;
    }
    this.snapshot.expedition = {
      ...this.expedition,
      stage: this.expedition.stage === "ready" ? "outbound" : "returning",
      reward: objective ? "claimed" : this.expedition.reward,
    };
    return true;
  }
  private lastReveal = "";
  private knownCells = new Map<AreaId, Set<number>>();
  discoveryRevision = 0;
  get discovery() {
    return this.snapshot.areas.find((a) => a.id === this.travel.state.area)!
      .discovery!;
  }
  reveal(position: WorldPoint): boolean {
    const area = this.travel.state.area,
      t = this.travel.layout.map.terrain;
    const cell = discoveryCell(t, position),
      key = `${area}:${cell}`;
    if (cell < 0 || key === this.lastReveal) return false;
    this.lastReveal = key;
    let known = this.knownCells.get(area);
    if (!known) {
      known = new Set(this.discovery.cells);
      this.knownCells.set(area, known);
    }
    const added = revealDiscovery(t, cell, known);
    if (!added.length) return false;
    this.discovery.cells.push(...added);
    this.discoveryRevision++;
    return true;
  }
  get containerState() {
    return this.snapshot.containers!;
  }
  private containerLayout: typeof this.travel.layout | undefined;
  private containerPlan: ReturnType<typeof planWorldContainers> = [];
  get containers() {
    if (this.containerLayout !== this.travel.layout) {
      this.containerLayout = this.travel.layout;
      this.containerPlan = planWorldContainers(this.travel.layout);
    }
    return this.containerPlan;
  }
  openContainer(
    id: number,
    player: WorldPoint,
    loot: LootWorld,
    tick: number,
    content: ItemContent,
  ): boolean {
    const container = this.containers.find((c) => c.id === id);
    return (
      !!container &&
      openWorldContainer(
        this.travel.layout,
        container,
        player,
        this.containerState,
        loot,
        tick,
        content,
      )
    );
  }
  get contentVersion(): number {
    return this.snapshot.contentVersion;
  }
  capture(position: WorldPoint, loot: LootWorld): ExplorationSnapshot {
    if (!this.travel.setPosition(position))
      throw Error("Invalid live exploration position");
    return validateExploration({
      ...this.snapshot,
      area: this.travel.state.area,
      position,
      areas: this.snapshot.areas.map((a) =>
        a.id === this.travel.state.area
          ? { ...a, deaths: [...loot.deaths] }
          : a,
      ),
    });
  }
  restoreDeaths(loot: LootWorld, world?: CombatWorld): void {
    if (this.snapshot.contentVersion === 2)
      configureWorldRewards(loot, this.travel.state.area);
    loot.deaths = new Set(
      this.snapshot.areas.find((a) => a.id === this.travel.state.area)!.deaths,
    );
    if (world) {
      world.experience.deaths.clear();
      for (const area of this.snapshot.areas)
        for (const id of area.deaths) world.experience.deaths.add(id);
    }
  }
  transition(world: CombatWorld, loot: LootWorld): boolean {
    const before = this.travel.state.area;
    if (!stepWorldTravel(this.travel, world, this.snapshot.contentVersion))
      return false;
    const after = this.travel.state.area;
    const destination = this.snapshot.areas.find((a) => a.id === after)!;
    this.snapshot = {
      ...this.snapshot,
      expedition: advanceExpedition(this.expedition, before, after),
      area: after,
      position: this.travel.state.position,
      visited: [...new Set([...this.snapshot.visited, after])],
      areas: this.snapshot.areas.map((a) =>
        a.id === before
          ? { ...a, drops: loot.drops, deaths: [...loot.deaths] }
          : a.id === after
            ? { ...a, drops: [] }
            : a,
      ),
    };
    const activeIds = new Set(
      itemTree(destination.drops.map((d) => d.item)).map((i) => i.id),
    );
    loot.reserved = [
      ...new Set([
        ...(loot.reserved ?? []).filter((id) => !activeIds.has(id)),
        ...itemTree(
          this.snapshot.areas.flatMap((a) => a.drops.map((d) => d.item)),
        ).map((i) => i.id),
      ]),
    ];
    loot.drops = destination.drops;
    loot.deaths = new Set(destination.deaths);
    if (this.snapshot.contentVersion === 2) configureWorldRewards(loot, after);
    return true;
  }
}

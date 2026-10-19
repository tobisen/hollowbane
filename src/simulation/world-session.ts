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
          version: 1,
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
    const s = this.snapshot;
    this.travel = new WorldTravel(
      s.seed,
      worldLayout(s.area, s.seed, s.contentVersion),
    );
    this.travel.setPosition(restoredPosition(s));
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
  restoreDeaths(loot: LootWorld): void {
    loot.deaths = new Set(
      this.snapshot.areas.find((a) => a.id === this.travel.state.area)!.deaths,
    );
  }
  transition(world: CombatWorld, loot: LootWorld): boolean {
    const before = this.travel.state.area;
    if (!stepWorldTravel(this.travel, world, this.snapshot.contentVersion))
      return false;
    const after = this.travel.state.area;
    const destination = this.snapshot.areas.find((a) => a.id === after)!;
    this.snapshot = {
      ...this.snapshot,
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
    return true;
  }
}

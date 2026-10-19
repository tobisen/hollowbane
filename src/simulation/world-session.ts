import { itemTree } from "./item-ownership";
import { WorldTravel } from "./world-travel";
import { prototypeArea, stepWorldTravel } from "./world-runtime";
import { AREA_IDS, areaSeed, WORLD_CONTENT_VERSION } from "./world";
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
  constructor(snapshot?: ExplorationSnapshot) {
    this.snapshot = snapshot
      ? validateExploration(snapshot)
      : {
          version: 1,
          contentVersion: WORLD_CONTENT_VERSION,
          seed: 42,
          area: "ashen-refuge",
          position: { x: 0, y: 0 },
          visited: ["ashen-refuge"],
          areas: AREA_IDS.map((id) => ({
            id,
            seed: areaSeed(42, id),
            drops: [],
            deaths: [],
          })),
        };
    const s = this.snapshot;
    this.travel = new WorldTravel(s.seed, prototypeArea(s.area, s.seed));
    this.travel.setPosition(restoredPosition(s));
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
    if (!stepWorldTravel(this.travel, world)) return false;
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

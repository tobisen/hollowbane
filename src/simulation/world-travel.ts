import { areaWalkable } from "./area-map";
import {
  exitNear,
  validAreaLayout,
  WORLD_ACTOR_RADIUS,
  type AreaLayout,
} from "./area-anchors";
import {
  areaDefinition,
  areaSeed,
  type AreaId,
  type WorldPoint,
} from "./world";
export interface TravelState {
  readonly seed: number;
  readonly area: AreaId;
  readonly position: WorldPoint;
  readonly revision: number;
}
/** Opaque per-session preparation handle; callers cannot forge a destination. */
export interface PreparedTravel {
  readonly destination: AreaId;
}
interface PendingTravel {
  readonly source: TravelState;
  readonly layout: AreaLayout;
  readonly arrival: WorldPoint;
}
function point(p: WorldPoint): WorldPoint {
  return Object.freeze({ x: p.x, y: p.y });
}
/** Own a frozen copy so asynchronous loaders cannot change a validated destination. */
function ownLayout(source: AreaLayout): AreaLayout {
  return Object.freeze({
    map: Object.freeze({
      area: source.map.area,
      seed: source.map.seed,
      terrain: Object.freeze({
        ...source.map.terrain,
        origin: point(source.map.terrain.origin),
        cells: Object.freeze([...source.map.terrain.cells]),
      }),
      objects: Object.freeze(
        source.map.objects.map((o) =>
          Object.freeze({ ...o, position: point(o.position) }),
        ),
      ),
    }),
    spawn: point(source.spawn),
    exits: Object.freeze(
      source.exits.map((e) =>
        Object.freeze({
          ...e,
          trigger: point(e.trigger),
          arrival: point(e.arrival),
        }),
      ),
    ),
  });
}
/** Owns travel only. Character, loot and inventory never get copied or replaced here. */
export class WorldTravel {
  private current: TravelState;
  private loaded: AreaLayout;
  private pending = new WeakMap<PreparedTravel, PendingTravel>();
  constructor(seed: number, initial: AreaLayout) {
    if (
      initial.map.seed !== areaSeed(seed, initial.map.area) ||
      !validAreaLayout(initial)
    )
      throw new Error("Invalid initial area");
    this.loaded = ownLayout(initial);
    this.current = Object.freeze({
      seed,
      area: initial.map.area,
      position: point(initial.spawn),
      revision: 0,
    });
  }
  get state(): TravelState {
    return this.current;
  }
  get layout(): AreaLayout {
    return this.loaded;
  }
  /** The movement simulation remains responsible for the swept path to this position. */
  setPosition(position: WorldPoint): boolean {
    if (!areaWalkable(this.loaded.map, position, WORLD_ACTOR_RADIUS))
      return false;
    if (
      position.x === this.current.position.x &&
      position.y === this.current.position.y
    )
      return true;
    this.current = Object.freeze({
      ...this.current,
      position: point(position),
      revision: this.current.revision + 1,
    });
    return true;
  }
  prepare(exitId: string, destination: AreaLayout): PreparedTravel | null {
    const nearby = exitNear(this.loaded, this.current.position);
    const edge = areaDefinition(this.current.area).connections.find(
      (c) => c.id === exitId,
    );
    if (
      nearby?.id !== exitId ||
      !edge ||
      destination.map.area !== edge.destination ||
      destination.map.seed !== areaSeed(this.current.seed, edge.destination) ||
      !validAreaLayout(destination)
    )
      return null;
    const layout = ownLayout(destination);
    const arrival = layout.exits.find((e) => e.id === edge.arrival)!.arrival;
    const handle = Object.freeze({ destination: edge.destination });
    this.pending.set(handle, { source: this.current, layout, arrival });
    return handle;
  }
  commit(handle: PreparedTravel): boolean {
    const pending = this.pending.get(handle);
    this.pending.delete(handle);
    if (!pending || pending.source !== this.current) return false;
    this.loaded = pending.layout;
    this.current = Object.freeze({
      seed: this.current.seed,
      area: pending.layout.map.area,
      position: pending.arrival,
      revision: this.current.revision + 1,
    });
    // Cancel other preparations from the prior area without retaining unloaded layouts.
    this.pending = new WeakMap();
    return true;
  }
  cancel(): void {
    this.pending = new WeakMap();
  }
}

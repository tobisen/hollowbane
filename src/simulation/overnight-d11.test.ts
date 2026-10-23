import { expect, it } from "vitest";
import {
  createInventorySession,
  type InventorySession,
} from "./inventory-world";
import { WorldSession } from "./world-session";
import { createCombat } from "./combat";
import { inventoryItem } from "./inventory-test-helper";
import { socketedCampItem } from "../../tests/fixtures/camp-items";
import { newCampStash } from "./camp-stash-state";
import {
  travelByWaypoint,
  waypointDeparture,
  type WaypointIntent,
} from "./world-waypoints";
import {
  serializeCharacter,
  deserializeCharacter,
  snapshotChecksum,
  inspectSnapshots,
} from "./inventory-save";
import { worldLayout } from "./world-layout";
import { planWorldEncounters } from "./world-encounters";
import { InventoryRuntime } from "../rendering/inventory-runtime";
import type { AreaId } from "./world";

const quiet = { alive: true, idle: true, safe: true };
function fixture(generated = false) {
  const s = createInventorySession(900),
    w = new WorldSession(undefined, 42, generated ? 2 : 1),
    combat = createCombat();
  combat.actors = [combat.actors[0]!];
  expect(w.attuneWaypoint(w.travel.layout.spawn, true, true, true)).toContain(
    "attuned",
  );
  s.character.grid.items.push({
    item: inventoryItem("ash-blade", 0, 2),
    x: 0,
    y: 0,
  });
  s.exploration = w.capture(w.travel.layout.spawn, s.loot);
  s.exploration.stash = {
    ...newCampStash(),
    grid: {
      columns: 10,
      rows: 8,
      items: [{ item: socketedCampItem(), x: 0, y: 0 }],
    },
  };
  // Preserve the stash while constructing the ordinary camp→forest transition.
  const current = new WorldSession(s.exploration);
  s.loot.drops.push({
    item: inventoryItem("trail-boots"),
    position: { ...current.travel.layout.spawn },
    tick: 0,
    source: -1,
  });
  combat.actors[0]!.controller.walker.position = {
    ...current.travel.layout.exits[0]!.trigger,
  };
  expect(current.transition(combat, s.loot)).toBe(true);
  combat.actors[0]!.controller.walker.position = {
    ...current.travel.layout.spawn,
  };
  expect(
    current.attuneWaypoint(current.travel.layout.spawn, true, true, true),
  ).toContain("attuned");
  s.loot.drops.push({
    item: inventoryItem("copper-band"),
    position: { ...current.travel.layout.spawn },
    tick: 1,
    source: -1,
  });
  s.loot.deaths.add(
    generated ? planWorldEncounters(current.travel.layout)[0]!.id : 17,
  );
  s.loot.sequence = 123;
  s.exploration = current.capture(current.travel.layout.spawn, s.loot);
  return s;
}
function quote(
  s: InventorySession,
  destination: AreaId = "ashen-refuge",
): WaypointIntent {
  return {
    destination,
    expectedArea: s.exploration!.area,
    expectedRevision: s.exploration!.waypoints!.revision,
  };
}
function rejected(s: InventorySession, q: WaypointIntent, context = quiet) {
  const before = structuredClone(s);
  expect(travelByWaypoint(s, q, context).ok).toBe(false);
  expect(s).toEqual(before);
}
it("attunement requires reachability and a quiet living idle player, saves once and cannot mutate through returned state", () => {
  const w = new WorldSession(undefined, 42, 1),
    loot = createInventorySession().loot,
    p = w.travel.layout.spawn;
  for (const [position, alive, idle, safe] of [
    [{ x: 1, y: 3 }, true, true, true],
    [p, false, true, true],
    [p, true, false, true],
    [p, true, true, false],
  ] as const) {
    const before = w.capture(p, loot);
    expect(w.attuneWaypoint(position, alive, idle, safe)).toContain("Approach");
    expect(w.capture(p, loot)).toEqual(before);
  }
  expect(w.attuneWaypoint(p, true, true, true)).toContain("attuned");
  const before = w.capture(p, loot);
  expect(w.attuneWaypoint(p, true, true, true)).toContain("already");
  expect(w.capture(p, loot)).toEqual(before);
  w.waypoints.unlocked.push("ancient-crypt");
  expect(w.waypoints).toEqual({
    version: 1,
    revision: 1,
    unlocked: ["ashen-refuge"],
  });
});
it("travel atomically parks source drops and restores destination drops while preserving every owned and embedded identity", () => {
  const s = fixture(),
    q = quote(s),
    before = structuredClone(s),
    moved = travelByWaypoint(s, q, quiet);
  if (!moved.ok) throw Error(moved.reason);
  expect(s).toEqual(before);
  expect(moved.value.character).toEqual(s.character);
  expect(moved.value.exploration!.stash).toEqual(s.exploration!.stash);
  expect(moved.value.exploration!.area).toBe("ashen-refuge");
  expect(moved.value.loot.sequence).toBe(123);
  expect(moved.value.loot.drops).toEqual(s.exploration!.areas[0]!.drops);
  expect(
    moved.value.exploration!.areas.find((a) => a.id === "haunted-forest")!
      .drops,
  ).toEqual(s.loot.drops);
  expect(moved.value.exploration!.areas[0]!.drops).toEqual([]);
  expect(moved.value.loot.reserved).toContain(
    socketedCampItem().embedded![0]!.id,
  );
  rejected(moved.value, q);
  const loaded = deserializeCharacter(serializeCharacter(moved.value));
  expect(loaded.exploration!.waypoints).toEqual(
    moved.value.exploration!.waypoints,
  );
  const back = travelByWaypoint(loaded, quote(loaded, "haunted-forest"), quiet);
  if (!back.ok) throw Error(back.reason);
  expect(back.value.loot.drops).toEqual(s.loot.drops);
  expect(back.value.loot.deaths).toEqual(s.loot.deaths);
  expect(back.value.character).toEqual(s.character);
});
it("locked, current, unknown, distant, stale, dead, busy and threatened departures reject without any mutation", () => {
  const s = fixture();
  rejected(s, quote(s, "ancient-crypt"));
  rejected(s, quote(s, "haunted-forest"));
  rejected(s, { ...quote(s), destination: "unknown" as AreaId });
  rejected(s, { ...quote(s), expectedRevision: -1 });
  rejected(s, quote(s), { ...quiet, alive: false });
  rejected(s, quote(s), { ...quiet, idle: false });
  rejected(s, quote(s), { ...quiet, safe: false });
  const far = structuredClone(s);
  far.exploration!.position = { x: 100, y: 100 };
  rejected(far, quote(far));
  const capped = structuredClone(s);
  capped.exploration!.waypoints!.revision = Number.MAX_SAFE_INTEGER;
  rejected(capped, quote(capped));
});
it("legacy snapshots gain no retroactive unlocks and cannot unlock later areas; invalid discovery evidence retains a recoverable previous checkpoint", () => {
  const s = fixture();
  delete s.exploration!.waypoints;
  const old = serializeCharacter(s);
  expect(serializeCharacter(deserializeCharacter(old))).toBe(old);
  expect(new WorldSession(s.exploration).waypoints.unlocked).toEqual([]);
  const valid = serializeCharacter(fixture());
  for (const change of [
    (b: { exploration: NonNullable<InventorySession["exploration"]> }) => {
      b.exploration.waypoints!.unlocked.push("ancient-crypt");
      b.exploration.waypoints!.revision++;
    },
    (b: { exploration: NonNullable<InventorySession["exploration"]> }) => {
      b.exploration.areas[0]!.discovery!.cells = [];
    },
  ]) {
    const r = JSON.parse(valid);
    change(r.body);
    r.checksum = snapshotChecksum(JSON.stringify(r.body));
    const corrupt = JSON.stringify(r);
    expect(() => deserializeCharacter(corrupt)).toThrow(/Waypoint/);
    expect(inspectSnapshots(corrupt, old).kind).toBe("recoverable");
  }
});
it("generated maps retain exact seeds fingerprints discovery and quest/item/progression data through an atomic waypoint save", () => {
  const s = fixture(true),
    moved = travelByWaypoint(s, quote(s), quiet);
  if (!moved.ok) throw Error(moved.reason);
  const loaded = deserializeCharacter(serializeCharacter(moved.value));
  expect(loaded.character).toEqual(s.character);
  expect(loaded.exploration!.quests).toEqual(s.exploration!.quests);
  expect(loaded.exploration!.containers).toEqual(s.exploration!.containers);
  for (const a of loaded.exploration!.areas) {
    const prior = s.exploration!.areas.find((p) => p.id === a.id)!;
    expect([a.seed, a.layoutFingerprint, a.discovery, a.deaths]).toEqual([
      prior.seed,
      prior.layoutFingerprint,
      prior.discovery,
      prior.deaths,
    ]);
  }
  expect(loaded.exploration!.position).toEqual(
    worldLayout("ashen-refuge", 42, 2).spawn,
  );
});
it("departure safety uses actual living hostiles and effect activity, and ignores distant idle foes or corpses", () => {
  const w = createCombat();
  w.actors = [w.actors[0]!, w.actors[1]!];
  const p = w.actors[0]!.controller.walker.position,
    foe = w.actors[1]!;
  foe.kind = "hostile";
  foe.controller.walker.position = { x: p.x + 2, y: p.y };
  expect(waypointDeparture(w).safe).toBe(false);
  foe.hp = 0;
  expect(waypointDeparture(w).safe).toBe(true);
  foe.hp = 100;
  foe.controller.walker.position = { x: p.x + 10, y: p.y };
  expect(waypointDeparture(w).safe).toBe(true);
  expect(waypointDeparture(w, true).safe).toBe(false);
  w.actors[0]!.hp = 0;
  expect(waypointDeparture(w).alive).toBe(false);
});
it("runtime world restoration for waypoint travel keeps current health and mana rather than refilling resources", () => {
  const s = fixture(),
    actor = createCombat().actors[0]!,
    mana = { mana: 9, maxMana: 100 };
  let loot = s.loot,
    world = new WorldSession(s.exploration);
  actor.hp = 37;
  const runtime = new InventoryRuntime(
    () => actor,
    () => mana,
    () => loot,
    (l) => {
      loot = l;
    },
    12,
    undefined,
    undefined,
    1,
    {
      capture: () => world.capture(actor.controller.walker.position, loot),
      prepare: (candidate) => {
        const next = new WorldSession(candidate.exploration);
        return () => {
          world = next;
          actor.controller.walker.position = { ...next.travel.state.position };
        };
      },
    },
  );
  runtime.restore(s);
  const moved = travelByWaypoint(
    runtime.session(),
    quote(runtime.session()),
    quiet,
  );
  if (!moved.ok) throw Error(moved.reason);
  runtime.restore(moved.value);
  expect(actor.hp).toBe(37);
  expect(mana.mana).toBe(9);
  expect(world.travel.state.area).toBe("ashen-refuge");
});
it("a genuine once-claimed crypt beacon can return to camp by waypoint without another expedition reward", () => {
  const s = createInventorySession(900),
    w = new WorldSession(undefined, 42, 2),
    combat = createCombat();
  combat.actors = [combat.actors[0]!];
  w.attuneWaypoint(w.travel.layout.spawn, true, true, true);
  for (const exit of ["forest", "graveyard", "crypt"]) {
    combat.actors[0]!.controller.walker.position = {
      ...w.travel.layout.exits.find((e) => e.id === exit)!.trigger,
    };
    expect(w.transition(combat, s.loot)).toBe(true);
  }
  combat.actors[0]!.controller.walker.position = { ...w.travel.layout.spawn };
  expect(w.interactExpedition(combat)).toBe(true);
  expect(w.interactExpedition(combat)).toBe(false);
  w.attuneWaypoint(w.travel.layout.spawn, true, true, true);
  s.character.level = combat.experience.character.level;
  s.progression = {
    curve: "xp-v1",
    character: combat.experience.character,
    attributes: combat.experience.attributes,
    skills: combat.experience.skills,
  };
  s.exploration = w.capture(w.travel.layout.spawn, s.loot);
  const result = travelByWaypoint(s, quote(s), quiet);
  if (!result.ok) throw Error(result.reason);
  const loaded = deserializeCharacter(serializeCharacter(result.value));
  expect(loaded.exploration!.expedition!.stage).toBe("complete");
  expect(loaded.progression).toEqual(s.progression);
  expect(loaded.exploration!.containers).toEqual(s.exploration!.containers);
  expect(new WorldSession(loaded.exploration).interactExpedition(combat)).toBe(
    false,
  );
});

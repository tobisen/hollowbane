import { describe, expect, it } from "vitest";
import { CLASS_IDS } from "./character-classes";
import { createD14Fixture } from "../../tests/fixtures/d14-campaign";
import { measureD12Finale } from "../../tests/fixtures/d12-balance";
import { serializeCharacter, deserializeCharacter } from "./inventory-save";
import { tradeWithMerchant } from "./camp-merchant";
import { merchantSalePrice } from "./camp-merchant-state";
import { transferCampStash } from "./camp-stash";
import { travelByWaypoint } from "./world-waypoints";
import { WorldSession } from "./world-session";
import { createCombat } from "./combat";
import { WorldEncounterRuntime } from "./world-encounter-runtime";
import { CRYPT_FINALE_ACTOR } from "./world-encounters";

// Chained canonical saves split the genuine cross-system journey into bounded
// cases, preserving every original assertion and the 25-second case deadline.
describe.each(CLASS_IDS)("%s integrated Act1 release", (id) => {
  let checkpoint: string, xp: number, gold: number, sequence: number;
  it("earns the finale and campaign reward through real combat and ordinary return travel", () => {
    const f = createD14Fixture(id),
      metrics = measureD12Finale(f);
    expect(metrics.complete).toBe(true);
    expect(metrics.hp).toBeGreaterThan(0);
    for (const exit of ["graveyard", "forest", "camp"]) f.travel(exit);
    f.claim(3);
    f.idleAt({ x: 1, y: 3 });
    const saved = f.checkpoint();
    checkpoint = saved.text;
    xp = saved.loaded.progression!.character.totalXp;
    gold = saved.loaded.exploration!.containers!.gold;
    sequence = saved.loaded.loot.sequence;
    expect(new WorldSession(saved.loaded.exploration).campaignComplete).toBe(
      true,
    );
  }, 25000);
  it("buys stores reloads retrieves and sells without ownership or reward duplication", () => {
    let s = deserializeCharacter(checkpoint);
    const trade = (kind: "buy" | "sell", item: string) => {
      const r = tradeWithMerchant(s, {
        kind,
        id: item,
        expectedRevision: s.character.revision,
        expectedMerchantRevision: s.exploration!.merchant?.revision ?? 0,
      });
      if (!r.ok) throw Error(r.reason);
      s = deserializeCharacter(serializeCharacter(r.value));
    };
    trade("buy", "ash-blade");
    const item = structuredClone(s.character.grid.items[0]!.item);
    const stash = (kind: "store" | "retrieve") => {
      const r = transferCampStash(s, {
        kind,
        id: item.id,
        expectedRevision: s.character.revision,
        expectedStashRevision: s.exploration!.stash?.revision ?? 0,
      });
      if (!r.ok) throw Error(r.reason);
      s = deserializeCharacter(serializeCharacter(r.value));
    };
    stash("store");
    expect(s.character.grid.items).toEqual([]);
    expect(s.exploration!.stash!.grid.items[0]!.item).toEqual(item);
    stash("retrieve");
    expect(s.character.grid.items[0]!.item).toEqual(item);
    trade("sell", item.id);
    expect(s.character.grid.items).toEqual([]);
    expect(s.exploration!.stash!.grid.items).toEqual([]);
    expect(s.exploration!.containers!.gold).toBe(
      gold - 60 + merchantSalePrice(item),
    );
    expect(s.exploration!.merchant!.retired).toContain(item.id);
    expect(s.loot.reserved).toContain(item.id);
    expect(s.progression!.character.totalXp).toBe(xp);
    expect(s.loot.sequence).toBe(sequence);
    checkpoint = serializeCharacter(s);
  }, 25000);
  it("revisits the defeated crypt by waypoint and canonically reloads completed progression without another boss", () => {
    let s = deserializeCharacter(checkpoint);
    const w = new WorldSession(s.exploration);
    s.exploration = w.capture(w.travel.layout.spawn, s.loot);
    const jump = (destination: "ashen-refuge" | "ancient-crypt") => {
      const r = travelByWaypoint(
        s,
        {
          destination,
          expectedArea: s.exploration!.area,
          expectedRevision: s.exploration!.waypoints!.revision,
        },
        { alive: true, idle: true, safe: true },
      );
      if (!r.ok) throw Error(r.reason);
      s = deserializeCharacter(serializeCharacter(r.value));
    };
    jump("ancient-crypt");
    const loaded = new WorldSession(s.exploration),
      combat = createCombat();
    combat.actors = [combat.actors[0]!];
    combat.actors[0]!.controller.walker.position = {
      ...loaded.travel.layout.spawn,
    };
    loaded.restoreDeaths(s.loot, combat);
    const runtime = new WorldEncounterRuntime(
      combat,
      loaded.travel.layout,
      s.loot.deaths,
      true,
    );
    runtime.activate();
    expect(runtime.boss).toBeNull();
    expect(combat.actors.some((a) => a.id === CRYPT_FINALE_ACTOR)).toBe(false);
    jump("ashen-refuge");
    expect(new WorldSession(s.exploration).campaignComplete).toBe(true);
    expect(s.progression!.skills.classId).toBe(id);
    expect(s.progression!.character.totalXp).toBe(xp);
    expect(s.loot.sequence).toBe(sequence);
    expect(s.exploration!.waypoints!.revision).toBe(4);
    const text = serializeCharacter(s);
    expect(serializeCharacter(deserializeCharacter(text))).toBe(text);
  }, 25000);
});

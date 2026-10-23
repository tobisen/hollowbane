import { expect, it } from "vitest";
import { CLASS_IDS } from "./character-classes";
import {
  createD12Fixture,
  measureD12Finale,
} from "../../tests/fixtures/d12-balance";
import { CRYPT_BOSS, CRYPT_BOSS_XP } from "./crypt-boss";
import { ACT1_FINALE, QUESTS } from "./quests";
import { WorldSession } from "./world-session";
import { createInventorySession } from "./inventory-world";
import { serializeCharacter, deserializeCharacter } from "./inventory-save";
import {
  MERCHANT_OFFERS,
  MERCHANT_PRICES,
  merchantSalePrice,
} from "./camp-merchant-state";
import { tradeWithMerchant } from "./camp-merchant";
import { validateBoss } from "./boss";

it.each(CLASS_IDS)(
  "%s completes earned expedition/finale with bounded skill pacing, resources and one-time rewards",
  (classId) => {
    const f = createD12Fixture(classId),
      before = structuredClone(f.checkpoint().loaded),
      metrics = measureD12Finale(f);
    const evidence = JSON.stringify(metrics);
    expect(metrics.complete, evidence).toBe(true);
    // Six to forty-five seconds: preserve a readable multi-phase fight, reject stalls.
    expect(metrics.ticks, evidence).toBeGreaterThanOrEqual(360);
    expect(metrics.ticks, evidence).toBeLessThanOrEqual(2700);
    expect(metrics.phaseTicks).toHaveLength(2);
    expect(
      metrics.ticks - metrics.phaseTicks[1]!,
      evidence,
    ).toBeGreaterThanOrEqual(CRYPT_BOSS.phases[1]!.transitionFrames + 84);
    expect(new Set(metrics.warnings)).toEqual(
      new Set(CRYPT_BOSS.attacks.map((a) => a.id)),
    );
    expect(metrics.strikes, evidence).toBeGreaterThan(0);
    expect(metrics.interrupts, evidence).toBeGreaterThan(0);
    expect(metrics.casts, evidence).toBeGreaterThan(0);
    expect(metrics.hp, evidence).toBeGreaterThan(metrics.maxHp / 2);
    expect(metrics.hp, evidence).toBeLessThan(metrics.maxHp);
    expect(metrics.lowestMana, evidence).toBeGreaterThanOrEqual(0);
    expect(metrics.mana, evidence).toBeLessThanOrEqual(metrics.maxMana);
    expect(metrics.xp).toBe(CRYPT_BOSS_XP);
    expect(metrics.lootRolls).toBe(1);
    for (const exit of ["graveyard", "forest", "camp"]) f.travel(exit);
    f.claim(3);
    const finished = f.checkpoint();
    expect(f.session.campaignComplete).toBe(true);
    expect(finished.loaded.progression!.skills.classId).toBe(classId);
    expect(finished.loaded.progression!.character.level).toBeGreaterThanOrEqual(
      5,
    );
    expect(finished.loaded.progression!.character.level).toBeLessThanOrEqual(7);
    const reward = QUESTS.find((q) => q.id === ACT1_FINALE)!.reward;
    expect(finished.loaded.progression!.character.totalXp).toBe(
      before.progression!.character.totalXp + CRYPT_BOSS_XP + reward.xp,
    );
    expect(finished.loaded.exploration!.containers!.gold).toBe(
      before.exploration!.containers!.gold + reward.gold,
    );
    expect(finished.loaded.loot.sequence).toBe(before.loot.sequence + 1);
    const stable = structuredClone(finished.loaded);
    expect(
      f.session.claimQuest(ACT1_FINALE, f.world, f.inventory.loot),
    ).not.toContain("Reward claimed");
    expect(f.checkpoint().loaded).toEqual(stable);
    expect(
      new WorldSession(deserializeCharacter(finished.text).exploration)
        .campaignComplete,
    ).toBe(true);
    console.log("D12 finale", evidence);
  },
  25000,
);

it("all finite merchant offers lose gold on complete buy/sell/reload cycles without XP or loot-stream farming", () => {
  let s = createInventorySession(900);
  const w = new WorldSession(undefined, 42, 1);
  s.exploration = w.capture({ x: 1, y: 3 }, s.loot);
  s.exploration.containers!.gold = 500;
  s = deserializeCharacter(serializeCharacter(s));
  const original = structuredClone(s);
  let loss = 0;
  for (const offer of MERCHANT_OFFERS) {
    const buy = tradeWithMerchant(s, {
      kind: "buy",
      id: offer,
      expectedRevision: s.character.revision,
      expectedMerchantRevision: s.exploration!.merchant?.revision ?? 0,
    });
    if (!buy.ok) throw Error(buy.reason);
    s = deserializeCharacter(serializeCharacter(buy.value));
    const item = s.character.grid.items[0]!.item;
    const sale = merchantSalePrice(item);
    expect(sale).toBeLessThan(MERCHANT_PRICES[offer]!);
    const sell = tradeWithMerchant(s, {
      kind: "sell",
      id: item.id,
      expectedRevision: s.character.revision,
      expectedMerchantRevision: s.exploration!.merchant!.revision,
    });
    if (!sell.ok) throw Error(sell.reason);
    s = deserializeCharacter(serializeCharacter(sell.value));
    loss += MERCHANT_PRICES[offer]! - sale;
    const before = structuredClone(s);
    expect(
      tradeWithMerchant(s, {
        kind: "buy",
        id: offer,
        expectedRevision: s.character.revision,
        expectedMerchantRevision: s.exploration!.merchant!.revision,
      }).ok,
    ).toBe(false);
    expect(s).toEqual(before);
  }
  expect(s.exploration!.containers!.gold).toBe(500 - loss);
  expect(loss).toBeGreaterThan(0);
  expect(s.exploration!.merchant!.purchased).toHaveLength(5);
  expect(s.exploration!.merchant!.retired).toHaveLength(5);
  expect(s.character.grid.items).toEqual([]);
  expect(s.progression).toEqual(original.progression);
  expect(s.loot.sequence).toBe(original.loot.sequence);
  expect(s.exploration!.quests).toEqual(original.exploration!.quests);
});

it("bounds optional boss interruption configuration while preserving warning timings and first-interruption semantics", () => {
  for (const invalid of [-1, NaN, 1.5, 601])
    expect(() =>
      validateBoss({ ...CRYPT_BOSS, interruptGuardFrames: invalid }),
    ).toThrow(/interruption guard/);
  expect(CRYPT_BOSS.attacks.map((a) => a.timing.windup)).toEqual([
    66, 78, 108, 84,
  ]);
  expect(CRYPT_BOSS.phases.map((p) => p.transitionFrames)).toEqual([90, 150]);
  expect(CRYPT_BOSS.interruptGuardFrames).toBe(180);
});

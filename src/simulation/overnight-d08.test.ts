import { expect, it } from "vitest";
import {
  ACT1_FINALE,
  QUESTS,
  advanceQuests,
  validateQuestState,
} from "./quests";
import { WorldSession } from "./world-session";
import { WorldEncounterRuntime } from "./world-encounter-runtime";
import { CRYPT_FINALE_ACTOR, planWorldEncounters } from "./world-encounters";
import { cryptBossSpawn, CRYPT_BOSS_XP } from "./crypt-boss";
import { worldLayout } from "./world-layout";
import { createCombat } from "./combat";
import {
  fightD08Finale,
  createD08CampaignFixture,
} from "../../tests/fixtures/d08-campaign";
import {
  deserializeCharacter,
  inspectSnapshots,
  snapshotChecksum,
} from "./inventory-save";
import { CHARACTER_CLASSES } from "./character-classes";
import { CAMP_NPCS } from "./camp-dialogue";
import { questRewardItem } from "./quest-rewards";

const finale = QUESTS.find((q) => q.id === ACT1_FINALE)!;
it("locks the campaign encounter behind the final quest and reserves an independent, persistent identity", () => {
  expect(finale.requires).toEqual(["the-light-below"]);
  const session = new WorldSession(undefined, 42, 2);
  expect(session.acceptQuest(ACT1_FINALE)).toBe(false);
  const layout = worldLayout("ancient-crypt", 42, 2),
    world = createCombat();
  world.actors = world.actors.slice(0, 1);
  world.actors[0]!.controller.walker.position = layout.spawn;
  const old = cryptBossSpawn(layout, planWorldEncounters(layout))!;
  const locked = new WorldEncounterRuntime(world, layout, new Set(), false);
  locked.activate();
  expect(locked.boss).toBeNull();
  expect(
    locked.plan.some((s) => s.id === old.id || s.id === CRYPT_FINALE_ACTOR),
  ).toBe(false);
  world.actors = world.actors.slice(0, 1);
  const unlocked = new WorldEncounterRuntime(
    world,
    layout,
    new Set([old.id]),
    true,
  );
  unlocked.activate();
  expect(unlocked.boss?.state.actor).toBe(CRYPT_FINALE_ACTOR);
  expect(unlocked.boss?.state.complete).toBe(false);
});

it.each(CHARACTER_CLASSES.map((c) => c.id))(
  "%s concludes Act 1 once through live boss hooks, safe return, reward and reload",
  (classId) => {
    const f = createD08CampaignFixture(classId);
    const prior = deserializeCharacter(f.beforeAccept);
    expect(prior.exploration!.version).toBe(6);
    const legacy = new WorldSession(prior.exploration);
    expect(legacy.campaignComplete).toBe(false);
    expect(legacy.finaleUnlocked).toBe(false);
    const { world, player, boss, xp, sequence } = fightD08Finale(f);
    expect(boss.state.complete).toBe(true);
    expect(player.hp).toBeGreaterThan(0);
    expect(boss.state.phase).toBe(1);
    expect(world.experience.character.totalXp).toBe(xp + CRYPT_BOSS_XP);
    expect(f.inventory.loot.sequence).toBe(sequence + 1);
    expect(f.session.quests.entries.at(-1)?.status).toBe("ready");
    const dead = f.checkpoint().text;
    const loaded = new WorldSession(deserializeCharacter(dead).exploration);
    expect(loaded.campaignComplete).toBe(false);
    expect(loaded.finaleUnlocked).toBe(true);
    const original = f.session.quests;
    for (const id of [String(f.boss.id), "4060", "4091"])
      expect(
        advanceQuests(original, { kind: "boss", area: "ancient-crypt", id }),
      ).toBe(original);
    expect(
      f.session.claimQuest(ACT1_FINALE, world, f.inventory.loot),
    ).toContain("Return safely");
    f.travel("graveyard");
    f.travel("forest");
    f.travel("camp");
    if (classId === "warrior") {
      f.idleAt(CAMP_NPCS.find((n) => n.id === "edda-vey")!.position);
      const gold = f.session.containerState.gold,
        before = f.session.quests;
      f.session.containerState.gold = Number.MAX_SAFE_INTEGER;
      expect(
        f.session.claimQuest(ACT1_FINALE, world, f.inventory.loot),
      ).toContain("Gold limit reached");
      expect(f.session.quests).toEqual(before);
      expect(world.experience.character.totalXp).toBe(xp + CRYPT_BOSS_XP);
      f.session.containerState.gold = gold;
    }
    f.claim(3);
    const reward = questRewardItem(finale.reward)!;
    expect(
      f.inventory.loot.drops.find((d) => d.item.id === reward.id)?.item,
    ).toEqual(reward);
    expect(f.session.campaignComplete).toBe(true);
    const after = f.checkpoint();
    expect(new WorldSession(after.loaded.exploration).campaignComplete).toBe(
      true,
    );
    expect(world.experience.character.totalXp).toBe(
      xp + CRYPT_BOSS_XP + finale.reward.xp,
    );
    expect(f.inventory.loot.sequence).toBe(sequence + 1); // quest item owns a separate pinned stream
    const edda = CAMP_NPCS.find((n) => n.id === "edda-vey")!;
    f.idleAt(edda.position);
    expect(f.session.beginDialogue(edda.id, world)?.cursor.node).toBe(
      "conclusion",
    );
    const tampered = JSON.parse(after.text);
    tampered.body.exploration.areas.find(
      (a: { id: string }) => a.id === "ancient-crypt",
    ).deaths = [];
    tampered.checksum = snapshotChecksum(JSON.stringify(tampered.body));
    expect(inspectSnapshots(JSON.stringify(tampered), dead).kind).toBe(
      "recoverable",
    );
    const invalid = structuredClone(f.session.quests);
    invalid.entries.at(-1)!.seen = [[String(f.boss.id)]];
    expect(() => validateQuestState(invalid)).toThrow();
  },
  25000,
);

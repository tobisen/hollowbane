import { expect, it } from "vitest";
import {
  QUESTS,
  acceptQuest,
  advanceQuests,
  claimedQuest,
  newQuestState,
  questStatus,
  trackQuest,
  validateQuestDefinitions,
  validateQuestState,
  type QuestEvent,
} from "./quests";
import { questRewardItem } from "./quest-rewards";
import { WorldSession } from "./world-session";
import { CAMP_NPCS } from "./camp-dialogue";
import { createCombat } from "./combat";
import { createInventorySession } from "./inventory-world";
import {
  deserializeCharacter,
  serializeCharacter,
  snapshotChecksum,
  inspectSnapshots,
} from "./inventory-save";
import { worldLayout } from "./world-layout";

const intro = QUESTS[0]!,
  field = QUESTS[1]!;
function readyIntro() {
  const session = new WorldSession(),
    world = createCombat(),
    inventory = createInventorySession();
  inventory.character.level = 1;
  expect(session.acceptQuest(intro.id)).toBe(true);
  for (const npc of CAMP_NPCS) {
    world.actors[0]!.controller.walker.position = { ...npc.position };
    session.beginDialogue(npc.id, world);
  }
  expect(session.quests.entries[0]!.status).toBe("ready");
  return { session, world, inventory };
}
it("validates data-driven objectives, original identities and the prerequisite DAG", () => {
  expect(validateQuestDefinitions(QUESTS)).toEqual(QUESTS);
  for (const bad of [
    [intro, intro],
    [{ ...intro, requires: ["missing"] }],
    [{ ...intro, requires: [field.id] }, field],
    [{ ...intro, objectives: [{ ...intro.objectives[0], target: "missing" }] }],
    [{ ...intro, objectives: [{ ...intro.objectives[0], count: 0 }] }],
    [{ ...intro, reward: { ...intro.reward, gold: Infinity } }],
  ])
    expect(() => validateQuestDefinitions(bad)).toThrow();
});
it("locks prerequisites until reward commit, tracks accepted quests and ignores pre-accept events", () => {
  const initial = newQuestState();
  expect(questStatus(initial, field)).toBe("locked");
  expect(acceptQuest(initial, field.id)).toBe(initial);
  expect(trackQuest(initial, intro.id)).toBe(initial);
  expect(
    advanceQuests(initial, {
      kind: "interact",
      area: "ashen-refuge",
      id: "edda-vey",
    }),
  ).toBe(initial);
  let s = acceptQuest(initial, intro.id);
  expect(s.tracked).toBe(intro.id);
  expect(acceptQuest(s, intro.id)).toBe(s);
  for (const id of ["edda-vey", "orren-thale"])
    s = advanceQuests(s, { kind: "interact", area: "ashen-refuge", id });
  expect(questStatus(s, intro)).toBe("ready");
  expect(acceptQuest(s, field.id)).toBe(s);
  s = claimedQuest(s, intro.id);
  expect(s.tracked).toBeNull();
  expect(questStatus(s, field)).toBe("available");
  expect(claimedQuest(s, intro.id)).toBe(s);
});
it("counts travel, defeat and collected item identities once, rejecting invalid and replayed events", () => {
  let s = acceptQuest(newQuestState(), intro.id);
  for (const id of ["edda-vey", "orren-thale"])
    s = advanceQuests(s, { kind: "interact", area: "ashen-refuge", id });
  s = acceptQuest(claimedQuest(s, intro.id), field.id);
  for (const event of [
    { kind: "travel", area: "haunted-forest", id: "ancient-crypt" },
    { kind: "defeat", area: "haunted-forest", id: "3000" },
    { kind: "collect", area: "haunted-forest", id: "forged" },
    { kind: "interact", area: "haunted-forest", id: "edda-vey" },
  ] as QuestEvent[])
    expect(advanceQuests(s, event)).toBe(s);
  for (const event of [
    { kind: "travel", area: "haunted-forest", id: "haunted-forest" },
    { kind: "defeat", area: "haunted-forest", id: "2000" },
    { kind: "collect", area: "haunted-forest", id: "l3-2a-0" },
  ] as QuestEvent[]) {
    s = advanceQuests(s, event);
    expect(advanceQuests(s, event)).toBe(s);
  }
  expect(s.entries[1]).toMatchObject({
    status: "ready",
    seen: [["haunted-forest"], ["2000"], ["l3-2a-0"]],
  });
  expect(validateQuestState(s)).toEqual(s);
});
it("rejects forged counters, duplicate identities, inconsistent completion, missing prerequisites and newer schemas", () => {
  const active = acceptQuest(newQuestState(), intro.id);
  for (const bad of [
    { ...active, version: 2 },
    { ...active, tracked: field.id },
    { ...active, entries: [...active.entries, ...active.entries] },
    { ...active, entries: [{ ...active.entries[0], status: "claimed" }] },
    {
      ...active,
      entries: [{ ...active.entries[0], seen: [["orren-thale"], []] }],
    },
    {
      ...active,
      entries: [{ ...active.entries[0], seen: [["edda-vey", "edda-vey"], []] }],
    },
    {
      ...active,
      tracked: field.id,
      entries: [{ id: field.id, status: "active", seen: [[], [], []] }],
    },
  ])
    expect(() => validateQuestState(bad)).toThrow();
});
it("deduplicates partial multi-count kill and pickup objectives before their caps", () => {
  const definitions = validateQuestDefinitions([
    {
      ...field,
      requires: [],
      objectives: field.objectives
        .filter((o) => o.kind !== "travel")
        .map((o) => ({ ...o, count: 2 })),
    },
  ]);
  let state = acceptQuest(newQuestState(), field.id, definitions);
  for (const [kind, first, second] of [
    ["defeat", "2000", "2001"],
    ["collect", "l3-2a-0", "l3-2a-1"],
  ] as const) {
    const event = { kind, area: "haunted-forest" as const, id: first };
    state = advanceQuests(state, event, definitions);
    expect(advanceQuests(state, event, definitions)).toBe(state);
    expect(state.entries[0]!.status).toBe("active");
    state = advanceQuests(state, { ...event, id: second }, definitions);
  }
  expect(state.entries[0]!.status).toBe("ready");
  expect(validateQuestState(state, definitions)).toEqual(state);
});
it("retains all reward halves when item capacity, identity, gold or XP preparation fails", () => {
  for (const failure of ["capacity", "identity", "gold", "xp"]) {
    const { session, world, inventory } = readyIntro();
    if (failure === "capacity") {
      inventory.loot.capacity = 1;
      inventory.loot.drops.push({
        item: questRewardItem(intro.reward)!,
        position: world.actors[0]!.controller.walker.position,
        tick: 0,
        source: -2,
      });
    }
    if (failure === "identity")
      inventory.loot.reserved = [questRewardItem(intro.reward)!.id];
    if (failure === "gold")
      session.containerState.gold = Number.MAX_SAFE_INTEGER;
    if (failure === "xp") Object.assign(world.experience, { curve: [] });
    const before = structuredClone({
      quests: session.quests,
      gold: session.containerState.gold,
      xp: world.experience,
      loot: inventory.loot,
    });
    expect(session.claimQuest(intro.id, world, inventory.loot)).not.toContain(
      "Reward claimed",
    );
    expect({
      quests: session.quests,
      gold: session.containerState.gold,
      xp: world.experience,
      loot: inventory.loot,
    }).toEqual(before);
  }
}, 25000);
it("commits XP, gold, unique item ownership and ledger once across atomic save/reload and recovery", () => {
  const { session, world, inventory } = readyIntro();
  expect(session.claimQuest(intro.id, world, inventory.loot)).toContain(
    "Reward claimed",
  );
  expect(world.experience.character.totalXp).toBe(25);
  expect(session.containerState.gold).toBe(5);
  expect(inventory.loot.sequence).toBe(0);
  expect(inventory.loot.drops).toHaveLength(1);
  expect(inventory.loot.drops[0]!.item).toEqual(questRewardItem(intro.reward));
  expect(session.acceptQuest(field.id)).toBe(true);
  world.actors[0]!.controller.walker.position = {
    ...session.travel.layout.exits.find((e) => e.id === "forest")!.trigger,
  };
  expect(session.transition(world, inventory.loot)).toBe(true);
  inventory.exploration = session.capture(
    world.actors[0]!.controller.walker.position,
    inventory.loot,
  );
  inventory.progression = {
    curve: "xp-v1",
    character: world.experience.character,
    attributes: world.experience.attributes,
    skills: world.experience.skills,
  };
  const text = serializeCharacter(inventory),
    loaded = deserializeCharacter(text),
    resumed = new WorldSession(loaded.exploration);
  expect(resumed.quests).toEqual(session.quests);
  expect(resumed.claimQuest(intro.id, world, loaded.loot)).not.toContain(
    "Reward claimed",
  );
  expect(loaded.loot.drops).toEqual(inventory.loot.drops);
  for (const change of ["schema", "ledger", "xp", "meeting", "death"]) {
    const root = JSON.parse(text);
    if (change === "schema") root.body.exploration.quests.version = 2;
    if (change === "ledger")
      root.body.exploration.quests.entries[0].seen[0] = [];
    if (change === "xp") root.body.progression.character.totalXp = 0;
    if (change === "meeting") root.body.exploration.dialogue.met = [];
    if (change === "death")
      root.body.exploration.quests.entries[1].seen[1] = ["2000"];
    root.checksum = snapshotChecksum(JSON.stringify(root.body));
    expect(inspectSnapshots(JSON.stringify(root), text).kind).toBe(
      "recoverable",
    );
  }
}, 25000);
it("migrates exploration5 with empty quests while retaining meetings, expedition, items and map identities", () => {
  const { session, world, inventory } = readyIntro();
  const modern = session.capture(
      world.actors[0]!.controller.walker.position,
      inventory.loot,
    ),
    old = structuredClone(modern);
  old.version = 5;
  delete old.quests;
  const migrated = new WorldSession(old).capture(old.position, inventory.loot);
  expect(migrated.quests).toEqual(newQuestState());
  const { quests: _quests, version: _version, ...rest } = migrated;
  void _quests;
  void _version;
  const { version: _oldVersion, ...original } = old;
  void _oldVersion;
  expect(rest).toEqual(original);
}, 15000);
it("accepts after a previously cleared forest without requiring a dead encounter to respawn or repeating XP", () => {
  const { session, world, inventory } = readyIntro();
  session.claimQuest(intro.id, world, inventory.loot);
  world.actors[0]!.controller.walker.position = {
    ...session.travel.layout.exits.find((e) => e.id === "forest")!.trigger,
  };
  expect(session.transition(world, inventory.loot)).toBe(true);
  inventory.loot.deaths.add(2000);
  const saved = session.capture(
      world.actors[0]!.controller.walker.position,
      inventory.loot,
    ),
    restored = new WorldSession(saved);
  const beforeXp = structuredClone(world.experience);
  expect(restored.acceptQuest(field.id)).toBe(true);
  expect(restored.quests.entries[1]!.seen.slice(0, 2)).toEqual([
    ["haunted-forest"],
    ["2000"],
  ]);
  expect(world.experience).toEqual(beforeXp);
  expect(restored.acceptQuest(field.id)).toBe(false);
  expect(session.acceptQuest(field.id, inventory.loot)).toBe(true);
  expect(session.quests.entries[1]!.seen.slice(0, 2)).toEqual([
    ["haunted-forest"],
    ["2000"],
  ]);
}, 15000);
it("credits only current player hostile deaths, preserving source and replay policy", () => {
  const { session, world } = readyIntro();
  // Activate the fixture after the first reward; an actual area transition is covered in route/browser tests.
  session.claimQuest(intro.id, world, createInventorySession().loot);
  session.acceptQuest(field.id);
  const hostile = {
    ...world.actors[1]!,
    id: 2000,
    hp: 0,
    kind: "hostile" as const,
    monsterRole: "melee" as const,
  };
  world.actors.push(hostile);
  world.tick = 20;
  world.events = [{ kind: "death", tick: 19, actor: 0, target: 2000 }];
  expect(session.consumeQuestDeaths(world)).toBe(false);
  world.events = [{ kind: "death", tick: 20, actor: 99, target: 2000 }];
  expect(session.consumeQuestDeaths(world)).toBe(false);
  // Camp area rejects even a syntactically valid forest ID.
  world.events = [{ kind: "death", tick: 20, actor: 0, target: 2000 }];
  expect(session.consumeQuestDeaths(world)).toBe(false);
  const snapshot = session.capture(
    world.actors[0]!.controller.walker.position,
    createInventorySession().loot,
  );
  snapshot.area = "haunted-forest";
  snapshot.position = worldLayout(
    "haunted-forest",
    snapshot.seed,
    snapshot.contentVersion,
  ).spawn;
  snapshot.visited.push("haunted-forest");
  const forest = new WorldSession(snapshot);
  expect(forest.consumeQuestDeaths(world)).toBe(true);
  expect(forest.consumeQuestDeaths(world)).toBe(false);
  expect(forest.quests.entries[1]!.seen[1]).toEqual(["2000"]);
}, 15000);

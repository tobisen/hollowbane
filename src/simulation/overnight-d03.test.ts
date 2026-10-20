import { expect, it } from "vitest";
import { WorldSession } from "./world-session";
import { createCombat } from "./combat";
import {
  createInventorySession,
  type InventorySession,
} from "./inventory-world";
import { createMonsterExperience } from "./monster-experience";
import { DEFAULT_XP_CURVE } from "./experience";
import { allocateAttributes } from "./attributes";
import {
  allocateSkillRanks,
  createSkillProgression,
} from "./skill-progression";
import {
  serializeCharacter,
  deserializeCharacter,
  snapshotChecksum,
  inspectSnapshots,
} from "./inventory-save";
import { inventoryItem } from "./inventory-test-helper";
import { advancedItem } from "./advanced-item-test-helper";
import { insertSocket } from "./item-sockets";
import { itemTree } from "./item-ownership";
import { createCharacterInventory } from "./equipment";
import { EQUIPMENT_CONTENT } from "./item-content";
import { planWorldEncounters } from "./world-encounters";
import { WorldEncounterRuntime } from "./world-encounter-runtime";

function fixture() {
  let world = new WorldSession(),
    session = createInventorySession(123);
  const combat = createCombat(),
    player = combat.actors[0]!;
  combat.actors = [player];
  player.controller.walker.position = { ...world.travel.state.position };
  combat.experience = createMonsterExperience(DEFAULT_XP_CURVE[39]!);
  combat.experience.attributes = allocateAttributes(
    combat.experience.attributes,
    { strength: 3, vitality: 2 },
  );
  combat.experience.skills = allocateSkillRanks(
    createSkillProgression("warrior", 40),
    40,
    { "warrior-arms-foundation": 1 },
  );
  session.character = createCharacterInventory(40);
  const host = advancedItem("ash-blade", {
    version: 5,
    accept: (i) => i.quality === "normal" && i.socketCapacity === 2,
  });
  const gem = advancedItem("poison-gem-3", { version: 5, seed: 43 });
  session.character.equipment.main = host;
  session.character.grid.items.push({ item: gem, x: 0, y: 0 });
  const inserted = insertSocket(session.character, host.id, gem.id);
  if (!inserted.ok) throw Error(inserted.reason);
  session.character = inserted.value;
  session.character.equipment.off = inventoryItem("bark-guard", 0, 2);
  session.character.grid.items.push({
    item: inventoryItem("woven-coat"),
    x: 0,
    y: 0,
  });
  session.loot.sequence = 98765;
  session.loot.drops.push({
    item: inventoryItem("copper-band"),
    position: { ...world.travel.layout.spawn },
    tick: 1,
    source: -1,
  });
  world.restoreDeaths(session.loot, combat);
  const checkpoint = () => {
    session.character.level = combat.experience.character.level;
    session.progression = {
      curve: "xp-v1",
      character: combat.experience.character,
      attributes: combat.experience.attributes,
      skills: combat.experience.skills,
    };
    session.exploration = world.capture(
      player.controller.walker.position,
      session.loot,
    );
    const text = serializeCharacter(session);
    session = deserializeCharacter(text);
    world = new WorldSession(session.exploration);
    world.restoreDeaths(session.loot, combat);
    player.controller.walker.position = { ...world.travel.state.position };
    combat.experience.character = session.progression!.character;
    combat.experience.attributes = session.progression!.attributes;
    combat.experience.skills = session.progression!.skills;
    const expected = JSON.parse(text).body as InventorySession;
    expect(session.character).toEqual(expected.character);
    expect(session.progression).toEqual(expected.progression);
    expect(session.loot).toMatchObject(expected.loot);
    expect(session.exploration).toEqual(expected.exploration);
    const { revision, ...location } = world.travel.state;
    expect(Number.isSafeInteger(revision) && revision >= 0).toBe(true);
    expect(location).toEqual({
      seed: expected.exploration!.seed,
      area: expected.exploration!.area,
      position: expected.exploration!.position,
    });
    expect(world.expedition).toEqual(expected.exploration!.expedition);
    expect(world.containerState).toEqual(expected.exploration!.containers);
    expect(world.discovery).toEqual(
      expected.exploration!.areas.find((a) => a.id === world.travel.state.area)!
        .discovery,
    );
    expect([...session.loot.deaths]).toEqual(
      expected.exploration!.areas.find((a) => a.id === world.travel.state.area)!
        .deaths,
    );
    return text;
  };
  const travel = (exit: string) => {
    player.controller.walker.position = {
      ...world.travel.layout.exits.find((e) => e.id === exit)!.trigger,
    };
    expect(world.transition(combat, session.loot)).toBe(true);
    checkpoint();
  };
  return {
    combat,
    player,
    checkpoint,
    travel,
    world: () => world,
    session: () => session,
  };
}

it("resumes every expedition leg with mixed/embedded ownership, treasure, discovery, deaths, XP and stable seeds", () => {
  const f = fixture();
  f.world().interactExpedition(f.combat);
  f.checkpoint();
  const owned = structuredClone(f.session().character),
    ids = itemTree([
      ...Object.values(owned.equipment),
      ...owned.grid.items.map((p) => p.item),
    ]).map((i) => i.id);
  f.travel("forest");
  const forest = f.world(),
    container = forest.containers[0]!;
  f.player.controller.walker.position = { ...container.position };
  expect(
    forest.openContainer(
      container.id,
      container.position,
      f.session().loot,
      1,
      EQUIPMENT_CONTENT,
    ),
  ).toBe(true);
  forest.reveal(container.position);
  const defeated = planWorldEncounters(forest.travel.layout)[0]!.id;
  f.session().loot.deaths.add(defeated);
  f.checkpoint();
  expect(f.session().loot.deaths.has(defeated)).toBe(true);
  const layout = f.world().discovery.fingerprint;
  const gold = f.world().containerState.gold;
  const discovery = [...f.world().discovery.cells];
  f.travel("graveyard");
  f.travel("crypt");
  f.player.controller.walker.position = { ...f.world().objectivePosition! };
  expect(f.world().interactExpedition(f.combat)).toBe(true);
  f.checkpoint();
  expect(f.world().interactExpedition(f.combat)).toBe(false);
  for (const exit of ["graveyard", "forest", "camp"]) f.travel(exit);
  expect(f.world().expedition).toMatchObject({
    stage: "complete",
    reward: "claimed",
  });
  expect(f.session().character).toEqual(owned);
  expect(
    itemTree([
      ...Object.values(f.session().character.equipment),
      ...f.session().character.grid.items.map((p) => p.item),
    ]).map((i) => i.id),
  ).toEqual(ids);
  expect(f.world().containerState.gold).toBe(gold + 120);
  expect(f.session().loot.sequence).toBe(98765);
  expect(f.session().loot.drops).toHaveLength(1);
  const savedForest = f
    .session()
    .exploration!.areas.find((a) => a.id === "haunted-forest")!;
  expect(savedForest.discovery).toEqual({
    version: 1,
    fingerprint: layout,
    cells: discovery,
  });
  expect(savedForest.deaths).toEqual([defeated]);
  f.travel("forest");
  const runtime = new WorldEncounterRuntime(
    f.combat,
    f.world().travel.layout,
    f.session().loot.deaths,
  );
  runtime.activate();
  expect(f.combat.actors.some((a) => a.id === defeated)).toBe(false);
  expect(
    f
      .world()
      .openContainer(
        container.id,
        container.position,
        f.session().loot,
        1,
        EQUIPMENT_CONTENT,
      ),
  ).toBe(false);
}, 25000);

function alter(text: string, change: (body: InventorySession) => void) {
  const root = JSON.parse(text) as { body: InventorySession; checksum: string };
  change(root.body);
  root.checksum = snapshotChecksum(JSON.stringify(root.body));
  return JSON.stringify(root);
}
it("offers the unchanged previous snapshot for cross-area deaths, partial rewards and duplicate ownership", () => {
  const f = fixture();
  const text = f.checkpoint();
  for (const change of [
    (s: InventorySession) => {
      s.exploration!.areas[0]!.deaths = [2000];
    },
    (s: InventorySession) => {
      s.exploration!.areas[1]!.deaths = [3000];
    },
    (s: InventorySession) => {
      s.exploration!.areas[1]!.deaths = [2009];
    },
    (s: InventorySession) => {
      s.exploration!.areas[1]!.drops = [
        { ...s.loot.drops[0]!, item: s.character.equipment.main! },
      ];
    },
  ]) {
    const invalid = alter(text, change);
    expect(() => deserializeCharacter(invalid)).toThrow();
    const offered = inspectSnapshots(invalid, text);
    expect(offered.kind).toBe("recoverable");
    if (offered.kind === "recoverable")
      expect(serializeCharacter(offered.session)).toBe(text);
  }
  for (const exit of ["forest", "graveyard", "crypt"]) f.travel(exit);
  f.player.controller.walker.position = { ...f.world().objectivePosition! };
  f.world().interactExpedition(f.combat);
  const claimed = f.checkpoint();
  const low = createMonsterExperience();
  const partial = alter(claimed, (s) => {
    s.progression = {
      curve: "xp-v1",
      character: low.character,
      attributes: low.attributes,
      skills: low.skills,
    };
    s.character = createCharacterInventory(1);
  });
  expect(() => deserializeCharacter(partial)).toThrow(
    /Incomplete expedition reward/,
  );
  expect(inspectSnapshots(partial, claimed).kind).toBe("recoverable");
}, 25000);

it.each([1, 2, 3, 4])(
  "explicitly migrates character schema%i without losing supported legacy items or inventing world rewards",
  (schema) => {
    const s = createInventorySession();
    s.loot.table = "court";
    s.loot.sequence = 123;
    s.character.equipment.main = inventoryItem("ash-blade", 0, 2);
    const root = JSON.parse(serializeCharacter(s));
    root.schema = schema;
    root.body.contentVersions = schema === 1 ? [2, 3] : [2, 3, 4, 5, 6, 7, 8];
    if (schema <= 2) delete root.body.progression;
    if (schema === 3) delete root.body.progression.skills;
    root.checksum = snapshotChecksum(JSON.stringify(root.body));
    const loaded = deserializeCharacter(JSON.stringify(root));
    expect(loaded.character).toEqual(s.character);
    expect(loaded.loot.sequence).toBe(123);
    expect(new WorldSession(loaded.exploration).expedition).toMatchObject({
      stage: "ready",
      reward: "pending",
    });
  },
);

it.each([1, 2, 3])(
  "migrates exploration%i with its original seed, positions and ownership",
  (version) => {
    const f = fixture();
    f.travel("forest");
    const original = f.session(),
      root = JSON.parse(f.checkpoint());
    const old = root.body.exploration;
    old.version = version;
    delete old.expedition;
    delete old.dialogue;
    delete old.quests;
    if (version === 1) delete old.containers;
    if (version < 3) for (const area of old.areas) delete area.discovery;
    root.checksum = snapshotChecksum(JSON.stringify(root.body));
    const loaded = deserializeCharacter(JSON.stringify(root)),
      world = new WorldSession(loaded.exploration);
    expect(world.travel.state).toEqual(f.world().travel.state);
    expect(loaded.character).toEqual(original.character);
    expect(loaded.loot.sequence).toBe(original.loot.sequence);
    expect(world.expedition).toMatchObject({
      stage: "ready",
      reward: "pending",
    });
  },
  15000,
);

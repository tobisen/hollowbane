import { expect, it } from "vitest";
import {
  CAMP_NPCS,
  validateCampNpcs,
  newCampConversations,
  validateCampConversations,
  nearbyCampNpc,
  beginCampDialogue,
  advanceCampDialogue,
  dialogueNode,
} from "./camp-dialogue";
import { createCombat } from "./combat";
import { WorldSession } from "./world-session";
import { createInventorySession } from "./inventory-world";
import {
  serializeCharacter,
  deserializeCharacter,
  inspectSnapshots,
  snapshotChecksum,
} from "./inventory-save";
import { areaNavigation, canWalk } from "../world/navigation";
import { worldLayout } from "./world-layout";

it("validates original camp identities, clear positions and every dialogue destination", () => {
  const layout = worldLayout("ashen-refuge", 42, 2),
    nav = areaNavigation(layout.map);
  for (const npc of CAMP_NPCS) {
    expect(canWalk(nav, npc.position)).toBe(true);
    expect(Math.hypot(npc.position.x, npc.position.y)).toBeGreaterThan(1.5);
    for (const exit of layout.exits)
      expect(
        Math.hypot(
          npc.position.x - exit.trigger.x,
          npc.position.y - exit.trigger.y,
        ),
      ).toBeGreaterThan(1.5);
    expect(
      dialogueNode({ npc: npc.id, node: "welcome" })?.choices.length,
    ).toBeGreaterThan(0);
  }
  const invalid = structuredClone(CAMP_NPCS);
  Object.assign(invalid[0]!.nodes.welcome!.choices[0]!, { next: "missing" });
  expect(() => validateCampNpcs(invalid)).toThrow(/destination/);
  expect(() => validateCampNpcs([CAMP_NPCS[0], CAMP_NPCS[0]])).toThrow(
    /Duplicate/,
  );
  expect(() =>
    validateCampNpcs([
      { ...CAMP_NPCS[0], position: { x: Infinity, y: 0 } },
      CAMP_NPCS[1],
    ]),
  ).toThrow();
});

it("rejects distant, unknown, non-camp, dead, committed and nonfinite interactions without mutating flags", () => {
  const npc = CAMP_NPCS[0]!,
    state = newCampConversations(),
    before = structuredClone(state);
  expect(nearbyCampNpc("ashen-refuge", { x: 0, y: 0 })).toBeUndefined();
  expect(nearbyCampNpc("ashen-refuge", npc.position)?.id).toBe(npc.id);
  for (const intent of [
    {
      id: npc.id,
      area: "ashen-refuge" as const,
      p: { x: 0, y: 0 },
      alive: true,
      idle: true,
    },
    {
      id: "missing",
      area: "ashen-refuge" as const,
      p: npc.position,
      alive: true,
      idle: true,
    },
    {
      id: npc.id,
      area: "haunted-forest" as const,
      p: npc.position,
      alive: true,
      idle: true,
    },
    {
      id: npc.id,
      area: "ashen-refuge" as const,
      p: npc.position,
      alive: false,
      idle: true,
    },
    {
      id: npc.id,
      area: "ashen-refuge" as const,
      p: npc.position,
      alive: true,
      idle: false,
    },
    {
      id: npc.id,
      area: "ashen-refuge" as const,
      p: { x: NaN, y: 0 },
      alive: true,
      idle: true,
    },
  ])
    expect(
      beginCampDialogue(
        state,
        intent.id,
        intent.area,
        intent.p,
        intent.alive,
        intent.idle,
      ),
    ).toBeNull();
  expect(state).toEqual(before);
});

it("owns once-only meeting flags and deterministic branches without rewarding or retaining an open cursor", () => {
  const npc = CAMP_NPCS[0]!,
    state = newCampConversations();
  const opened = beginCampDialogue(
    state,
    npc.id,
    "ashen-refuge",
    npc.position,
    true,
    true,
  )!;
  expect(opened.changed).toBe(true);
  expect(opened.cursor.node).toBe("welcome");
  expect(state.met).toEqual([]);
  const topic = advanceCampDialogue(opened.cursor, 0)!;
  expect(dialogueNode(topic)?.text).toContain("Ashen Refuge");
  expect(advanceCampDialogue(topic, 1)).toBeNull();
  const again = beginCampDialogue(
    opened.state,
    npc.id,
    "ashen-refuge",
    npc.position,
    true,
    true,
  )!;
  expect(again).toMatchObject({
    changed: false,
    cursor: { npc: npc.id, node: "return" },
  });
  expect(again.state).toBe(opened.state);
  expect(again.state.met).toEqual([npc.id]);
});

it("atomically saves both NPC flags with existing world/character state and offers a valid backup for malformed flags", () => {
  const world = new WorldSession(),
    combat = createCombat(),
    session = createInventorySession();
  const progression = structuredClone(combat.experience),
    owned = structuredClone(session.character);
  for (const npc of CAMP_NPCS) {
    combat.actors[0]!.controller.walker.position = { ...npc.position };
    expect(world.beginDialogue(npc.id, combat)?.cursor.node).toBe("welcome");
  }
  session.exploration = world.capture(
    combat.actors[0]!.controller.walker.position,
    session.loot,
  );
  const text = serializeCharacter(session),
    restored = new WorldSession(deserializeCharacter(text).exploration);
  expect(restored.conversations).toEqual({
    version: 1,
    met: CAMP_NPCS.map((n) => n.id),
  });
  expect(restored.beginDialogue(CAMP_NPCS[1]!.id, combat)?.cursor.node).toBe(
    "return",
  );
  expect(combat.experience).toEqual(progression);
  expect(session.character).toEqual(owned);
  expect(world.containerState.gold).toBe(0);
  for (const change of [
    { version: 2, met: [] },
    { version: 1, met: ["missing"] },
    { version: 1, met: [CAMP_NPCS[0]!.id, CAMP_NPCS[0]!.id] },
  ]) {
    expect(() => validateCampConversations(change)).toThrow();
    const root = JSON.parse(text);
    root.body.exploration.dialogue = change;
    root.checksum = snapshotChecksum(JSON.stringify(root.body));
    const invalid = JSON.stringify(root);
    expect(() => deserializeCharacter(invalid)).toThrow();
    expect(inspectSnapshots(invalid, text).kind).toBe("recoverable");
  }
}, 15000);

it.each([1, 2, 3, 4])(
  "migrates exploration%i with empty conversations and unchanged expedition/ownership",
  (version) => {
    const world = new WorldSession(),
      session = createInventorySession();
    const original = world.capture(world.travel.state.position, session.loot),
      legacy = structuredClone(original);
    legacy.version = version as 1 | 2 | 3 | 4;
    delete legacy.dialogue;
    delete legacy.quests;
    if (version < 4) delete legacy.expedition;
    if (version < 3) for (const area of legacy.areas) delete area.discovery;
    if (version < 2) delete legacy.containers;
    session.exploration = legacy;
    const text = serializeCharacter(session),
      loaded = deserializeCharacter(text),
      migrated = new WorldSession(loaded.exploration);
    expect(migrated.conversations).toEqual({ version: 1, met: [] });
    expect(migrated.travel.state).toEqual(world.travel.state);
    expect(migrated.expedition).toEqual(world.expedition);
    expect(loaded.character).toEqual(session.character);
    expect(loaded.loot.sequence).toBe(session.loot.sequence);
  },
  15000,
);

import { expect, it } from "vitest";
import { ACT1_FINALE, QUESTS, validateQuestDefinitions } from "./quests";
import { WorldSession } from "./world-session";
import { createInventorySession } from "./inventory-world";
import { snapshotChecksum, inspectSnapshots } from "./inventory-save";
import { CHARACTER_CLASSES } from "./character-classes";
import { createD06CampaignFixture as fixture } from "../../tests/fixtures/d06-campaign";
import { planWorldEncounters } from "./world-encounters";
import { planWorldContainers } from "./world-containers";
import { worldLayout } from "./world-layout";
// D06's three original chapters remain pinned; D08 tests the additive finale.
const story = QUESTS.filter(
  (q) => q.chapter === "act1" && q.id !== ACT1_FINALE,
);
function survey(f: ReturnType<typeof fixture>) {
  f.travel("forest");
  f.defeat();
  f.treasure();
  f.travel("graveyard");
  f.defeat();
  f.treasure();
  f.travel("crypt");
  f.defeat();
  f.world.actors[0]!.controller.walker.position = {
    ...f.session.objectivePosition!,
  };
  expect(f.session.interactExpedition(f.world)).toBe(true);
  f.travel("graveyard");
  f.travel("forest");
  f.travel("camp");
}
it("pins three original linked quests and rejects invalid return NPCs or unreachable interaction definitions", () => {
  expect(story).toHaveLength(3);
  expect(story.map((q) => q.requires)).toEqual([
    [],
    [story[0]!.id],
    [story[1]!.id],
  ]);
  for (const bad of [
    { ...story[0], returnTo: "missing" },
    { ...story[0], chapter: "unknown" },
    {
      ...story[0],
      objectives: [
        {
          kind: "interact",
          target: "treasure:ashen-refuge",
          label: "Invalid camp cache",
          count: 1,
        },
      ],
    },
    {
      ...story[0],
      objectives: [
        {
          kind: "interact",
          target: "crypt-beacon",
          label: "Invalid repeat beacon",
          count: 2,
        },
      ],
    },
  ])
    expect(() => validateQuestDefinitions([bad])).toThrow();
});
it.each(CHARACTER_CLASSES.map((c) => c.id))(
  "fresh %s progression completes the linked route with atomic persistent rewards and no class prerequisite",
  (classId) => {
    const f = fixture(classId);
    expect(f.session.acceptQuest(story[2]!.id)).toBe(false);
    expect(f.session.acceptQuest(story[0]!.id)).toBe(true);
    f.travel("forest");
    f.defeat();
    f.treasure();
    f.travel("camp");
    f.claim(0);
    expect(f.session.acceptQuest(story[1]!.id)).toBe(true);
    f.travel("forest");
    f.travel("graveyard");
    f.defeat();
    f.treasure();
    f.travel("forest");
    f.travel("camp");
    f.claim(1);
    expect(f.session.acceptQuest(story[2]!.id)).toBe(true);
    f.travel("forest");
    f.travel("graveyard");
    f.travel("crypt");
    f.defeat();
    f.world.actors[0]!.controller.walker.position = {
      ...f.session.objectivePosition!,
    };
    expect(f.session.interactExpedition(f.world)).toBe(true);
    expect(f.session.interactExpedition(f.world)).toBe(false);
    f.travel("graveyard");
    f.travel("forest");
    f.travel("camp");
    f.claim(2);
    const before = f.session.quests,
      { loaded } = f.checkpoint();
    expect(f.session.quests).toEqual(before);
    expect(loaded.progression!.skills.classId).toBe(classId);
    expect(loaded.exploration!.expedition).toMatchObject({
      stage: "complete",
      reward: "claimed",
    });
    expect(f.session.quests.entries.map((q) => q.status)).toEqual([
      "claimed",
      "claimed",
      "claimed",
    ]);
    expect(loaded.loot.sequence).toBe(6);
    for (const q of story)
      expect(f.session.acceptQuest(q.id, loaded.loot)).toBe(false);
  },
  25000,
);
it("retains early exploration/cache/beacon facts while enforcing NPC return, prerequisites and no repeated expedition rewards", () => {
  const f = fixture();
  survey(f);
  const xp = f.world.experience.character.totalXp;
  f.checkpoint();
  expect(f.session.acceptQuest(story[1]!.id)).toBe(false);
  expect(f.session.acceptQuest(story[0]!.id, f.inventory.loot)).toBe(true);
  expect(f.session.quests.entries[0]!.status).toBe("ready");
  f.world.actors[0]!.controller.walker.position = { x: -2, y: -2 };
  expect(
    f.session.claimQuest(story[0]!.id, f.world, f.inventory.loot),
  ).toContain("Return to Edda Vey");
  expect(f.world.experience.character.totalXp).toBe(xp);
  for (let i = 0; i < 3; i++) {
    if (i)
      expect(f.session.acceptQuest(story[i]!.id, f.inventory.loot)).toBe(true);
    expect(f.session.quests.entries[i]!.status).toBe("ready");
    f.claim(i);
  }
  expect(f.world.experience.character.totalXp).toBe(xp + 450);
  const { text } = f.checkpoint();
  for (const change of ["cache", "beacon", "identity"]) {
    const root = JSON.parse(text);
    if (change === "cache") root.body.exploration.containers.opened = [];
    if (change === "beacon")
      Object.assign(root.body.exploration.expedition, {
        stage: "outbound",
        reward: "pending",
      });
    if (change === "identity")
      root.body.exploration.quests.entries[0].seen[2] = ["container:50200"];
    root.checksum = snapshotChecksum(JSON.stringify(root.body));
    expect(inspectSnapshots(JSON.stringify(root), text).kind).toBe(
      "recoverable",
    );
  }
}, 25000);
it("preserves an older two-area world and does not offer an unreachable four-area campaign", () => {
  const old = new WorldSession(undefined, 42, 1),
    inventory = createInventorySession();
  const before = old.capture(old.travel.state.position, inventory.loot);
  expect(old.acceptQuest(story[0]!.id)).toBe(false);
  expect(old.capture(old.travel.state.position, inventory.loot)).toEqual(
    before,
  );
  expect(old.acceptQuest("camp-introductions")).toBe(true);
}, 15000);
it("finds two encounters, treasure and valid exits for each quest environment across representative generated seeds", () => {
  for (const seed of [0, 1, 2, 17, 42, 255, 65535, 0xffffffff])
    for (const area of [
      "haunted-forest",
      "forgotten-graveyard",
      "ancient-crypt",
    ] as const) {
      const layout = worldLayout(area, seed, 2);
      expect(planWorldEncounters(layout).length).toBeGreaterThanOrEqual(2);
      if (area !== "ancient-crypt")
        expect(planWorldContainers(layout).length).toBeGreaterThanOrEqual(1);
      expect(layout.exits.map((e) => e.id).sort()).toEqual(
        area === "ancient-crypt"
          ? ["graveyard"]
          : area === "haunted-forest"
            ? ["camp", "graveyard"]
            : ["crypt", "forest"],
      );
    }
}, 15000);

import { expect, it } from "vitest";
import { classicCampaignLayout } from "./classic-act1-layout";
import { WorldSession } from "./world-session";
import { reserveOwned } from "./inventory-world";
import { newCharacter } from "./new-character";
import { createCombat } from "./combat";
import { serializeCharacter, deserializeCharacter } from "./inventory-save";
import { validateExploration } from "./world-save";
import { areaNavigation } from "../world/navigation";
import { travelByWaypoint } from "./world-waypoints";

it.each(["warrior", "sorcerer", "ranger"] as const)(
  "isolates %s candidate saves while preserving actual campaign travel and waypoint state",
  (classId) => {
    const original = newCharacter(classId);
    const originalText = serializeCharacter(original);
    const session = newCharacter(classId);
    const world = new WorldSession(
      undefined,
      42,
      2,
      "ashen-refuge",
      classicCampaignLayout,
    );
    const combat = createCombat();
    combat.actors = [combat.actors[0]!];
    const player = combat.actors[0]!;
    player.controller.walker.position = { ...world.travel.state.position };
    expect(world.acceptQuest("embers-on-the-road")).toBe(true);
    world.attuneWaypoint(world.travel.state.position, true, true, true);
    player.controller.walker.position = {
      ...world.travel.layout.exits[0]!.trigger,
    };
    expect(world.transition(combat, session.loot)).toBe(true);
    expect(world.travel.state.area).toBe("haunted-forest");
    expect(world.travel.layout.map.terrain.width).toBe(54);
    expect(
      world.quests.entries.find((e) => e.id === "embers-on-the-road")!.seen[0],
    ).toEqual(["haunted-forest"]);
    player.controller.walker.position = { ...world.travel.layout.spawn };
    world.attuneWaypoint(player.controller.walker.position, true, true, true);
    session.exploration = world.capture(
      player.controller.walker.position,
      session.loot,
    );
    const nav = {
      ...areaNavigation(world.travel.layout.map),
      layouts: classicCampaignLayout,
    };
    const text = serializeCharacter(session, nav);
    expect(() => deserializeCharacter(text)).toThrow(/fingerprint/);
    expect(() => validateExploration(session.exploration)).toThrow(
      /fingerprint/,
    );
    const restored = deserializeCharacter(text, nav);
    expect(restored).toEqual(reserveOwned(session));
    const destination = travelByWaypoint(
      restored,
      {
        destination: "ashen-refuge",
        expectedArea: "haunted-forest",
        expectedRevision: world.waypoints.revision,
      },
      { alive: true, idle: true, safe: true },
      classicCampaignLayout,
    );
    expect(destination.ok).toBe(true);
    if (!destination.ok) throw Error(destination.reason);
    const parkedText = serializeCharacter(destination.value, nav);
    expect(() => deserializeCharacter(parkedText)).toThrow(/fingerprint/);
    expect(
      new WorldSession(
        deserializeCharacter(parkedText, nav).exploration,
        42,
        2,
        "ashen-refuge",
        classicCampaignLayout,
      ).travel.state.area,
    ).toBe("ashen-refuge");
    expect(serializeCharacter(original)).toBe(originalText);
  },
);

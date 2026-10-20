import { expect, it } from "vitest";
import { createD06Checkpoints } from "../fixtures/d06-campaign";
import { deserializeCharacter } from "../../src/simulation/inventory-save";

// Construct the immutable reference once during module setup. The timed case
// independently rebuilds the campaign and still compares every checkpoint.
const baselineText = JSON.stringify(createD06Checkpoints());

it("constructs replayable campaign checkpoints using actual vulnerable combat and preserves three claims and earned progression", () => {
  const checkpoints = JSON.parse(baselineText) as ReturnType<
    typeof createD06Checkpoints
  >;
  const first = deserializeCharacter(checkpoints.firstClaimed);
  expect(first.progression!.skills.classId).toBe("warrior");
  expect(first.character.equipment.boots?.base).toBe("trail-boots");
  expect(first.progression!.skills.ranks["warrior-arms-foundation"]).toBe(1);
  expect(first.progression!.skills.bar?.[0]).toBe("iron-fan");
  expect(first.exploration!.quests!.entries[0]!.status).toBe("claimed");
  const complete = deserializeCharacter(checkpoints.complete);
  expect(complete.exploration!.visited).toEqual([
    "ashen-refuge",
    "haunted-forest",
    "forgotten-graveyard",
    "ancient-crypt",
  ]);
  expect(complete.exploration!.quests!.entries.map((q) => q.status)).toEqual([
    "claimed",
    "claimed",
    "claimed",
  ]);
  expect(complete.exploration!.expedition).toMatchObject({
    stage: "complete",
    reward: "claimed",
  });
  expect(complete.progression!.character.totalXp).toBeGreaterThanOrEqual(700);
  expect(
    deserializeCharacter(checkpoints.forestNavigation).exploration!.areas.find(
      (area) => area.id === "haunted-forest",
    )!.deaths,
  ).toHaveLength(15);
  const returning = deserializeCharacter(checkpoints.forestReturn);
  expect(returning.exploration!.area).toBe("forgotten-graveyard");
  expect(returning.progression).toEqual(
    deserializeCharacter(checkpoints.forestNavigation).progression,
  );
  expect(checkpoints.provenance.damageEvents).toBeGreaterThan(0);
  expect(checkpoints.provenance.playerDamage).toBeGreaterThan(0);
  expect(createD06Checkpoints()).toEqual(checkpoints);
}, 25000);

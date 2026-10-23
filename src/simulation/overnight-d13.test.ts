import { expect, it } from "vitest";
import { bossPresentation } from "../rendering/boss-presentation";
import { CRYPT_BOSS } from "./crypt-boss";
import { createBoss } from "./boss";
import { createCombat, ARENA_NAV } from "./combat";
function fixture() {
  const world = createCombat(),
    actor = world.actors[1]!,
    home = { ...actor.controller.walker.position },
    state = createBoss(
      actor,
      CRYPT_BOSS,
      { home, center: home, radius: 6 },
      ARENA_NAV,
    );
  return { actor, state };
}
it("boss health and phase presentation is readable without mutating simulation", () => {
  const f = fixture();
  f.actor.hp = 419.5;
  f.state.phase = 1;
  const before = structuredClone(f);
  expect(bossPresentation(CRYPT_BOSS, f.state, f.actor, 100)).toMatchObject({
    health: "420 / 840",
    phase: "Phase 2 · The open vault",
  });
  expect(f).toEqual(before);
});
it("each real warning remains readable during temporary interruption protection and reverts at expiry", () => {
  const f = fixture();
  f.actor.controller.timeline.phase = "windup";
  f.actor.reactionGuardUntil = 200;
  for (const attack of CRYPT_BOSS.attacks) {
    f.state.telegraph = {
      attack: attack.id,
      origin: { x: 0, y: 0 },
      direction: { x: 1, y: 0 },
      shape: attack.shape,
      started: 100,
      strikeAt: 100 + attack.timing.windup,
    };
    expect(bossPresentation(CRYPT_BOSS, f.state, f.actor, 199).warning).toBe(
      `${attack.name} · Resisting interruption`,
    );
    expect(bossPresentation(CRYPT_BOSS, f.state, f.actor, 200).warning).toBe(
      attack.name,
    );
  }
});
it("preparation and terminal completion take precedence over stale warnings", () => {
  const f = fixture();
  f.state.transitionUntil = 150;
  expect(bossPresentation(CRYPT_BOSS, f.state, f.actor, 149).warning).toBe(
    "The stone shifts · prepare",
  );
  expect(bossPresentation(CRYPT_BOSS, f.state, f.actor, 150).warning).toBe("");
  f.state.complete = true;
  expect(bossPresentation(CRYPT_BOSS, f.state, f.actor, 149)).toMatchObject({
    phase: "Encounter complete",
    warning: "The binding is broken.",
  });
});

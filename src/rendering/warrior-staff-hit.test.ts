import { expect, it } from "vitest";
import {
  applyCombatHit,
  ARENA_NAV,
  createCombat,
  stepCombat,
} from "../simulation/combat";
import { commandCombat } from "../simulation/combat-targeting";
import { WarriorMotion, warriorPose, type WarriorPose } from "./warrior-pose";
import { observeStaffHit, type StaffHitView } from "./warrior-staff-hit";

it.each([0, 25, 60])(
  "keeps the held-forward primary entry throughout real guarded recovery %i",
  (bonus) => {
    const world = createCombat(42),
      a = world.actors[0]!,
      b = world.actors[1]!;
    world.hostilesActive = false;
    a.recoveryBonus = bonus;
    b.controller.walker.position = {
      x: a.controller.walker.position.x + 0.5,
      y: a.controller.walker.position.y,
    };
    a.controller = commandCombat(a.controller, {
      kind: "attack",
      target: b.id,
      repeat: false,
    });
    const motion = new WarriorMotion();
    let view: StaffHitView | null = null;
    do {
      stepCombat(world);
      if (a.controller.timeline.phase === "active") break;
      motion.observe(a, world.tick);
      view = observeStaffHit(
        view,
        warriorPose(a, world.tick, null, null, motion),
      );
    } while (world.tick < 30);
    expect(a.controller.timeline.phase).toBe("active");
    applyCombatHit(world, b, a, ARENA_NAV, {
      damage: 5,
      element: "physical",
      guaranteed: true,
      stagger: true,
    });
    const baseline = structuredClone(world);
    while (a.controller.timeline.phase === "hitstun") {
      motion.observe(a, world.tick);
      const pose = warriorPose(a, world.tick, null, null, motion);
      view = observeStaffHit(view, pose);
      expect(view.variant).toBe("extended");
      expect(view.pose).toEqual(pose);
      expect(world).toEqual(baseline);
      stepCombat(world);
      stepCombat(baseline);
    }
    view = observeStaffHit(
      view,
      warriorPose(a, world.tick, null, null, motion),
    );
    expect(view.variant).toBe("guard");
  },
);

it("distinguishes Fan from the raised Oath guard, owns pose history and yields to death", () => {
  for (const [clip, frame, variant] of [
    ["iron-fan", 5, "extended"],
    ["oath-echo", 17, "guard"],
  ] as const) {
    const pose: WarriorPose = { set: "abilities", frame, clip };
    let view = observeStaffHit(null, pose);
    pose.frame = 0;
    view = observeStaffHit(view, { set: "hit", frame: 0, clip: "hit" });
    expect(view.variant).toBe(variant);
    view = observeStaffHit(view, { set: "death", frame: 0, clip: "death" });
    expect(view.variant).toBe("guard");
  }
});

import { expect, it } from "vitest";
import {
  staffTransitionCase,
  STAFF_TRANSITION_STEP_LIMIT,
  staffMovementDeathMatrix,
} from "../../tests/helpers/warrior-staff-transitions";
import {
  observeStaffPresentation,
  staffAttachmentStep,
} from "./warrior-staff-presentation";
import attachments from "../../tests/fixtures/warrior-staff-attachments.json";

it("repairs the forward-weapon teleport with reviewed collapse images without gameplay effects", () => {
  for (const effect of ["hit", "death"] as const) {
    const c = staffTransitionCase("primary", 4, effect);
    expect(c.appliedAt).not.toBeNull();
    const boundary = c.rows.findIndex((r) => r.interrupted);
    expect(
      staffAttachmentStep(
        c.rows[boundary - 1]!.frame,
        { clip: "hit", frame: 0 },
        attachments.frames,
      ),
    ).toBeGreaterThan(1.5);
    if (effect === "death")
      expect(Math.max(...c.rows.map((r) => r.oldStep))).toBeGreaterThan(1.5);
    expect(Math.max(...c.rows.map((r) => r.step))).toBeLessThanOrEqual(
      STAFF_TRANSITION_STEP_LIMIT + 1e-12,
    );
    if (effect === "death") expect(c.deathEvents).toBe(1);
  }
});
it("does not advance a held reaction on repeated draws and preserves the unknown-entry terminal corpse", () => {
  const pose = { set: "death", frame: 15, clip: "death" } as const;
  const first = observeStaffPresentation(null, pose, attachments.frames);
  expect(first.frame).toEqual({ clip: "death", frame: 15 });
  expect(observeStaffPresentation(first, pose, attachments.frames)).toEqual(
    first,
  );
});

it("retains actual idle/walk/run poses, eight facings and a fresh reset without owning movement or a clock", async () => {
  const { createWarriorArena, stepWarriorArena, warriorArenaPose } =
    await import("./warrior-arena-state");
  const seen = new Set<number>(),
    directions = new Set<number>();
  for (const gait of ["walk", "run"] as const)
    for (const [x, y] of [
      [1, 0],
      [1, 1],
      [0, 1],
      [-1, 1],
      [-1, 0],
      [-1, -1],
      [0, -1],
      [1, -1],
    ]) {
      const arena = createWarriorArena();
      arena.world.hostilesActive = false;
      arena.world.actors = arena.world.actors.slice(0, 1);
      arena.world.actors[0]!.controller.walker.gait = gait;
      let view: ReturnType<typeof observeStaffPresentation> | null = null;
      for (let tick = 0; tick < 72; tick++) {
        stepWarriorArena(arena, tick < 48 ? { x: x!, y: y! } : { x: 0, y: 0 });
        const pose = warriorArenaPose(arena),
          before = JSON.stringify(arena);
        view = observeStaffPresentation(view, pose, attachments.frames);
        expect(view.frame).toEqual({ clip: "movement", frame: pose.frame });
        expect(
          observeStaffPresentation(view, pose, attachments.frames),
        ).toEqual(view);
        expect(JSON.stringify(arena)).toBe(before);
        if (tick < 48) {
          seen.add(pose.frame);
          directions.add(arena.world.actors[0]!.controller.walker.direction);
        }
      }
      const fresh = createWarriorArena();
      expect(
        observeStaffPresentation(
          null,
          warriorArenaPose(fresh),
          attachments.frames,
        ).frame,
      ).toEqual({ clip: "movement", frame: 0 });
    }
  expect([...seen].filter((f) => f >= 8 && f < 24)).toHaveLength(16);
  expect([...seen].filter((f) => f >= 24)).toHaveLength(16);
  expect(directions.size).toBe(8);
});

it("preserves every hit-to-death boundary and the real final corpse at all existing recovery breakpoints", () => {
  for (const recovery of [0, 25, 60])
    for (const frame of [0, 1, 2, 3, 4, 5]) {
      const c = staffTransitionCase(
        "primary",
        4,
        "hit",
        0,
        recovery,
        42,
        frame,
      );
      expect(c.killAt).not.toBeNull();
      expect(c.deathEvents).toBe(1);
      expect(Math.max(...c.rows.map((r) => r.step))).toBeLessThanOrEqual(
        STAFF_TRANSITION_STEP_LIMIT + 1e-12,
      );
      expect(c.rows.at(-1)!.frame).toEqual({ clip: "death", frame: 15 });
    }
});

it("retains the complete guarded recoil when the incoming weapon is already at guard", () => {
  const previous = observeStaffPresentation(
    null,
    { set: "movement", clip: "idle", frame: 0 },
    attachments.frames,
  );
  expect(
    observeStaffPresentation(
      previous,
      { set: "hit", clip: "hit", frame: 0 },
      attachments.frames,
    ).frame,
  ).toEqual({ clip: "hit", frame: 0 });
});

it("keeps the guard collapse by default and uses the reviewed forward collapse only when loaded", () => {
  const previous = observeStaffPresentation(
    null,
    { set: "attacks", clip: "primary", frame: 4 },
    attachments.frames,
  );
  const death = { set: "death", clip: "death", frame: 0 } as const;
  expect(
    observeStaffPresentation(previous, death, attachments.frames).frame,
  ).toEqual({ clip: "death", frame: 0 });
  expect(
    observeStaffPresentation(previous, death, attachments.frames, true).frame
      .clip,
  ).toBe("death-forward");
});

it("uses only collapsing death images for every near-forward entry and keeps the exact authoritative pose", () => {
  for (const clip of [
    "primary",
    "iron-fan",
    "oath-echo",
    "hit",
    "hit-extended",
    "movement",
  ]) {
    const count = clip === "movement" ? 40 : clip.startsWith("hit") ? 6 : 12;
    for (let index = 0; index < count; index++) {
      const incoming = {
        set: "attacks",
        clip: "primary",
        frame: index,
      } as const;
      let view = {
        pose: incoming,
        frame: { clip, frame: index },
        entry: null,
      } as ReturnType<typeof observeStaffPresentation>;
      for (let frame = 0; frame < 16; frame++) {
        const next = observeStaffPresentation(
          view,
          { set: "death", clip: "death", frame },
          attachments.frames,
          true,
        );
        expect(next.frame.frame).toBe(frame);
        expect(next.frame.clip).toBe(
          frame < 4 && next.entry ? "death-forward" : "death",
        );
        expect(
          staffAttachmentStep(view.frame, next.frame, attachments.frames),
        ).toBeLessThanOrEqual(STAFF_TRANSITION_STEP_LIMIT + 1e-12);
        expect(
          observeStaffPresentation(next, next.pose, attachments.frames, true),
        ).toEqual(next);
        view = next;
      }
    }
  }
});

it("preserves all movement death entries and final-tick facing changes through actual lethal events", () => {
  const cases = staffMovementDeathMatrix();
  expect(cases).toHaveLength(328);
  for (const gait of ["idle", "walk", "run", "rapid"])
    expect(
      new Set(cases.filter((c) => c.action === gait).map((c) => c.direction))
        .size,
    ).toBe(8);
  for (const c of cases) {
    expect(c.deathEvents).toBe(1);
    expect(Math.max(...c.rows.map((r) => r.step))).toBeLessThanOrEqual(
      STAFF_TRANSITION_STEP_LIMIT + 1e-12,
    );
  }
});

import { commandCombat } from "../../src/simulation/combat-targeting";
import { createCharacterInventory } from "../../src/simulation/equipment";
import { inventoryItem } from "../../src/simulation/inventory-test-helper";
import {
  applyEquipment,
  captureEquipmentBase,
  deriveEquipment,
} from "../../src/simulation/equipment-stats";
import {
  createWarriorArena,
  stepWarriorArena,
  warriorArenaAbility,
  warriorArenaAttack,
  warriorArenaPose,
} from "../../src/rendering/warrior-arena-state";
import {
  observeStaffHit,
  type StaffHitView,
} from "../../src/rendering/warrior-staff-hit";
import {
  observeStaffPresentation,
  staffAttachmentStep,
  staffLogicalFrame,
  type StaffFrame,
  type StaffPresentation,
} from "../../src/rendering/warrior-staff-presentation";
import attachments from "../fixtures/warrior-staff-attachments.json";

export const STAFF_TRANSITION_STEP_LIMIT = Math.max(
  ...[
    ["primary", 12],
    ["iron-fan", 12],
    ["oath-echo", 12],
    ["hit", 6],
    ["hit-extended", 6],
    ["death", 16],
  ].flatMap(([clip, count]) =>
    Array.from({ length: Number(count) - 1 }, (_, frame) =>
      staffAttachmentStep(
        { clip: String(clip), frame },
        { clip: String(clip), frame: frame + 1 },
        attachments.frames,
      ),
    ),
  ),
);

export interface StaffTransitionRow {
  tick: number;
  pose: ReturnType<typeof warriorArenaPose>;
  frame: StaffFrame;
  oldFrame: StaffFrame;
  step: number;
  oldStep: number;
  interrupted: boolean;
}
export function staffTransitionCase(
  action: "primary" | "iron-fan" | "oath-echo",
  targetFrame: number,
  effect: "hit" | "death",
  speed = 0,
  recovery = 0,
  seed = 42,
  killFrame: number | null = null,
): {
  action: string;
  seed: number;
  targetFrame: number;
  effect: string;
  speed: number;
  recovery: number;
  appliedAt: number | null;
  killFrame: number | null;
  killAt: number | null;
  rows: StaffTransitionRow[];
  effects: number;
  deathEvents: number;
} {
  const arena = createWarriorArena();
  arena.world.hostilesActive = false;
  arena.world.seed = seed;
  arena.world.actors = arena.world.actors.slice(0, 2);
  const a = arena.world.actors[0]!,
    b = arena.world.actors[1]!;
  b.controller.walker.position = {
    x: a.controller.walker.position.x + 0.6,
    y: a.controller.walker.position.y,
  };
  b.hp = b.maxHp = 100000;
  // Existing guarded-enemy state isolates the requested incoming strike from Fan recoil.
  b.reactionGuardUntil = 1000;
  const inventory = createCharacterInventory();
  inventory.equipment.main = inventoryItem("cinder-staff");
  applyEquipment(deriveEquipment(inventory, captureEquipmentBase(a)), a);
  a.attackSpeed = speed;
  a.recoveryBonus = recovery;
  arena.skills.users[0]!.castSpeed = speed;
  const baseline = structuredClone(arena);
  let view: StaffPresentation | null = null,
    old: StaffHitView | null = null;
  let previousOld: StaffFrame | null = null,
    appliedAt: number | null = null,
    killAt: number | null = null;
  const rows: StaffTransitionRow[] = [];
  for (let local = 0; local < 100; local++) {
    if (local === 4)
      for (const r of [arena, baseline]) {
        if (action === "primary") warriorArenaAttack(r, "primary");
        else warriorArenaAbility(r, action);
      }
    const incoming = warriorArenaPose(arena);
    const shouldHit =
      appliedAt === null &&
      incoming.clip === action &&
      incoming.frame % 12 === targetFrame;
    const lethalFollowup =
      killFrame !== null &&
      killAt === null &&
      incoming.set === "hit" &&
      incoming.frame === killFrame;
    if (
      lethalFollowup ||
      shouldHit ||
      (effect === "hit" &&
        appliedAt !== null &&
        arena.world.tick === appliedAt + 1)
    ) {
      for (const r of [arena, baseline]) {
        const enemy = r.world.actors[1]!;
        enemy.kind = "hostile";
        enemy.offense = {
          ...enemy.offense,
          accuracy: 1e9,
          damage: effect === "death" || lethalFollowup ? 10000 : 30,
          criticalChance: 0,
        };
        enemy.stagger = 1;
        enemy.controller = commandCombat(enemy.controller, {
          kind: "attack",
          target: 0,
          repeat: false,
        });
        enemy.controller.timeline = {
          ...enemy.controller.timeline,
          phase: "windup",
          remaining: 1,
        };
        enemy.controller.locked = 0;
      }
      if (shouldHit) appliedAt = arena.world.tick;
      if (lethalFollowup) killAt = arena.world.tick;
    }
    stepWarriorArena(arena);
    stepWarriorArena(baseline);
    for (const r of [arena, baseline])
      r.world.actors[1]!.controller = commandCombat(
        r.world.actors[1]!.controller,
        { kind: "stop" },
      );
    const pose = warriorArenaPose(arena);
    const next = observeStaffPresentation(view, pose, attachments.frames, true);
    old = observeStaffHit(old, pose);
    const oldFrame =
      pose.set === "hit"
        ? {
            clip: old.variant === "extended" ? "hit-extended" : "hit",
            frame: pose.frame,
          }
        : staffLogicalFrame(pose);
    rows.push({
      tick: arena.world.tick,
      pose,
      frame: next.frame,
      oldFrame,
      step: view
        ? staffAttachmentStep(view.frame, next.frame, attachments.frames)
        : 0,
      oldStep: previousOld
        ? staffAttachmentStep(previousOld, oldFrame, attachments.frames)
        : 0,
      interrupted: shouldHit,
    });
    view = next;
    previousOld = oldFrame;
    if (JSON.stringify(arena) !== JSON.stringify(baseline))
      throw Error("Staff presentation mutated gameplay");
  }
  const incomingDamage = arena.world.events.filter(
    (e) => e.kind === "damage" && e.target === a.id,
  ).length;
  if (
    appliedAt !== null &&
    (effect === "death" || killFrame !== null ? a.hp > 0 : incomingDamage < 2)
  ) {
    if (seed >= 74)
      throw Error(
        "No deterministic incoming-hit fixture seed " +
          JSON.stringify({
            action,
            targetFrame,
            effect,
            speed,
            recovery,
            incomingDamage,
            events: arena.world.events,
          }),
      );
    return staffTransitionCase(
      action,
      targetFrame,
      effect,
      speed,
      recovery,
      seed + 1,
      killFrame,
    );
  }
  if (appliedAt !== null) {
    if (
      (effect === "death" || killFrame !== null) &&
      (view?.frame.clip !== "death" || view.frame.frame !== 15)
    )
      throw Error("Death did not hold terminal pose");
    if (
      effect === "hit" &&
      arena.world.events.filter(
        (e) => e.kind === "stagger" && e.target === a.id,
      ).length !== 1
    )
      throw Error(
        "Repeated damage restarted stun: " + JSON.stringify(arena.world.events),
      );
  }
  return {
    action,
    seed,
    targetFrame,
    effect,
    speed,
    recovery,
    appliedAt,
    killFrame,
    killAt,
    rows,
    effects: arena.skills.events.filter((e) => e.kind === "effect").length,
    deathEvents: arena.world.events.filter(
      (e) => e.kind === "death" && e.target === a.id,
    ).length,
  };
}
export function staffTransitionMatrix() {
  const cases = [];
  for (const action of ["primary", "iron-fan", "oath-echo"] as const)
    for (const targetFrame of Array.from({ length: 12 }, (_, i) => i))
      for (const effect of ["hit", "death"] as const)
        for (const speed of [0, 25, 60, 100])
          for (const recovery of effect === "hit" ? [0, 25, 60] : [0])
            cases.push(
              staffTransitionCase(action, targetFrame, effect, speed, recovery),
            );
  for (const action of ["primary", "iron-fan", "oath-echo"] as const)
    for (const frame of [3, 4, 5, 7])
      for (const recovery of [0, 25, 60])
        for (const hitFrame of [0, 1, 2, 3, 4, 5])
          cases.push(
            staffTransitionCase(
              action,
              frame,
              "hit",
              0,
              recovery,
              42,
              hitFrame,
            ),
          );
  return cases;
}

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
import { applyCombatHit, ARENA_NAV } from "../../src/simulation/combat";
import { recordMotion } from "../../src/rendering/combat-motion";

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
  direction?: number;
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

/** Real movement/death events, including a final-tick facing change. No storage. */
export function staffMovementDeathMatrix() {
  const cases: ReturnType<typeof staffTransitionCase>[] = [];
  const intents = [
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
    { x: -1, y: 1 },
    { x: -1, y: 0 },
    { x: -1, y: -1 },
    { x: 0, y: -1 },
    { x: 1, y: -1 },
  ];
  for (const intent of intents)
    for (const gait of ["idle", "walk", "run", "rapid"] as const) {
      const living = createWarriorArena();
      living.world.hostilesActive = false;
      living.world.actors = living.world.actors.slice(0, 2);
      const actor = living.world.actors[0]!;
      actor.controller.walker.gait = gait === "run" ? "run" : "walk";
      const inventory = createCharacterInventory();
      inventory.equipment.main = inventoryItem("cinder-staff");
      applyEquipment(
        deriveEquipment(inventory, captureEquipmentBase(actor)),
        actor,
      );
      const seen = new Set<number>();
      if (gait === "idle") stepWarriorArena(living, intent);
      for (let tick = 0; tick < (gait === "idle" ? 192 : 72); tick++) {
        stepWarriorArena(
          living,
          gait === "idle"
            ? { x: 0, y: 0 }
            : gait === "rapid" && tick % 2 === 0
              ? { x: -intent.x, y: -intent.y }
              : intent,
        );
        const incoming = warriorArenaPose(living);
        if (gait !== "rapid" && incoming.clip !== gait) continue;
        if (gait === "rapid" ? tick !== 21 : seen.has(incoming.frame)) continue;
        seen.add(incoming.frame);
        const arena = structuredClone(living),
          baseline = structuredClone(living);
        let view = observeStaffPresentation(
          null,
          incoming,
          attachments.frames,
          true,
        );
        let oldFrame = staffLogicalFrame(incoming);
        const rows: StaffTransitionRow[] = [
          {
            tick: arena.world.tick,
            pose: incoming,
            frame: view.frame,
            oldFrame,
            step: 0,
            oldStep: 0,
            interrupted: false,
          },
        ];
        const appliedAt = arena.world.tick;
        for (const r of [arena, baseline]) {
          stepWarriorArena(r);
          applyCombatHit(
            r.world,
            r.world.actors[1]!,
            r.world.actors[0]!,
            ARENA_NAV,
            { damage: 10000, element: "physical", guaranteed: true },
          );
          recordMotion(r.cues, r.world.actors, r.world.events, r.world.tick);
        }
        const facing = arena.world.actors[0]!.controller.walker.direction,
          position = { ...arena.world.actors[0]!.controller.walker.position };
        for (let tick = 0; tick < 80; tick++) {
          if (tick > 0)
            for (const r of [arena, baseline])
              stepWarriorArena(r, { x: -intent.x, y: -intent.y });
          const pose = warriorArenaPose(arena),
            next = observeStaffPresentation(
              view,
              pose,
              attachments.frames,
              true,
            ),
            old = staffLogicalFrame(pose);
          rows.push({
            tick: arena.world.tick,
            pose,
            frame: next.frame,
            oldFrame: old,
            step: staffAttachmentStep(
              view.frame,
              next.frame,
              attachments.frames,
            ),
            oldStep: staffAttachmentStep(oldFrame, old, attachments.frames),
            interrupted: tick === 0,
          });
          view = next;
          oldFrame = old;
          if (
            JSON.stringify(arena) !== JSON.stringify(baseline) ||
            arena.world.actors[0]!.controller.walker.direction !== facing ||
            JSON.stringify(
              arena.world.actors[0]!.controller.walker.position,
            ) !== JSON.stringify(position)
          )
            throw Error("Movement death changed simulation or corpse facing");
        }
        if (
          rows.at(-1)!.frame.clip !== "death" ||
          rows.at(-1)!.frame.frame !== 15 ||
          new Set(
            rows.filter((r) => r.pose.set === "death").map((r) => r.pose.frame),
          ).size !== 16
        )
          throw Error("Movement death skipped collapse or terminal hold");
        cases.push({
          action: gait,
          direction: facing,
          seed: 42,
          targetFrame: incoming.frame,
          effect: "death",
          speed: 0,
          recovery: 0,
          appliedAt,
          killFrame: null,
          killAt: null,
          rows,
          effects: 0,
          deathEvents: arena.world.events.filter(
            (e) => e.kind === "death" && e.target === 0,
          ).length,
        });
        if (seen.size === (gait === "idle" ? 8 : gait === "rapid" ? 1 : 16))
          break;
      }
      if (seen.size !== (gait === "idle" ? 8 : gait === "rapid" ? 1 : 16))
        throw Error(
          "Missing actual movement entry frames: " +
            JSON.stringify({ gait, intent, seen: [...seen] }),
        );
    }
  return cases;
}

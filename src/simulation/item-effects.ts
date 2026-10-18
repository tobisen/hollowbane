import {
  applyCombatHit,
  enableCombatHitTrace,
  type CombatWorld,
  type CombatActor,
} from "./combat";
import { applyStatus } from "./skill-effects";
import type { SkillRuntime } from "./skills";
import {
  aggregateModifier,
  resolveModifierProcs,
  type ModifierProcState,
  type ModifierEffect,
  type ModifierContext,
} from "./item-modifiers";
export interface ItemCombatEvent {
  sequence: number;
  tick: number;
  actor: number;
  target: number;
  kind: "proc" | "leech";
  modifier: string;
  effect: ModifierEffect;
  amount: number;
  applied: boolean;
}
export interface ItemEffectState {
  processed: number;
  ready: Record<string, ModifierProcState>;
  roots: number;
  procs: number;
  applied: number;
  lifeLeeched: number;
  manaLeeched: number;
  events: ItemCombatEvent[];
}
export function prepareItemEffects(w: CombatWorld): void {
  if (!w.itemEffects && w.actors.some((a) => a.itemRules?.reactive)) {
    enableCombatHitTrace(w);
    w.hitTrace!.pending.length = 0;
    w.itemEffects = {
      processed: w.hitTrace!.next - 1,
      ready: {},
      roots: 0,
      procs: 0,
      applied: 0,
      lifeLeeched: 0,
      manaLeeched: 0,
      events: [],
    };
  }
}
function restore(
  source: CombatActor,
  resource: "life" | "mana",
  amount: number,
  r?: SkillRuntime,
): number {
  if (source.hp <= 0) return 0;
  if (resource === "life") {
    const actual = Math.max(0, Math.min(amount, source.maxHp - source.hp));
    source.hp += actual;
    return actual;
  }
  const user = r?.users.find((u) => u.actor === source.id);
  if (!user) return 0;
  const actual = Math.max(0, Math.min(amount, user.maxMana - user.mana));
  user.mana += actual;
  return actual;
}
function log(s: ItemEffectState, e: ItemCombatEvent) {
  s.events.push(e);
  if (s.events.length > 256) s.events.shift();
}
/** Fixed-tick interpreter; no input commands, new casts or recursive effect roots. */
export function resolveItemEffects(
  w: CombatWorld,
  nav: Parameters<typeof applyCombatHit>[3],
  r?: SkillRuntime,
): void {
  const state = w.itemEffects,
    trace = w.hitTrace;
  if (!state || !trace) return;
  const roots = trace.pending.splice(0);
  const random = () => {
    w.seed = (Math.imul(w.seed, 1664525) + 1013904223) >>> 0;
    return w.seed / 4294967296;
  };
  for (const hit of roots) {
    if (hit.sequence <= state.processed) continue;
    state.processed = hit.sequence;
    if (
      !["weapon", "skill"].includes(hit.origin) ||
      hit.damage <= 0 ||
      hit.actor === hit.target
    )
      continue;
    const source = w.actors.find((a) => a.id === hit.actor),
      target = w.actors.find((a) => a.id === hit.target);
    if (!source?.itemRules?.reactive || source.hp <= 0 || !target) continue;
    state.roots++;
    const modifiers = source.itemRules.modifiers,
      context: ModifierContext = {
        healthFraction: hit.sourceHealthFraction,
        targetStatuses: hit.targetStatuses,
        element: hit.element,
        weapon: hit.weapon,
      };
    if (
      hit.origin === "weapon" &&
      hit.element === "physical" &&
      target.leechable !== false
    ) {
      for (const resource of ["life", "mana"] as const) {
        const percent = aggregateModifier(
          `${resource}Leech`,
          0,
          modifiers,
          context,
          { min: 0, max: 30 },
        );
        if (percent <= 0) continue;
        const amount = restore(
          source,
          resource,
          (hit.damage * percent) / 100,
          r,
        );
        if (resource === "life") state.lifeLeeched += amount;
        else state.manaLeeched += amount;
        log(state, {
          sequence: hit.sequence,
          tick: hit.tick,
          actor: hit.actor,
          target: hit.actor,
          kind: "leech",
          modifier: `${resource}-leech`,
          effect: { kind: "restore", resource, amount },
          amount,
          applied: amount > 0,
        });
      }
    }
    for (const kind of hit.killed
      ? (["hit", "kill"] as const)
      : (["hit"] as const)) {
      const result = resolveModifierProcs(
        modifiers,
        {
          kind,
          tick: hit.tick,
          actor: hit.actor,
          target: hit.target,
          damage: hit.damage,
          direct: true,
          weapon: hit.origin === "weapon",
          triggered: false,
          context,
        },
        state.ready[String(hit.actor)] ?? { ready: {} },
        random,
      );
      state.ready[String(hit.actor)] = result.state;
      for (const e of result.events) {
        state.procs++;
        let amount = 0,
          applied = false;
        if (e.effect.kind === "restore") {
          amount = restore(source, e.effect.resource, e.effect.amount, r);
          applied = amount > 0;
        } else if (e.effect.kind === "damage") {
          const before = target.hp;
          applyCombatHit(w, source, target, nav, {
            damage: e.effect.amount,
            element: e.effect.element,
            guaranteed: true,
            origin: "proc",
            scalePower: false,
          });
          amount = before - target.hp;
          applied = amount > 0;
          // The original roots were extracted above. Triggered hits never re-enter the root interpreter.
          const triggered = trace.pending.splice(0);
          if (triggered.some((h) => h.origin !== "proc"))
            throw Error("Unexpected recursive item root");
        } else if (r) {
          const status = e.effect;
          const template = r.definitions.find(
            (s) => s.kind === "active" && s.status?.kind === status.status,
          );
          if (template?.kind === "active")
            applied = applyStatus(
              r,
              {
                ...template,
                status: {
                  kind: status.status,
                  magnitude: status.magnitude,
                  duration: status.duration,
                  interval: 30,
                  stacking: "strongest",
                },
              },
              source,
              target,
              true,
            );
        }
        if (applied) state.applied++;
        log(state, {
          sequence: hit.sequence,
          tick: hit.tick,
          actor: hit.actor,
          target: e.target,
          kind: "proc",
          modifier: e.modifier,
          effect: { ...e.effect },
          amount,
          applied,
        });
      }
    }
  }
  const alive = new Set(w.actors.map((a) => String(a.id)));
  for (const actor of Object.keys(state.ready)) {
    if (!alive.has(actor)) {
      delete state.ready[actor];
      continue;
    }
    state.ready[actor] = {
      ready: Object.fromEntries(
        Object.entries(state.ready[actor]!.ready).filter(
          ([, tick]) => tick > w.tick,
        ),
      ),
    };
  }
}

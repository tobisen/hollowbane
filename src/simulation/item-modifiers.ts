import { ELEMENTS, type Element } from "./skill-content";
export const MODIFIER_STATS = [
  "damage",
  "armor",
  "accuracy",
  "life",
  "mana",
  "attackSpeed",
  "castSpeed",
  "hitRecovery",
  "fireResistance",
  "coldResistance",
  "lightningResistance",
  "poisonResistance",
  "physicalResistance",
  "arcaneResistance",
  "lifeLeech",
  "manaLeech",
  "dotBonus",
] as const;
export type ModifierStat = (typeof MODIFIER_STATS)[number] | `skill.${string}`;
export type ModifierCondition =
  | { kind: "always" }
  | { kind: "health-below"; fraction: number }
  | { kind: "target-status"; status: "slow" | "poison" | "power" }
  | { kind: "element"; element: Element }
  | { kind: "weapon"; weapon: "melee" | "projectile" };
export interface ModifierContext {
  healthFraction: number;
  targetStatuses: readonly string[];
  element: Element;
  weapon: "melee" | "projectile";
}
interface Identity {
  id: string;
  source: string;
  condition: ModifierCondition;
}
export interface StatModifier extends Identity {
  kind: "stat";
  stat: ModifierStat;
  operation: "add" | "increase" | "multiply";
  value: number;
  group: string;
  stacking: "sum" | "strongest";
  priority: number;
}
export type ModifierEffect =
  | { kind: "damage"; element: Element; amount: number }
  | { kind: "restore"; resource: "life" | "mana"; amount: number }
  | {
      kind: "status";
      status: "slow" | "poison" | "power";
      magnitude: number;
      duration: number;
    };
export interface ProcModifier extends Identity {
  kind: "proc";
  event: "hit" | "kill";
  eligibility: "weapon" | "direct";
  chanceBasisPoints: number;
  cooldownTicks: number;
  effect: ModifierEffect;
}
export type ItemModifier = StatModifier | ProcModifier;
export interface ModifierBounds {
  min: number;
  max: number;
}
const elements: readonly string[] = ELEMENTS;
const statuses = ["slow", "poison", "power"];
const number = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
function object(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw Error("Expected modifier object");
  return v as Record<string, unknown>;
}
function fields(v: Record<string, unknown>, names: string[]) {
  if (JSON.stringify(Object.keys(v).sort()) !== JSON.stringify(names.sort()))
    throw Error("Unknown modifier fields");
}
const id = (v: unknown): v is string =>
  typeof v === "string" && /^[a-z0-9][a-z0-9._:-]{0,95}$/.test(v);
function condition(value: unknown): asserts value is ModifierCondition {
  const v = object(value);
  if (v.kind === "always") fields(v, ["kind"]);
  else if (v.kind === "health-below" && number(v.fraction, 0, 1))
    fields(v, ["kind", "fraction"]);
  else if (v.kind === "target-status" && statuses.includes(String(v.status)))
    fields(v, ["kind", "status"]);
  else if (v.kind === "element" && elements.includes(String(v.element)))
    fields(v, ["kind", "element"]);
  else if (
    v.kind === "weapon" &&
    ["melee", "projectile"].includes(String(v.weapon))
  )
    fields(v, ["kind", "weapon"]);
  else throw Error("Invalid modifier condition");
}
function effect(value: unknown): asserts value is ModifierEffect {
  const v = object(value);
  if (
    v.kind === "damage" &&
    elements.includes(String(v.element)) &&
    number(v.amount, 0, 10000)
  )
    fields(v, ["kind", "element", "amount"]);
  else if (
    v.kind === "restore" &&
    ["life", "mana"].includes(String(v.resource)) &&
    number(v.amount, 0, 10000)
  )
    fields(v, ["kind", "resource", "amount"]);
  else if (
    v.kind === "status" &&
    statuses.includes(String(v.status)) &&
    number(v.magnitude, 0, 10000) &&
    Number.isInteger(v.duration) &&
    number(v.duration, 1, 36000)
  ) {
    fields(v, ["kind", "status", "magnitude", "duration"]);
    if (v.status === "slow" && (v.magnitude as number) > 0.9)
      throw Error("Excessive slow magnitude");
  } else throw Error("Invalid modifier effect");
}
export function validateModifier(value: unknown): ItemModifier {
  const v = object(value);
  if (!id(v.id) || !id(v.source)) throw Error("Invalid modifier identity");
  condition(v.condition);
  if (v.kind === "stat") {
    fields(v, [
      "id",
      "source",
      "condition",
      "kind",
      "stat",
      "operation",
      "value",
      "group",
      "stacking",
      "priority",
    ]);
    if (
      !(
        MODIFIER_STATS.includes(v.stat as (typeof MODIFIER_STATS)[number]) ||
        (typeof v.stat === "string" &&
          /^skill\.[a-z][a-z0-9-]{0,47}$/.test(v.stat))
      ) ||
      !id(v.group) ||
      !["sum", "strongest"].includes(String(v.stacking)) ||
      !Number.isInteger(v.priority) ||
      !number(v.priority, -1000, 1000)
    )
      throw Error("Invalid stat modifier");
    const bounds =
      v.operation === "add"
        ? [-10000, 10000]
        : v.operation === "increase"
          ? [-0.9, 10]
          : v.operation === "multiply"
            ? [0, 4]
            : null;
    if (!bounds || !number(v.value, bounds[0]!, bounds[1]!))
      throw Error("Invalid modifier operation/value");
  } else if (v.kind === "proc") {
    fields(v, [
      "id",
      "source",
      "condition",
      "kind",
      "event",
      "eligibility",
      "chanceBasisPoints",
      "cooldownTicks",
      "effect",
    ]);
    if (
      !["hit", "kill"].includes(String(v.event)) ||
      !["weapon", "direct"].includes(String(v.eligibility)) ||
      !Number.isInteger(v.chanceBasisPoints) ||
      !number(v.chanceBasisPoints, 0, 10000) ||
      !Number.isInteger(v.cooldownTicks) ||
      !number(v.cooldownTicks, 0, 36000)
    )
      throw Error("Invalid proc modifier");
    effect(v.effect);
  } else throw Error("Unknown modifier kind");
  return value as ItemModifier;
}
export function validateModifiers(values: readonly ItemModifier[]): void {
  if (values.length > 256) throw Error("Modifier capacity exceeded");
  const keys = new Set<string>();
  const policies = new Map<string, StatModifier["stacking"]>();
  for (const m of values) {
    validateModifier(m);
    const k = modifierKey(m);
    if (keys.has(k)) throw Error("Duplicate modifier identity");
    keys.add(k);
    if (m.kind === "stat") {
      const group = `${m.stat}/${m.operation}/${m.group}`;
      if (policies.has(group) && policies.get(group) !== m.stacking)
        throw Error("Conflicting group stacking policy");
      policies.set(group, m.stacking);
    }
  }
}
export const modifierKey = (m: Pick<ItemModifier, "source" | "id">): string =>
  `${m.source}/${m.id}`;
const compare = (a: ItemModifier, b: ItemModifier) => {
  const x = modifierKey(a),
    y = modifierKey(b);
  return x < y ? -1 : x > y ? 1 : 0;
};
export function modifierApplies(
  c: ModifierCondition,
  context: ModifierContext,
): boolean {
  switch (c.kind) {
    case "always":
      return true;
    case "health-below":
      return context.healthFraction < c.fraction;
    case "target-status":
      return context.targetStatuses.includes(c.status);
    case "element":
      return context.element === c.element;
    case "weapon":
      return context.weapon === c.weapon;
  }
}
/** Validated content boundary required. Order: (base + additions) * (1 + increases) * bounded product. */
export function aggregateModifier(
  stat: ModifierStat,
  base: number,
  modifiers: readonly ItemModifier[],
  context: ModifierContext,
  bounds: ModifierBounds,
): number {
  if (
    ![base, bounds.min, bounds.max, context.healthFraction].every(
      Number.isFinite,
    ) ||
    bounds.min > bounds.max ||
    context.healthFraction < 0 ||
    context.healthFraction > 1
  )
    throw Error("Invalid modifier evaluation");
  const groups = new Map<string, StatModifier[]>();
  for (const m of [...modifiers].sort(compare))
    if (
      m.kind === "stat" &&
      m.stat === stat &&
      modifierApplies(m.condition, context)
    ) {
      const key = `${m.operation}/${m.group}`,
        group = groups.get(key) ?? [];
      if (group[0] && group[0].stacking !== m.stacking)
        throw Error("Conflicting group stacking policy");
      group.push(m);
      groups.set(key, group);
    }
  let add = 0,
    increase = 0,
    multiply = 1;
  for (const group of groups.values()) {
    const selected =
      group[0]!.stacking === "sum"
        ? group
        : [...group]
            .sort(
              (a, b) =>
                b.priority - a.priority ||
                Math.abs(b.value) - Math.abs(a.value) ||
                compare(a, b),
            )
            .slice(0, 1);
    for (const m of selected) {
      if (m.operation === "add") add += m.value;
      else if (m.operation === "increase") increase += m.value;
      else multiply *= m.value;
    }
  }
  const result =
    (base + add) * Math.max(0, 1 + increase) * Math.min(16, multiply);
  return Math.max(bounds.min, Math.min(bounds.max, result));
}
export interface ModifierRootEvent {
  kind: "hit" | "kill";
  tick: number;
  actor: number;
  target: number;
  damage: number;
  direct: boolean;
  weapon: boolean;
  triggered: boolean;
  context: ModifierContext;
}
export interface ModifierProcState {
  ready: Readonly<Record<string, number>>;
}
export interface ModifierEffectEvent {
  modifier: string;
  actor: number;
  target: number;
  tick: number;
  triggered: true;
  effect: ModifierEffect;
}
/** Caller de-duplicates root combat events. Triggered/DoT events never proc or leech. */
export function resolveModifierProcs(
  modifiers: readonly ItemModifier[],
  root: ModifierRootEvent,
  state: ModifierProcState,
  random: () => number,
): { state: ModifierProcState; events: ModifierEffectEvent[] } {
  if (
    !Number.isSafeInteger(root.tick) ||
    root.tick < 0 ||
    root.tick > Number.MAX_SAFE_INTEGER - 36000 ||
    !Number.isFinite(root.damage) ||
    root.damage < 0
  )
    throw Error("Invalid root event");
  if (root.triggered || !root.direct || root.damage <= 0)
    return { state, events: [] };
  const ready = { ...state.ready },
    events: ModifierEffectEvent[] = [];
  for (const m of [...modifiers].sort(compare))
    if (
      m.kind === "proc" &&
      m.event === root.kind &&
      (m.eligibility !== "weapon" || root.weapon) &&
      modifierApplies(m.condition, root.context) &&
      root.tick >= (ready[modifierKey(m)] ?? 0)
    ) {
      const roll = random();
      if (!number(roll, 0, 1) || roll === 1) throw Error("Invalid proc RNG");
      if (roll * 10000 < m.chanceBasisPoints) {
        ready[modifierKey(m)] = root.tick + m.cooldownTicks;
        events.push({
          modifier: modifierKey(m),
          actor: root.actor,
          target: m.effect.kind === "restore" ? root.actor : root.target,
          tick: root.tick,
          triggered: true,
          effect: { ...m.effect },
        });
      }
    }
  return { state: { ready }, events };
}

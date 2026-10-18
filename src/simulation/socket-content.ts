import {
  validateModifier,
  type StatModifier,
  type ProcModifier,
  type ItemModifier,
} from "./item-modifiers";
export const SOCKET_KINDS = ["weapon", "armor", "shield"] as const;
export type SocketKind = (typeof SOCKET_KINDS)[number];
export type ComponentModifier =
  Omit<StatModifier, "source"> | Omit<ProcModifier, "source">;
export interface GemDefinition {
  id: string;
  name: string;
  element: "fire" | "cold" | "lightning" | "poison";
  grade: 1 | 2 | 3;
  level: number;
  weight: number;
  effects: Record<SocketKind, ComponentModifier[]>;
}
export interface SocketCatalog {
  schema: 1;
  hosts: Record<string, { limit: number; kind: SocketKind }>;
  gems: GemDefinition[];
}
const gems: GemDefinition[] = [];
for (const [element, name] of [
  ["fire", "Coalglass"],
  ["cold", "Hoarfleck"],
  ["lightning", "Rainshard"],
  ["poison", "Mirestone"],
] as const)
  for (const grade of [1, 2, 3] as const) {
    const resistance = (value: number): ComponentModifier => ({
      kind: "stat",
      id: `gem-${element}`,
      condition: { kind: "always" },
      stat: `${element}Resistance`,
      operation: "add",
      value,
      group: `gem-${element}`,
      stacking: "sum",
      priority: 0,
    });
    gems.push({
      id: `${element}-gem-${grade}`,
      name: `${["Rough", "Clear", "Pristine"][grade - 1]} ${name}`,
      element,
      grade,
      level: [1, 8, 16][grade - 1]!,
      weight: [16, 4, 1][grade - 1]!,
      effects: {
        weapon: [
          {
            kind: "proc",
            id: `gem-${element}`,
            condition: { kind: "always" },
            event: "hit",
            eligibility: "weapon",
            chanceBasisPoints: 10000,
            cooldownTicks: 0,
            effect: { kind: "damage", element, amount: [2, 4, 7][grade - 1]! },
          },
        ],
        armor: [resistance([4, 7, 11][grade - 1]!)],
        shield: [resistance([6, 10, 15][grade - 1]!)],
      },
    });
  }
export const SOCKET_CONTENT: SocketCatalog = {
  schema: 1,
  hosts: {
    "ash-blade": { limit: 3, kind: "weapon" },
    "reed-bow": { limit: 4, kind: "weapon" },
    "cinder-staff": { limit: 3, kind: "weapon" },
    "woven-coat": { limit: 4, kind: "armor" },
    "iron-cap": { limit: 2, kind: "armor" },
    "bark-guard": { limit: 3, kind: "shield" },
  },
  gems,
};
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const exact = (v: Record<string, unknown>, keys: string[]) =>
  Object.keys(v).sort().join(",") === keys.sort().join(",");
export function validateSocketCatalog(value: unknown): SocketCatalog {
  if (
    !object(value) ||
    !exact(value, ["schema", "hosts", "gems"]) ||
    value.schema !== 1 ||
    !object(value.hosts) ||
    !Array.isArray(value.gems) ||
    value.gems.length < 1 ||
    value.gems.length > 128
  )
    throw Error("Invalid socket catalog");
  for (const [base, host] of Object.entries(value.hosts))
    if (
      !/^[a-z][a-z0-9-]{0,47}$/.test(base) ||
      !object(host) ||
      !exact(host, ["limit", "kind"]) ||
      !Number.isInteger(host.limit) ||
      Number(host.limit) < 1 ||
      Number(host.limit) > 6 ||
      !SOCKET_KINDS.includes(host.kind as SocketKind)
    )
      throw Error("Invalid socket host");
  const ids = new Set<string>();
  for (const raw of value.gems as unknown[]) {
    if (
      !object(raw) ||
      !exact(raw, [
        "id",
        "name",
        "element",
        "grade",
        "level",
        "weight",
        "effects",
      ]) ||
      typeof raw.id !== "string" ||
      !/^[a-z][a-z0-9-]{0,47}$/.test(raw.id) ||
      ids.has(raw.id) ||
      typeof raw.name !== "string" ||
      raw.name.length < 1 ||
      raw.name.length > 64 ||
      /[<>]/.test(raw.name) ||
      !["fire", "cold", "lightning", "poison"].includes(String(raw.element)) ||
      ![1, 2, 3].includes(Number(raw.grade)) ||
      !Number.isInteger(raw.grade) ||
      !Number.isInteger(raw.level) ||
      Number(raw.level) < 1 ||
      Number(raw.level) > 99 ||
      !Number.isSafeInteger(raw.weight) ||
      Number(raw.weight) < 1 ||
      Number(raw.weight) > 10000 ||
      !object(raw.effects) ||
      !exact(raw.effects, [...SOCKET_KINDS])
    )
      throw Error("Invalid gem definition");
    ids.add(raw.id);
    for (const kind of SOCKET_KINDS) {
      const effects = raw.effects[kind];
      if (!Array.isArray(effects) || effects.length < 1 || effects.length > 8)
        throw Error("Invalid gem effects");
      const modifierIds = new Set<string>();
      for (const m of effects as unknown[]) {
        if (!object(m) || "source" in m || modifierIds.has(String(m.id)))
          throw Error("Invalid component modifier");
        validateModifier({ ...m, source: "component-validation" });
        modifierIds.add(String(m.id));
      }
    }
  }
  return structuredClone(value) as unknown as SocketCatalog;
}
export function gemModifiers(
  id: string,
  kind: SocketKind,
  source: string,
  catalog = SOCKET_CONTENT,
): ItemModifier[] {
  const gem = catalog.gems.find((g) => g.id === id);
  if (!gem) throw Error("Unknown gem");
  return gem.effects[kind].map((m) =>
    validateModifier({ ...structuredClone(m), source }),
  );
}
validateSocketCatalog(SOCKET_CONTENT);

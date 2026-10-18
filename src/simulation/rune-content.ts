import {
  SOCKET_CONTENT,
  SOCKET_KINDS,
  type ComponentModifier,
  type SocketKind,
} from "./socket-content";
import {
  validateModifiers,
  type ModifierStat,
  type StatModifier,
} from "./item-modifiers";
import type { Quality } from "./item-content";
export interface RuneDefinition {
  id: string;
  name: string;
  level: number;
  weight: number;
  effects: Record<SocketKind, ComponentModifier[]>;
}
export interface RuneRecipe {
  id: string;
  name: string;
  level: number;
  bases: string[];
  qualities: Quality[];
  sequence: string[];
  modifiers: ComponentModifier[];
}
export interface RuneCatalog {
  schema: 1;
  components: RuneDefinition[];
  recipes: RuneRecipe[];
}
function m(
  id: string,
  stat: ModifierStat,
  value: number,
  operation: StatModifier["operation"] = "add",
): ComponentModifier {
  return {
    kind: "stat",
    id,
    stat,
    value,
    operation,
    condition: { kind: "always" },
    group: id,
    stacking: "sum",
    priority: 0,
  };
}
const specs: [
  string,
  number,
  number,
  ComponentModifier,
  ComponentModifier,
  ComponentModifier,
][] = [
  [
    "aevin",
    1,
    32,
    m("sigil-aim", "accuracy", 3),
    m("sigil-plate", "armor", 2),
    m("sigil-plate", "armor", 3),
  ],
  [
    "brask",
    2,
    28,
    m("sigil-ember", "damage", 2),
    m("sigil-fire", "fireResistance", 4),
    m("sigil-fire", "fireResistance", 6),
  ],
  [
    "cyrrel",
    4,
    24,
    m("sigil-well", "mana", 3),
    m("sigil-well", "mana", 5),
    m("sigil-well", "mana", 4),
  ],
  [
    "doveth",
    6,
    20,
    m("sigil-cold", "coldResistance", 4),
    m("sigil-cold", "coldResistance", 6),
    m("sigil-cold", "coldResistance", 8),
  ],
  [
    "eshra",
    8,
    16,
    m("sigil-quick", "attackSpeed", 2),
    m("sigil-cast", "castSpeed", 2),
    m("sigil-recover", "hitRecovery", 3),
  ],
  [
    "faelor",
    10,
    12,
    m("sigil-storm", "lightningResistance", 5),
    m("sigil-storm", "lightningResistance", 7),
    m("sigil-storm", "lightningResistance", 9),
  ],
  [
    "gannic",
    12,
    9,
    m("sigil-life", "life", 4),
    m("sigil-life", "life", 7),
    m("sigil-life", "life", 6),
  ],
  [
    "halvek",
    16,
    7,
    m("sigil-plate", "armor", 4),
    m("sigil-plate", "armor", 6),
    m("sigil-plate", "armor", 8),
  ],
  [
    "isren",
    20,
    5,
    m("sigil-mana-leech", "manaLeech", 1),
    m("sigil-well", "mana", 6),
    m("sigil-well", "mana", 5),
  ],
  [
    "jorath",
    24,
    3,
    m("sigil-life-leech", "lifeLeech", 1),
    m("sigil-life", "life", 9),
    m("sigil-life", "life", 8),
  ],
  [
    "kessil",
    28,
    2,
    m("sigil-briar", "dotBonus", 5),
    m("sigil-poison", "poisonResistance", 6),
    m("sigil-poison", "poisonResistance", 8),
  ],
  [
    "lyrvek",
    32,
    1,
    m("sigil-cast", "castSpeed", 5),
    m("sigil-well", "mana", 8),
    m("sigil-well", "mana", 9),
  ],
];
function recipe(
  id: string,
  name: string,
  level: number,
  bases: string[],
  sequence: string[],
  modifiers: ComponentModifier[],
): RuneRecipe {
  return {
    id,
    name,
    level,
    bases,
    sequence: sequence.map((id) => `sigil-${id}`),
    qualities: ["normal"],
    modifiers,
  };
}
export const RUNE_CONTENT: RuneCatalog = {
  schema: 1,
  components: specs.map(([id, level, weight, weapon, armor, shield]) => ({
    id: `sigil-${id}`,
    name: `${id[0]!.toUpperCase() + id.slice(1)} Sigil`,
    level,
    weight,
    effects: { weapon: [weapon], armor: [armor], shield: [shield] },
  })),
  recipes: [
    recipe(
      "cinder-covenant",
      "Cinder Covenant",
      2,
      ["ash-blade"],
      ["aevin", "brask"],
      [m("pact-edge", "damage", 5), m("pact-heat", "fireResistance", -5)],
    ),
    recipe(
      "rime-passage",
      "Rime Passage",
      6,
      ["woven-coat", "iron-cap", "bark-guard"],
      ["doveth", "cyrrel"],
      [
        m("passage-cold", "coldResistance", 15),
        m("passage-speed", "attackSpeed", -4),
      ],
    ),
    recipe(
      "stormwake",
      "Stormwake",
      8,
      ["reed-bow", "cinder-staff"],
      ["eshra", "cyrrel", "aevin"],
      [
        m("wake-cast", "castSpeed", 12),
        m("wake-edge", "damage", -0.08, "increase"),
      ],
    ),
    recipe(
      "briar-vigil",
      "Briar Vigil",
      28,
      ["ash-blade", "reed-bow"],
      ["kessil", "gannic", "brask"],
      [m("vigil-dot", "dotBonus", 25), m("vigil-well", "mana", -8)],
    ),
    recipe(
      "hollow-accord",
      "Hollow Accord",
      20,
      ["woven-coat"],
      ["aevin", "halvek", "eshra", "isren"],
      [
        m("accord-life", "life", 20),
        m("accord-mana", "mana", 20),
        m("accord-plate", "armor", -0.1, "increase"),
      ],
    ),
    recipe(
      "stoneward",
      "Stoneward",
      16,
      ["bark-guard"],
      ["halvek", "gannic", "doveth"],
      [
        m("ward-plate", "armor", 18),
        m("ward-recover", "hitRecovery", 10),
        m("ward-speed", "attackSpeed", -6),
      ],
    ),
    recipe(
      "dusk-circuit",
      "Dusk Circuit",
      32,
      ["cinder-staff"],
      ["isren", "lyrvek", "cyrrel"],
      [
        {
          kind: "proc",
          id: "circuit-well",
          condition: { kind: "always" },
          event: "kill",
          eligibility: "direct",
          chanceBasisPoints: 10000,
          cooldownTicks: 60,
          effect: { kind: "restore", resource: "mana", amount: 8 },
        },
        m("circuit-leech", "manaLeech", 1),
        m("circuit-recover", "hitRecovery", -8),
      ],
    ),
    recipe(
      "lastlight-vow",
      "Lastlight Vow",
      32,
      ["reed-bow"],
      ["jorath", "kessil", "lyrvek", "faelor"],
      [
        {
          kind: "proc",
          id: "lastlight-storm",
          condition: { kind: "always" },
          event: "hit",
          eligibility: "weapon",
          chanceBasisPoints: 1500,
          cooldownTicks: 90,
          effect: { kind: "damage", element: "lightning", amount: 18 },
        },
        m("lastlight-thread", "skill.storm-thread", 1),
        m("lastlight-fire", "fireResistance", -12),
      ],
    ),
  ],
};
const obj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const exact = (v: Record<string, unknown>, keys: string[]) =>
  Object.keys(v).sort().join(",") === keys.sort().join(",");
function identity(v: Record<string, unknown>, ids: Set<string>) {
  if (
    typeof v.id !== "string" ||
    !/^[a-z][a-z0-9-]{0,47}$/.test(v.id) ||
    ids.has(v.id) ||
    typeof v.name !== "string" ||
    v.name.length < 1 ||
    v.name.length > 64 ||
    /[<>]/.test(v.name) ||
    [...v.name].some((c) => c.charCodeAt(0) < 32) ||
    !Number.isInteger(v.level) ||
    Number(v.level) < 1 ||
    Number(v.level) > 99
  )
    throw Error("Invalid rune identity");
  ids.add(v.id);
}
function modifiers(v: unknown) {
  if (
    !Array.isArray(v) ||
    !v.length ||
    v.length > 8 ||
    v.some((m: unknown) => !obj(m) || "source" in m)
  )
    throw Error("Invalid rune modifiers");
  validateModifiers(
    v.map((m: ComponentModifier) => ({ ...m, source: "rune-validation" })),
  );
}
export function validateRuneCatalog(value: unknown): RuneCatalog {
  if (
    !obj(value) ||
    !exact(value, ["schema", "components", "recipes"]) ||
    value.schema !== 1 ||
    !Array.isArray(value.components) ||
    !Array.isArray(value.recipes) ||
    !value.components.length ||
    value.components.length > 128 ||
    !value.recipes.length ||
    value.recipes.length > 128
  )
    throw Error("Invalid rune catalog");
  const ids = new Set<string>();
  for (const c of value.components as unknown[]) {
    if (!obj(c) || !exact(c, ["id", "name", "level", "weight", "effects"]))
      throw Error("Invalid rune component");
    identity(c, ids);
    if (
      !Number.isSafeInteger(c.weight) ||
      Number(c.weight) < 1 ||
      Number(c.weight) > 10000 ||
      !obj(c.effects) ||
      !exact(c.effects, [...SOCKET_KINDS])
    )
      throw Error("Invalid rune effects");
    for (const kind of SOCKET_KINDS) modifiers(c.effects[kind]);
  }
  const components = value.components as RuneDefinition[],
    previous: RuneRecipe[] = [];
  for (const raw of value.recipes as unknown[]) {
    if (
      !obj(raw) ||
      !exact(raw, [
        "id",
        "name",
        "level",
        "bases",
        "qualities",
        "sequence",
        "modifiers",
      ])
    )
      throw Error("Invalid rune recipe");
    identity(raw, ids);
    const r = raw as unknown as RuneRecipe;
    if (
      !Array.isArray(r.sequence) ||
      r.sequence.length < 2 ||
      r.sequence.length > 6 ||
      r.sequence.some(
        (id) => !components.some((c) => c.id === id && c.level <= r.level),
      ) ||
      !Array.isArray(r.bases) ||
      !r.bases.length ||
      r.bases.length > 16 ||
      new Set(r.bases).size !== r.bases.length ||
      r.bases.some(
        (b) =>
          !SOCKET_CONTENT.hosts[b] ||
          SOCKET_CONTENT.hosts[b]!.limit < r.sequence.length,
      ) ||
      !Array.isArray(r.qualities) ||
      !r.qualities.length ||
      r.qualities.length > 3 ||
      new Set(r.qualities).size !== r.qualities.length ||
      r.qualities.some((q) => !["normal", "magic", "rare"].includes(q))
    )
      throw Error("Impossible rune recipe");
    if (
      previous.some(
        (p) =>
          p.sequence.join(",") === r.sequence.join(",") &&
          p.bases.some((b) => r.bases.includes(b)) &&
          p.qualities.some((q) => r.qualities.includes(q)),
      )
    )
      throw Error("Ambiguous rune recipes");
    modifiers(r.modifiers);
    previous.push(r);
  }
  return structuredClone(value) as unknown as RuneCatalog;
}
validateRuneCatalog(RUNE_CONTENT);

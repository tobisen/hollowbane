import { equipmentDefinition, type EquipSlot } from "./equipment-content";
import { EQUIPMENT_CONTENT } from "./item-content";
import {
  validateModifier,
  validateModifiers,
  type ItemModifier,
  type StatModifier,
  type ProcModifier,
  type ModifierStat,
  type ModifierCondition,
} from "./item-modifiers";
export type ModifierTemplate =
  | (Omit<StatModifier, "source" | "value"> & {
      min: number;
      max: number;
      step: number;
    })
  | Omit<ProcModifier, "source">;
export interface UniqueTemplate {
  id: string;
  name: string;
  base: string;
  level: number;
  weight: number;
  modifiers: ModifierTemplate[];
}
export interface SetPiece {
  id: string;
  name: string;
  base: string;
  level: number;
  modifiers: ModifierTemplate[];
}
export interface ItemSet {
  id: string;
  name: string;
  pieces: SetPiece[];
  bonuses: { count: number; modifiers: ModifierTemplate[] }[];
}
export interface AdvancedCatalog {
  schema: 1;
  contentVersion: 4;
  uniques: UniqueTemplate[];
  sets: ItemSet[];
}
function m(
  id: string,
  stat: ModifierStat,
  min: number,
  max = min,
  operation: StatModifier["operation"] = "add",
  condition: ModifierCondition = { kind: "always" },
): ModifierTemplate {
  return {
    kind: "stat",
    id,
    stat,
    min,
    max,
    step: operation === "add" ? 1 : 0.01,
    operation,
    group: id,
    stacking: "sum",
    priority: 0,
    condition,
  };
}
function p(
  id: string,
  event: ProcModifier["event"],
  effect: ProcModifier["effect"],
  chanceBasisPoints = 1500,
): ModifierTemplate {
  return {
    kind: "proc",
    id,
    event,
    effect,
    chanceBasisPoints,
    cooldownTicks: 60,
    eligibility: "weapon",
    condition: { kind: "always" },
  };
}
const unique = (
  id: string,
  name: string,
  base: string,
  modifiers: ModifierTemplate[],
  level = 8,
): UniqueTemplate => ({ id, name, base, modifiers, level, weight: 1 });
const piece = (
  id: string,
  name: string,
  base: string,
  modifiers: ModifierTemplate[],
): SetPiece => ({ id, name, base, modifiers, level: 8 });
/** Original Hollowbane mechanical prototypes; no external names, prose or artwork. */
export const ADVANCED_ITEMS: AdvancedCatalog = {
  schema: 1,
  contentVersion: 4,
  uniques: [
    unique("coalward-edge", "Coalward Edge", "ash-blade", [
      m("edge-damage", "damage", 7, 11),
      p("coal-spark", "hit", { kind: "damage", element: "fire", amount: 9 }),
    ]),
    unique("reedwake", "Reedwake", "reed-bow", [
      m("reed-speed", "attackSpeed", 10, 18),
      m("reed-aim", "accuracy", 8, 16),
    ]),
    unique("hushwood-rod", "Hushwood Rod", "cinder-staff", [
      m("hush-mana", "mana", 12, 20),
      m("hush-cast", "castSpeed", 8, 14),
    ]),
    unique("nightstitch", "Nightstitch", "woven-coat", [
      m("stitch-armor", "armor", 9, 15),
      m("stitch-recovery", "hitRecovery", 10, 18),
    ]),
    unique("bastion-brow", "Bastion Brow", "iron-cap", [
      m("brow-life", "life", 12, 22),
      m("brow-guard", "armor", 5, 9, "add", {
        kind: "health-below",
        fraction: 0.5,
      }),
    ]),
    unique("pale-reprieve", "Pale Reprieve", "bark-guard", [
      m("reprieve-cold", "coldResistance", 12, 20),
      p(
        "reprieve-touch",
        "hit",
        { kind: "status", status: "slow", magnitude: 0.2, duration: 90 },
        1000,
      ),
    ]),
    unique("cairnstrider", "Cairnstrider", "trail-boots", [
      m("cairn-recovery", "hitRecovery", 12, 20),
      m("cairn-poison", "poisonResistance", 10, 18),
    ]),
    unique("vowkeepers", "Vowkeepers", "sootwrap-gloves", [
      m("vow-speed", "attackSpeed", 8, 14),
      m("vow-leech", "lifeLeech", 1, 3),
    ]),
    unique("ember-sash", "Ember Sash", "hemp-sash", [
      m("sash-fire", "fireResistance", 14, 22),
      p(
        "sash-resolve",
        "kill",
        { kind: "restore", resource: "life", amount: 6 },
        10000,
      ),
    ]),
    unique("raincoil", "Raincoil", "copper-band", [
      m("rain-mana", "mana", 6, 12),
      m("rain-leech", "manaLeech", 1, 2),
    ]),
    unique("briar-oath", "Briar Oath", "copper-band", [
      m("briar-dot", "dotBonus", 8, 16),
      m("briar-skill", "skill.briar-edge", 1, 2),
    ]),
    unique("sable-meridian", "Sable Meridian", "slate-pendant", [
      m("meridian-storm", "lightningResistance", 12, 20),
      m("meridian-lance", "skill.ember-lance", 1, 2),
    ]),
  ],
  sets: [
    {
      id: "ashen-watch",
      name: "Ashen Watch",
      pieces: [
        piece("watch-brow", "Watchkeeper’s Brow", "iron-cap", [
          m("watch-armor", "armor", 3, 5),
        ]),
        piece("watch-coat", "Watchkeeper’s Coat", "woven-coat", [
          m("watch-life", "life", 5, 9),
        ]),
        piece("watch-hands", "Watchkeeper’s Hands", "sootwrap-gloves", [
          m("watch-aim", "accuracy", 3, 7),
        ]),
        piece("watch-tread", "Watchkeeper’s Tread", "trail-boots", [
          m("watch-cold", "coldResistance", 4, 8),
        ]),
      ],
      bonuses: [
        { count: 2, modifiers: [m("watch-two", "armor", 6)] },
        { count: 3, modifiers: [m("watch-three", "hitRecovery", 15)] },
        {
          count: 4,
          modifiers: [
            m("watch-full", "life", 24),
            p(
              "watch-flare",
              "hit",
              { kind: "damage", element: "fire", amount: 12 },
              1000,
            ),
          ],
        },
      ],
    },
    {
      id: "wayfarer-vow",
      name: "Wayfarer’s Vow",
      pieces: [
        piece("vow-edge", "Roadbound Edge", "ash-blade", [
          m("road-damage", "damage", 3, 6),
        ]),
        piece("vow-guard", "Roadbound Guard", "bark-guard", [
          m("road-armor", "armor", 3, 6),
        ]),
        piece("vow-belt", "Roadbound Cord", "hemp-sash", [
          m("road-mana", "mana", 4, 8),
        ]),
        piece("vow-token", "Roadbound Token", "slate-pendant", [
          m("road-life", "life", 5, 9),
        ]),
      ],
      bonuses: [
        { count: 2, modifiers: [m("road-two", "accuracy", 10)] },
        { count: 3, modifiers: [m("road-three", "attackSpeed", 15)] },
        {
          count: 4,
          modifiers: [
            m("road-full", "damage", 0.15, 0.15, "increase"),
            m("road-cost", "castSpeed", -8),
          ],
        },
      ],
    },
    {
      id: "rime-signal",
      name: "Rime Signal",
      pieces: [
        piece("signal-bow", "Signal of Still Reeds", "reed-bow", [
          m("signal-aim", "accuracy", 4, 8),
        ]),
        piece("signal-cap", "Signal of Quiet Skies", "iron-cap", [
          m("signal-mana", "mana", 5, 9),
        ]),
        piece("signal-ring", "Signal of Pale Water", "copper-band", [
          m("signal-cold", "coldResistance", 4, 8),
        ]),
        piece("signal-gloves", "Signal of Winter Hands", "sootwrap-gloves", [
          m("signal-speed", "attackSpeed", 3, 7),
        ]),
      ],
      bonuses: [
        { count: 2, modifiers: [m("signal-two", "coldResistance", 10)] },
        { count: 3, modifiers: [m("signal-three", "skill.rime-ring", 1)] },
        {
          count: 4,
          modifiers: [
            p(
              "signal-full",
              "hit",
              { kind: "status", status: "slow", magnitude: 0.3, duration: 120 },
              2000,
            ),
            m("signal-cost", "fireResistance", -10),
          ],
        },
      ],
    },
  ],
};
function record(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw Error("Invalid advanced content object");
  return v as Record<string, unknown>;
}
function fields(v: Record<string, unknown>, names: string[]) {
  if (JSON.stringify(Object.keys(v).sort()) !== JSON.stringify(names.sort()))
    throw Error("Unknown advanced content fields");
}
const id = (v: unknown): v is string =>
  typeof v === "string" && /^[a-z][a-z0-9-]{0,47}$/.test(v);
function templates(value: unknown) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 16)
    throw Error("Invalid modifier templates");
  const mods: ItemModifier[] = [];
  for (const raw of value as unknown[]) {
    const t = record(raw);
    if ("source" in t || "value" in t)
      throw Error("Template contains rolled fields");
    if (t.kind === "stat") {
      const { min, max, step, ...rest } = t;
      if (
        typeof min !== "number" ||
        typeof max !== "number" ||
        typeof step !== "number" ||
        ![min, max, step].every(Number.isFinite) ||
        min > max ||
        step <= 0 ||
        Math.abs((max - min) / step - Math.round((max - min) / step)) > 1e-7 ||
        (max - min) / step > 1000000
      )
        throw Error("Invalid controlled modifier range");
      validateModifier({ ...rest, source: "content", value: max });
      mods.push(validateModifier({ ...rest, source: "content", value: min }));
    } else mods.push(validateModifier({ ...t, source: "content" }));
  }
  validateModifiers(mods);
}
function canEquipCompleteSet(pieces: SetPiece[]): boolean {
  const assign = (
    index: number,
    occupied: Set<EquipSlot>,
    twoHanded: boolean,
  ): boolean => {
    if (index === pieces.length) return true;
    const def = equipmentDefinition({
      base: pieces[index]!.base,
      contentVersion: 3,
    });
    for (const slot of def.slots) {
      if (
        occupied.has(slot) ||
        (slot === "off" && twoHanded) ||
        (def.hands === 2 && occupied.has("off"))
      )
        continue;
      if (
        assign(
          index + 1,
          new Set([...occupied, slot]),
          twoHanded || def.hands === 2,
        )
      )
        return true;
    }
    return false;
  };
  return assign(0, new Set(), false);
}
export function validateAdvancedCatalog(value: unknown): AdvancedCatalog {
  const c = record(value);
  fields(c, ["schema", "contentVersion", "uniques", "sets"]);
  if (
    c.schema !== 1 ||
    c.contentVersion !== 4 ||
    !Array.isArray(c.uniques) ||
    !Array.isArray(c.sets) ||
    c.uniques.length > 128 ||
    c.sets.length > 32
  )
    throw Error("Unsupported advanced catalog");
  const identities = new Set<string>(),
    names = new Set<string>();
  const identity = (v: Record<string, unknown>) => {
    if (
      !id(v.id) ||
      identities.has(v.id) ||
      typeof v.name !== "string" ||
      v.name.length < 3 ||
      v.name.length > 80 ||
      names.has(v.name)
    )
      throw Error("Duplicate or invalid content identity");
    identities.add(v.id);
    names.add(v.name);
  };
  const item = (v: Record<string, unknown>) => {
    identity(v);
    if (
      !EQUIPMENT_CONTENT.bases.some((b) => b.id === v.base) ||
      !Number.isInteger(v.level) ||
      (v.level as number) < 1 ||
      (v.level as number) > 99
    )
      throw Error("Invalid advanced item base/level");
    templates(v.modifiers);
  };
  for (const raw of c.uniques as unknown[]) {
    const v = record(raw);
    fields(v, ["id", "name", "base", "level", "weight", "modifiers"]);
    item(v);
    if (
      !Number.isInteger(v.weight) ||
      (v.weight as number) < 1 ||
      (v.weight as number) > 100000
    )
      throw Error("Invalid unique weight");
  }
  for (const raw of c.sets as unknown[]) {
    const v = record(raw);
    fields(v, ["id", "name", "pieces", "bonuses"]);
    identity(v);
    if (
      !Array.isArray(v.pieces) ||
      v.pieces.length < 3 ||
      v.pieces.length > 10 ||
      !Array.isArray(v.bonuses)
    )
      throw Error("Invalid complete set");
    for (const raw of v.pieces as unknown[]) {
      const p = record(raw);
      fields(p, ["id", "name", "base", "level", "modifiers"]);
      item(p);
    }
    if (!canEquipCompleteSet(v.pieces as SetPiece[]))
      throw Error("Set cannot be equipped completely");
    const thresholds = new Set<number>();
    const combined: ItemModifier[] = [];
    for (const raw of v.bonuses as unknown[]) {
      const b = record(raw);
      fields(b, ["count", "modifiers"]);
      if (
        !Number.isInteger(b.count) ||
        (b.count as number) < 2 ||
        (b.count as number) > v.pieces.length ||
        thresholds.has(b.count as number)
      )
        throw Error("Invalid set threshold");
      thresholds.add(b.count as number);
      templates(b.modifiers);
      if (
        (b.modifiers as ModifierTemplate[]).some(
          (m) => m.kind === "stat" && m.min !== m.max,
        )
      )
        throw Error("Set bonuses must be fixed");
      combined.push(
        ...rollModifiers(
          b.modifiers as ModifierTemplate[],
          "set-validation",
          () => 0,
        ),
      );
    }
    validateModifiers(combined);
    if (!thresholds.has(2) || !thresholds.has(v.pieces.length))
      throw Error("Set needs two-piece and full bonuses");
  }
  return value as AdvancedCatalog;
}
export function rollModifiers(
  templates: readonly ModifierTemplate[],
  source: string,
  random: () => number,
): ItemModifier[] {
  return templates.map((t) => {
    if (t.kind === "proc")
      return {
        ...t,
        condition: { ...t.condition },
        effect: { ...t.effect },
        source,
      };
    const { min, max, step, ...rest } = t,
      draw = random();
    if (!Number.isFinite(draw) || draw < 0 || draw >= 1)
      throw Error("Invalid modifier RNG");
    const value =
      Math.round(
        (min + Math.floor(draw * (Math.round((max - min) / step) + 1)) * step) *
          1000000,
      ) / 1000000;
    return { ...rest, condition: { ...t.condition }, value, source };
  });
}
export interface SetMember {
  set: string;
  piece: string;
}
/** Count distinct piece identities, never duplicate copies of the same ring. */
export function activeSetBonuses(
  members: readonly SetMember[],
  catalog: AdvancedCatalog = ADVANCED_ITEMS,
): {
  active: { set: string; count: number; required: number }[];
  modifiers: ItemModifier[];
} {
  const active: { set: string; count: number; required: number }[] = [],
    modifiers: ItemModifier[] = [];
  for (const s of [...catalog.sets].sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
  )) {
    const count = new Set(
      members
        .filter((m) => m.set === s.id && s.pieces.some((p) => p.id === m.piece))
        .map((m) => m.piece),
    ).size;
    for (const b of [...s.bonuses].sort((a, b) => a.count - b.count))
      if (count >= b.count) {
        active.push({ set: s.id, count, required: b.count });
        modifiers.push(...rollModifiers(b.modifiers, `set:${s.id}`, () => 0));
      }
  }
  return { active, modifiers };
}
validateAdvancedCatalog(ADVANCED_ITEMS);

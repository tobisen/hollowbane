import data from "../content/quests.json" with { type: "json" };
import { AREA_IDS, type AreaId } from "./world";
import { CAMP_NPC_IDS } from "./camp-dialogue";
import { validWorldMonsterIdentity } from "./world-encounters";
export type QuestKind = "travel" | "interact" | "defeat" | "collect";
export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  requires: string[];
  objectives: {
    kind: QuestKind;
    target: string;
    label: string;
    count: number;
  }[];
  reward: { xp: number; gold: number; itemSeed: number | null };
}
export interface QuestEntry {
  id: string;
  status: "active" | "ready" | "claimed";
  /** Each bounded objective ledger is also its counter; no separate mutable total. */
  seen: string[][];
}
export interface QuestState {
  version: 1;
  tracked: string | null;
  entries: QuestEntry[];
}
export interface QuestEvent {
  kind: QuestKind;
  area: AreaId;
  id: string;
}
function object(v: unknown, fields: string[]): Record<string, unknown> {
  if (
    !v ||
    typeof v !== "object" ||
    Array.isArray(v) ||
    Object.keys(v).sort().join() !== [...fields].sort().join()
  )
    throw Error("Invalid quest fields");
  return v as Record<string, unknown>;
}
function text(v: unknown, max = 500): string {
  if (typeof v !== "string" || !v.trim() || v.length > max)
    throw Error("Invalid quest text");
  return v;
}
function integer(v: unknown, max = 1000000): number {
  if (typeof v !== "number" || !Number.isSafeInteger(v) || v < 0 || v > max)
    throw Error("Invalid quest integer");
  return v;
}
export function validateQuestDefinitions(value: unknown): QuestDefinition[] {
  if (!Array.isArray(value) || value.length > 32)
    throw Error("Invalid quest catalog");
  const definitions = value.map((raw): QuestDefinition => {
    const q = object(raw, [
      "id",
      "title",
      "description",
      "requires",
      "objectives",
      "reward",
    ]);
    const id = text(q.id, 64),
      r = object(q.reward, ["xp", "gold", "itemSeed"]);
    if (
      !/^[a-z][a-z0-9-]*$/.test(id) ||
      !Array.isArray(q.requires) ||
      q.requires.length > 8 ||
      new Set(q.requires).size !== q.requires.length ||
      !Array.isArray(q.objectives) ||
      !q.objectives.length ||
      q.objectives.length > 8
    )
      throw Error("Invalid quest definition");
    return {
      id,
      title: text(q.title, 80),
      description: text(q.description),
      requires: q.requires.map((v) => text(v, 64)),
      objectives: q.objectives.map((raw) => {
        const o = object(raw, ["kind", "target", "label", "count"]);
        if (
          !["travel", "interact", "defeat", "collect"].includes(
            o.kind as string,
          ) ||
          !(o.kind === "interact"
            ? CAMP_NPC_IDS.includes(o.target as (typeof CAMP_NPC_IDS)[number])
            : AREA_IDS.includes(o.target as AreaId)) ||
          !integer(o.count, 20) ||
          ((o.kind === "travel" || o.kind === "interact") && o.count !== 1)
        )
          throw Error("Invalid quest objective");
        return {
          kind: o.kind as QuestKind,
          target: o.target as string,
          label: text(o.label, 120),
          count: o.count as number,
        };
      }),
      reward: {
        xp: integer(r.xp),
        gold: integer(r.gold),
        itemSeed: r.itemSeed === null ? null : integer(r.itemSeed, 0xffffffff),
      },
    };
  });
  if (new Set(definitions.map((q) => q.id)).size !== definitions.length)
    throw Error("Duplicate quest identity");
  const checked = new Set<string>(),
    visiting = new Set<string>();
  const visit = (id: string) => {
    if (checked.has(id)) return;
    const q = definitions.find((q) => q.id === id);
    if (!q || visiting.has(id))
      throw Error("Unknown or cyclic quest prerequisite");
    visiting.add(id);
    q.requires.forEach(visit);
    visiting.delete(id);
    checked.add(id);
  };
  definitions.forEach((q) => visit(q.id));
  const seeds = definitions.flatMap((q) =>
    q.reward.itemSeed === null ? [] : [q.reward.itemSeed],
  );
  if (new Set(seeds).size !== seeds.length)
    throw Error("Duplicate quest reward seed");
  return definitions;
}
export const QUESTS = validateQuestDefinitions(data);
export function newQuestState(): QuestState {
  return { version: 1, tracked: null, entries: [] };
}
export function questStatus(
  state: QuestState,
  q: QuestDefinition,
): QuestEntry["status"] | "locked" | "available" {
  return (
    state.entries.find((e) => e.id === q.id)?.status ??
    (q.requires.every((id) =>
      state.entries.some((e) => e.id === id && e.status === "claimed"),
    )
      ? "available"
      : "locked")
  );
}
function validEvent(e: QuestEvent): boolean {
  if (!AREA_IDS.includes(e.area) || typeof e.id !== "string") return false;
  switch (e.kind) {
    case "travel":
      return e.id === e.area;
    case "interact":
      return (
        e.area === "ashen-refuge" &&
        CAMP_NPC_IDS.includes(e.id as (typeof CAMP_NPC_IDS)[number])
      );
    case "defeat":
      return (
        /^\d{4}$/.test(e.id) && validWorldMonsterIdentity(e.area, Number(e.id))
      );
    case "collect":
      return /^l[2-8]-[0-9a-f]{1,8}-[0-9a-f]{1,8}$/.test(e.id);
    default:
      return false;
  }
}
function matches(
  o: QuestDefinition["objectives"][number],
  event: QuestEvent,
): boolean {
  return (
    o.kind === event.kind &&
    o.target === (event.kind === "interact" ? event.id : event.area)
  );
}
export function acceptQuest(
  state: QuestState,
  id: string,
  definitions = QUESTS,
): QuestState {
  const q = definitions.find((q) => q.id === id);
  if (!q || questStatus(state, q) !== "available") return state;
  return {
    ...state,
    tracked: id,
    entries: [
      ...state.entries,
      { id, status: "active", seen: q.objectives.map(() => []) },
    ],
  };
}
export function trackQuest(state: QuestState, id: string): QuestState {
  return state.entries.some((e) => e.id === id && e.status !== "claimed")
    ? { ...state, tracked: id }
    : state;
}
export function advanceQuests(
  state: QuestState,
  event: QuestEvent,
  definitions = QUESTS,
): QuestState {
  if (!validEvent(event)) return state;
  let changed = false;
  const entries = state.entries.map((entry): QuestEntry => {
    if (entry.status !== "active") return entry;
    const q = definitions.find((q) => q.id === entry.id)!;
    let updated = false;
    const seen = entry.seen.map((ids, index) => {
      const o = q.objectives[index]!;
      if (ids.length >= o.count || ids.includes(event.id) || !matches(o, event))
        return ids;
      updated = changed = true;
      return [...ids, event.id];
    });
    return updated
      ? {
          ...entry,
          seen,
          status: seen.every((ids, i) => ids.length === q.objectives[i]!.count)
            ? "ready"
            : "active",
        }
      : entry;
  });
  return changed ? { ...state, entries } : state;
}
export function claimedQuest(state: QuestState, id: string): QuestState {
  if (!state.entries.some((e) => e.id === id && e.status === "ready"))
    return state;
  return {
    ...state,
    tracked: state.tracked === id ? null : state.tracked,
    entries: state.entries.map((e) =>
      e.id === id ? { ...e, status: "claimed" } : e,
    ),
  };
}
export function validateQuestState(
  value: unknown,
  definitions = QUESTS,
): QuestState {
  const s = object(value, ["version", "tracked", "entries"]);
  if (
    s.version !== 1 ||
    !Array.isArray(s.entries) ||
    s.entries.length > definitions.length ||
    (s.tracked !== null && typeof s.tracked !== "string")
  )
    throw Error("Invalid quest state");
  const entries = s.entries.map((raw): QuestEntry => {
    const e = object(raw, ["id", "status", "seen"]),
      q = definitions.find((q) => q.id === e.id);
    if (
      !q ||
      !["active", "ready", "claimed"].includes(e.status as string) ||
      !Array.isArray(e.seen) ||
      e.seen.length !== q.objectives.length
    )
      throw Error("Invalid quest entry");
    const seen = e.seen.map((raw, i) => {
      const o = q.objectives[i]!;
      if (
        !Array.isArray(raw) ||
        raw.length > o.count ||
        new Set(raw).size !== raw.length ||
        raw.some(
          (id) =>
            !validEvent({
              kind: o.kind,
              area:
                o.kind === "interact" ? "ashen-refuge" : (o.target as AreaId),
              id,
            }),
        )
      )
        throw Error("Invalid quest progress");
      if (o.kind === "interact" && raw.some((id) => id !== o.target))
        throw Error("Mismatched quest interaction");
      return [...raw] as string[];
    });
    const complete = seen.every(
      (ids, i) => ids.length === q.objectives[i]!.count,
    );
    if (complete !== (e.status !== "active"))
      throw Error("Incoherent quest completion");
    return { id: q.id, status: e.status as QuestEntry["status"], seen };
  });
  if (
    new Set(entries.map((e) => e.id)).size !== entries.length ||
    entries.some(
      (e) =>
        !definitions
          .find((q) => q.id === e.id)!
          .requires.every((id) =>
            entries.some((p) => p.id === id && p.status === "claimed"),
          ),
    ) ||
    (s.tracked !== null &&
      !entries.some((e) => e.id === s.tracked && e.status !== "claimed"))
  )
    throw Error("Invalid quest prerequisite or tracking");
  return { version: 1, tracked: s.tracked as string | null, entries };
}

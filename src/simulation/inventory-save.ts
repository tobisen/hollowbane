import { itemTree } from "./item-ownership";
import { EQUIP_SLOTS, type EquipSlot } from "./equipment-content";
import { registeredItemContent as itemContentForVersion } from "./item-registry";
import { validateGeneratedItem } from "./item-save";
import {
  reserveOwned,
  validateSession,
  type InventorySession,
} from "./inventory-world";
import type { Navigation } from "../world/navigation";

export const CHARACTER_SCHEMA = 2;
const LEGACY_VERSIONS = [2, 3];
const ADVANCED_VERSIONS = [2, 3, 4, 5, 6, 7];
const FORMAT = "hollowbane-character";
const MAX_BYTES = 1048576;
function record(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw Error("Expected object");
  return v as Record<string, unknown>;
}
function keys(v: Record<string, unknown>, names: string[]): void {
  if (Object.keys(v).sort().join(",") !== [...names].sort().join(","))
    throw Error("Unexpected save fields");
}
function integer(v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  if (typeof v !== "number" || !Number.isSafeInteger(v) || v < min || v > max)
    throw Error("Invalid save integer");
  return v;
}
function coordinate(v: unknown): number {
  if (typeof v !== "number" || !Number.isFinite(v) || Math.abs(v) > 1000000)
    throw Error("Invalid save position");
  return v;
}
function list(v: unknown, max: number): unknown[] {
  if (!Array.isArray(v) || v.length > max) throw Error("Invalid save list");
  return v as unknown[];
}
/** Corruption detection, not authentication. */
export function snapshotChecksum(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++)
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, "0");
}
function body(s: InventorySession, versions: readonly number[]): unknown {
  return {
    contentVersions: [...versions],
    character: s.character,
    loot: {
      seed: s.loot.seed,
      sequence: s.loot.sequence,
      areaLevel: s.loot.areaLevel,
      monsterLevel: s.loot.monsterLevel,
      table: s.loot.table,
      drops: s.loot.drops,
      attempts: s.loot.attempts,
      noDrop: s.loot.noDrop,
      blocked: s.loot.blocked,
      capacity: s.loot.capacity,
    },
  };
}
function validateBody(
  value: unknown,
  nav?: Navigation,
  versions: readonly number[] = ADVANCED_VERSIONS,
): InventorySession {
  const b = record(value);
  keys(b, ["contentVersions", "character", "loot"]);
  if (
    versions === ADVANCED_VERSIONS &&
    Array.isArray(b.contentVersions) &&
    b.contentVersions.length >= 3 &&
    b.contentVersions.length <= versions.length &&
    b.contentVersions.every((v, i) => v === versions[i])
  )
    versions = b.contentVersions as number[];
  if (JSON.stringify(b.contentVersions) !== JSON.stringify(versions))
    throw Error("Unsupported content registry");
  const c = record(b.character),
    g = record(c.grid),
    e = record(c.equipment),
    w = record(b.loot);
  keys(c, ["grid", "equipment", "level", "revision"]);
  keys(g, ["columns", "rows", "items"]);
  if (Object.keys(e).some((k) => !EQUIP_SLOTS.includes(k as EquipSlot)))
    throw Error("Unknown equipment slot");
  const equipment: InventorySession["character"]["equipment"] = {};
  for (const slot of EQUIP_SLOTS)
    if (e[slot] !== undefined) equipment[slot] = validateGeneratedItem(e[slot]);
  keys(w, [
    "seed",
    "sequence",
    "areaLevel",
    "monsterLevel",
    "table",
    "drops",
    "attempts",
    "noDrop",
    "blocked",
    "capacity",
  ]);
  if (
    typeof w.table !== "string" ||
    !versions.some((v) =>
      itemContentForVersion(v).tables.some((t) => t.id === w.table),
    )
  )
    throw Error("Unknown loot table");
  const session: InventorySession = {
    character: {
      level: integer(c.level, 1, 99),
      revision: integer(c.revision),
      equipment,
      grid: {
        columns: integer(g.columns, 1, 20),
        rows: integer(g.rows, 1, 20),
        items: list(g.items, 400).map((v) => {
          const p = record(v);
          keys(p, ["item", "x", "y"]);
          return {
            item: validateGeneratedItem(p.item),
            x: integer(p.x, 0, 19),
            y: integer(p.y, 0, 19),
          };
        }),
      },
    },
    loot: {
      seed: integer(w.seed, 0, 0xffffffff),
      sequence: integer(w.sequence, 0, 0x100000000),
      areaLevel: integer(w.areaLevel, 1, 99),
      monsterLevel: integer(w.monsterLevel, 1, 99),
      table: w.table,
      attempts: integer(w.attempts),
      noDrop: integer(w.noDrop),
      blocked: integer(w.blocked),
      capacity: integer(w.capacity, 1, 128),
      deaths: new Set(),
      drops: list(w.drops, 128).map((v) => {
        const d = record(v),
          p = record(d.position);
        keys(d, ["item", "position", "tick", "source"]);
        keys(p, ["x", "y"]);
        return {
          item: validateGeneratedItem(d.item),
          position: { x: coordinate(p.x), y: coordinate(p.y) },
          tick: integer(d.tick),
          source: integer(d.source, -2),
        };
      }),
    },
  };
  if (
    itemTree([
      ...session.character.grid.items.map((p) => p.item),
      ...Object.values(session.character.equipment),
      ...session.loot.drops.map((d) => d.item),
    ]).some((i) => !versions.includes(i.contentVersion))
  )
    throw Error("Unsupported content registry");
  validateSession(session, nav);
  return reserveOwned(session);
}
export function serializeCharacter(
  s: InventorySession,
  nav?: Navigation,
): string {
  const modern =
    [
      ...s.character.grid.items.map((p) => p.item),
      ...Object.values(s.character.equipment),
      ...s.loot.drops.map((d) => d.item),
    ].some((i) => i.contentVersion >= 4) ||
    !itemContentForVersion(3).tables.some((t) => t.id === s.loot.table);
  const versions = modern ? ADVANCED_VERSIONS : LEGACY_VERSIONS;
  const validated = validateBody(body(s, versions), nav, versions),
    payload = body(validated, versions);
  const text = JSON.stringify({
    format: FORMAT,
    schema: modern ? CHARACTER_SCHEMA : 1,
    checksum: snapshotChecksum(JSON.stringify(payload)),
    body: payload,
  });
  if (text.length > MAX_BYTES) throw Error("Character snapshot too large");
  return text;
}
/** Future migrations must explicitly transform one schema into the next; no prototype guessing. */
export type CharacterMigrations = ReadonlyMap<
  number,
  (body: unknown) => unknown
>;
export function deserializeCharacter(
  text: string,
  nav?: Navigation,
  migrations: CharacterMigrations = new Map(),
): InventorySession {
  if (text.length > MAX_BYTES) throw Error("Character snapshot too large");
  const root = record(JSON.parse(text) as unknown);
  if (root.format !== FORMAT)
    throw Error(
      "Unsupported character format; an L1 item archive is not a character save",
    );
  keys(root, ["format", "schema", "checksum", "body"]);
  let schema = integer(root.schema),
    payload = root.body;
  if (root.checksum !== snapshotChecksum(JSON.stringify(payload)))
    throw Error("Snapshot checksum mismatch");
  if (schema > CHARACTER_SCHEMA)
    throw Error("Unsupported newer character schema; original retained");
  while (schema < CHARACTER_SCHEMA) {
    const migrate =
      migrations.get(schema) ??
      (schema === 1
        ? (old: unknown) => {
            // Validate the original declared registry before widening it. Never bless forged modern data.
            validateBody(old, nav, LEGACY_VERSIONS);
            return { ...record(old), contentVersions: [...ADVANCED_VERSIONS] };
          }
        : undefined);
    if (!migrate)
      throw Error("Unsupported older character schema; original retained");
    payload = migrate(payload);
    schema++;
  }
  return validateBody(payload, nav);
}
export type SnapshotPair =
  | { kind: "empty" }
  | { kind: "valid"; session: InventorySession }
  | { kind: "recoverable"; session: InventorySession; error: string }
  | { kind: "invalid"; error: string };
/** A backup is offered, never silently loaded or written over a damaged current save. */
export function inspectSnapshots(
  current: string | null,
  previous: string | null,
  nav?: Navigation,
): SnapshotPair {
  if (current === null && previous === null) return { kind: "empty" };
  let error = "Current snapshot missing";
  if (current !== null) {
    try {
      return { kind: "valid", session: deserializeCharacter(current, nav) };
    } catch (e) {
      error = e instanceof Error ? e.message : "Invalid snapshot";
    }
  }
  if (previous !== null) {
    try {
      return {
        kind: "recoverable",
        session: deserializeCharacter(previous, nav),
        error,
      };
    } catch {
      /* Both originals remain untouched for export/recovery. */
    }
  }
  return { kind: "invalid", error };
}

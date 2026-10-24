import { CLASS_IDS, type ClassId } from "./character-classes";
import {
  deserializeCharacter,
  inspectSnapshots,
  type SnapshotPair,
} from "./inventory-save";
import type { InventorySession } from "./inventory-world";

export const CHARACTER_REGISTRY_VERSION = 1;
export const CHARACTER_CAPACITY = 8;
export const LEGACY_CHARACTER_ID = "00000000-0000-4000-8000-000000000001";
export interface CharacterMetadata {
  readonly id: string;
  readonly name: string;
  readonly classId: ClassId | null;
  readonly level: number;
  readonly revision: number;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly lastPlayedAt: number | null;
}
export interface CharacterRegistry {
  readonly version: 1;
  readonly revision: number;
  readonly lastPlayed: string | null;
  readonly characters: readonly CharacterMetadata[];
}
export interface CharacterRecord {
  readonly id: string;
  readonly revision: number;
  readonly text: string;
}
export type CharacterLoad = SnapshotPair & {
  readonly metadata: CharacterMetadata;
};
export function characterId(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
      value,
    )
  )
    throw Error("Invalid character ID");
  return value;
}
export function characterName(value: unknown): string {
  if (typeof value !== "string") throw Error("Invalid character name");
  const name = value.trim();
  if (!name || [...name].length > 32 || /[\p{Cc}\p{Cf}]/u.test(name))
    throw Error("Character name must contain 1–32 visible characters");
  return name;
}
export function registryInteger(value: unknown, min = 0): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min)
    throw Error("Invalid character registry integer");
  return value;
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Invalid character registry record; original retained");
  return value as Record<string, unknown>;
}
export function validateRegistry(value: unknown): CharacterRegistry {
  if (value === undefined)
    return { version: 1, revision: 0, lastPlayed: null, characters: [] };
  const r = object(value);
  if (
    r.version !== CHARACTER_REGISTRY_VERSION ||
    !Array.isArray(r.characters) ||
    r.characters.length > CHARACTER_CAPACITY
  )
    throw Error("Unsupported or invalid character registry; original retained");
  const revision = registryInteger(r.revision);
  const characters = r.characters.map((value): CharacterMetadata => {
    const m = object(value),
      id = characterId(m.id),
      name = characterName(m.name);
    if (
      name !== m.name ||
      (m.classId !== null && !CLASS_IDS.includes(m.classId as ClassId))
    )
      throw Error("Invalid character metadata");
    const createdAt = registryInteger(m.createdAt),
      updatedAt = registryInteger(m.updatedAt),
      lastPlayedAt =
        m.lastPlayedAt === null ? null : registryInteger(m.lastPlayedAt);
    const level = registryInteger(m.level, 1);
    if (
      level > 99 ||
      updatedAt < createdAt ||
      (lastPlayedAt !== null &&
        (lastPlayedAt < createdAt || lastPlayedAt > updatedAt))
    )
      throw Error("Invalid character metadata chronology or level");
    return {
      id,
      name,
      classId: m.classId as ClassId | null,
      level,
      revision: registryInteger(m.revision, 1),
      createdAt,
      updatedAt,
      lastPlayedAt,
    };
  });
  if (new Set(characters.map((m) => m.id)).size !== characters.length)
    throw Error("Duplicate character identity");
  const lastPlayed = r.lastPlayed === null ? null : characterId(r.lastPlayed);
  if (revision === 0 && (characters.length > 0 || lastPlayed !== null))
    throw Error("Invalid initial character registry");
  if (
    lastPlayed !== null &&
    !characters.some((m) => m.id === lastPlayed && m.lastPlayedAt !== null)
  )
    throw Error("Invalid last-played character; selection required");
  return { version: 1, revision, lastPlayed, characters };
}
export function characterMetadata(
  id: string,
  name: string,
  session: InventorySession,
  now: number,
  revision = 1,
  previous?: CharacterMetadata,
): CharacterMetadata {
  const classId = session.progression?.skills.classId ?? null;
  if (previous?.classId && previous.classId !== classId)
    throw Error("Character class identity changed; save rejected");
  return {
    id: characterId(id),
    name: characterName(name),
    classId,
    level: session.character.level,
    revision: registryInteger(revision, 1),
    createdAt: previous?.createdAt ?? registryInteger(now),
    updatedAt: Math.max(registryInteger(now), previous?.updatedAt ?? 0),
    lastPlayedAt: previous?.lastPlayedAt ?? null,
  };
}
export function characterRecord(
  value: unknown,
  id: string,
): CharacterRecord | null {
  if (value === undefined) return null;
  const r = object(value);
  if (r.id !== id || typeof r.text !== "string")
    throw Error(
      "Character snapshot identity or text is invalid; original retained",
    );
  return {
    id: characterId(r.id),
    revision: registryInteger(r.revision, 1),
    text: r.text,
  };
}
/** Damage is offered for explicit recovery; another character is never substituted. */
export function inspectCharacter(
  metadata: CharacterMetadata,
  current: unknown,
  previous: unknown,
): CharacterLoad {
  let text: string | null = null,
    backup: string | null = null;
  try {
    backup = characterRecord(previous, metadata.id)?.text ?? null;
  } catch {
    /* A damaged backup cannot invalidate a valid current. */
  }
  try {
    const record = characterRecord(current, metadata.id);
    if (record?.revision !== metadata.revision)
      throw Error("Snapshot and registry revisions differ");
    text = record.text;
    const session = deserializeCharacter(text);
    if (
      session.character.level !== metadata.level ||
      (session.progression?.skills.classId ?? null) !== metadata.classId
    )
      throw Error("Snapshot and character metadata differ");
  } catch {
    text = "";
  }
  const result = inspectSnapshots(text, backup);
  return { ...result, metadata };
}
export function nextRegistry(
  registry: CharacterRegistry,
  characters: readonly CharacterMetadata[],
  lastPlayed = registry.lastPlayed,
): CharacterRegistry {
  if (registry.revision >= Number.MAX_SAFE_INTEGER)
    throw Error("Character registry revision limit reached");
  return validateRegistry({
    version: 1,
    revision: registry.revision + 1,
    lastPlayed,
    characters,
  });
}

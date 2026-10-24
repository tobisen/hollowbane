import {
  deserializeCharacter,
  serializeCharacter,
} from "../simulation/inventory-save";
import type { InventorySession } from "../simulation/inventory-world";
import {
  CHARACTER_CAPACITY,
  LEGACY_CHARACTER_ID,
  characterId,
  characterMetadata,
  characterName,
  characterRecord,
  inspectCharacter,
  nextRegistry,
  registryInteger,
  validateRegistry,
  type CharacterLoad,
  type CharacterMetadata,
  type CharacterRegistry,
} from "../simulation/character-registry";
import { InventoryStorage } from "./inventory-storage";
export {
  deserializeCharacter,
  serializeCharacter,
} from "../simulation/inventory-save";
export {
  CHARACTER_CAPACITY,
  LEGACY_CHARACTER_ID,
} from "../simulation/character-registry";
export type {
  CharacterLoad,
  CharacterMetadata,
  CharacterRegistry,
} from "../simulation/character-registry";

type Store = "registry" | "characters" | "previous" | "archives";
const STORES: Store[] = ["registry", "characters", "previous", "archives"];
function storedRegistry(value: unknown): CharacterRegistry {
  if (value === undefined)
    throw Error(
      "Character registry is missing; originals retained, explicit recovery required",
    );
  return validateRegistry(value);
}
interface Transaction<T> {
  get(store: Store, key: string, use: (value: unknown) => void): void;
  put(store: Store, key: string, value: unknown): void;
  remove(store: Store, key: string): void;
  done(value: T): void;
}
export interface CharacterStorageOptions {
  readonly database?: string;
  readonly legacyDatabase?: string;
  readonly now?: () => number;
  readonly newId?: () => string;
}
export type LegacyMigration =
  | { readonly kind: "empty" }
  | {
      readonly kind: "migrated" | "already-migrated";
      readonly id: string;
      readonly deleted: boolean;
    };

/** Each operation names its owner explicitly. No global active-session or shared stash. */
export class CharacterStorage {
  private db: IDBDatabase | null = null;
  private opening: Promise<void> | null = null;
  private readonly database: string;
  private readonly legacyDatabase: string;
  private readonly now: () => number;
  private readonly newId: () => string;
  constructor(options: CharacterStorageOptions = {}) {
    this.database = options.database ?? "hollowbane-characters-v1";
    this.legacyDatabase = options.legacyDatabase ?? "hollowbane-character-v1";
    if (this.database === this.legacyDatabase)
      throw Error("Character registry must be separate from legacy storage");
    this.now = options.now ?? (() => Date.now());
    this.newId = options.newId ?? (() => crypto.randomUUID());
  }
  async open(): Promise<void> {
    if (this.db) return;
    if (this.opening) return this.opening;
    this.opening = new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.database, 1);
      let blocked = false;
      let upgradeFailure: unknown;
      request.onupgradeneeded = () => {
        try {
          for (const name of STORES) request.result.createObjectStore(name);
          request
            .transaction!.objectStore("registry")
            .put(validateRegistry(undefined), "current");
        } catch (error) {
          upgradeFailure = error;
          request.transaction!.abort();
        }
      };
      request.onerror = () =>
        reject(
          upgradeFailure ??
            request.error ??
            Error("Character registry unavailable"),
        );
      request.onblocked = () => {
        blocked = true;
        reject(Error("Character registry blocked by another tab"));
      };
      request.onsuccess = () => {
        if (blocked) {
          request.result.close();
          return;
        }
        this.db = request.result;
        this.db.onversionchange = () => this.close();
        resolve();
      };
    });
    try {
      await this.opening;
    } finally {
      this.opening = null;
    }
  }
  close(): void {
    this.db?.close();
    this.db = null;
  }
  private async transaction<T>(
    stores: Store[],
    mode: IDBTransactionMode,
    body: (tx: Transaction<T>) => void,
  ): Promise<T> {
    await this.open();
    return new Promise<T>((resolve, reject) => {
      const tx = this.db!.transaction(stores, mode);
      let result: T,
        completed = false,
        failure: unknown;
      const guard = (action: () => void) => {
        try {
          action();
        } catch (error) {
          failure = error;
          try {
            tx.abort();
          } catch {
            /* An already aborted transaction still rejects through onabort. */
          }
        }
      };
      tx.onabort = () =>
        reject(
          failure ??
            tx.error ??
            Error("Character transaction failed; originals retained"),
        );
      tx.onerror = () => {
        /* Aborting is mandatory; no partial success. */
      };
      tx.oncomplete = () =>
        completed
          ? resolve(result)
          : reject(Error("Character transaction returned no result"));
      guard(() =>
        body({
          get: (store, key, use) => {
            const request = tx.objectStore(store).get(key);
            request.onsuccess = () => guard(() => use(request.result));
          },
          put: (store, key, value) => {
            tx.objectStore(store).put(value, key);
          },
          remove: (store, key) => {
            tx.objectStore(store).delete(key);
          },
          done: (value) => {
            result = value;
            completed = true;
          },
        }),
      );
    });
  }
  async list(): Promise<CharacterRegistry> {
    return this.transaction(["registry"], "readonly", (tx) =>
      tx.get("registry", "current", (value) => tx.done(storedRegistry(value))),
    );
  }
  async create(
    name: string,
    session: InventorySession,
  ): Promise<CharacterMetadata> {
    const text = serializeCharacter(session),
      prepared = deserializeCharacter(text);
    const id = characterId(this.newId());
    if (id === LEGACY_CHARACTER_ID) throw Error("Reserved legacy identity");
    const metadata = characterMetadata(id, name, prepared, this.now());
    return this.transaction(STORES, "readwrite", (tx) =>
      tx.get("registry", "current", (value) => {
        const registry = storedRegistry(value);
        if (registry.characters.length >= CHARACTER_CAPACITY)
          throw Error("All eight character slots are occupied");
        tx.get("archives", `identity:${id}`, (identity) => {
          if (
            identity !== undefined ||
            registry.characters.some((m) => m.id === id)
          )
            throw Error("Character identity already used");
          tx.get("characters", id, (current) => {
            if (current !== undefined)
              throw Error("Character record already exists; original retained");
            tx.put("characters", id, { id, revision: 1, text });
            tx.put("archives", `identity:${id}`, { id });
            tx.put(
              "registry",
              "current",
              nextRegistry(registry, [...registry.characters, metadata]),
            );
            tx.done(metadata);
          });
        });
      }),
    );
  }
  private withCharacter<T>(
    id: string,
    mode: IDBTransactionMode,
    use: (
      tx: Transaction<T>,
      registry: CharacterRegistry,
      metadata: CharacterMetadata,
      current: unknown,
      previous: unknown,
    ) => void,
  ): Promise<T> {
    characterId(id);
    return this.transaction(STORES, mode, (tx) =>
      tx.get("registry", "current", (value) => {
        const registry = storedRegistry(value),
          metadata = registry.characters.find((m) => m.id === id);
        if (!metadata)
          throw Error("Character no longer exists; selection required");
        tx.get("characters", id, (current) =>
          tx.get("previous", id, (previous) =>
            use(tx, registry, metadata, current, previous),
          ),
        );
      }),
    );
  }
  async load(id: string): Promise<CharacterLoad> {
    return this.withCharacter(
      id,
      "readonly",
      (tx, _registry, metadata, current, previous) =>
        tx.done(inspectCharacter(metadata, current, previous)),
    );
  }
  /** No fallback to another character if the selected current is corrupt. */
  async recent(): Promise<CharacterLoad | null> {
    return this.transaction(STORES, "readonly", (tx) =>
      tx.get("registry", "current", (value) => {
        const registry = storedRegistry(value);
        if (registry.lastPlayed === null) {
          tx.done(null);
          return;
        }
        const metadata = registry.characters.find(
          (m) => m.id === registry.lastPlayed,
        )!;
        tx.get("characters", metadata.id, (current) =>
          tx.get("previous", metadata.id, (previous) =>
            tx.done(inspectCharacter(metadata, current, previous)),
          ),
        );
      }),
    );
  }
  private checkRevision(metadata: CharacterMetadata, expected: number): void {
    registryInteger(expected, 1);
    if (metadata.revision !== expected)
      throw Error("Character changed in another session; reload required");
  }
  async update(
    id: string,
    expectedRevision: number,
    session: InventorySession,
  ): Promise<CharacterMetadata> {
    const text = serializeCharacter(session),
      prepared = deserializeCharacter(text),
      now = registryInteger(this.now());
    return this.withCharacter(
      id,
      "readwrite",
      (tx, registry, metadata, current, previous) => {
        this.checkRevision(metadata, expectedRevision);
        if (inspectCharacter(metadata, current, previous).kind !== "valid")
          throw Error(
            "Explicit recovery is required before saving this character",
          );
        const next = characterMetadata(
          id,
          metadata.name,
          prepared,
          now,
          expectedRevision + 1,
          metadata,
        );
        tx.put("previous", id, current);
        tx.put("characters", id, { id, revision: next.revision, text });
        tx.put(
          "registry",
          "current",
          nextRegistry(
            registry,
            registry.characters.map((m) => (m.id === id ? next : m)),
          ),
        );
        tx.done(next);
      },
    );
  }
  async activate(id: string, expectedRevision: number): Promise<CharacterLoad> {
    const now = registryInteger(this.now());
    return this.withCharacter(
      id,
      "readwrite",
      (tx, registry, metadata, current, previous) => {
        this.checkRevision(metadata, expectedRevision);
        const loaded = inspectCharacter(metadata, current, previous);
        if (loaded.kind !== "valid")
          throw Error(
            "Character cannot be activated; explicit recovery or selection required",
          );
        const at = Math.max(
          now,
          metadata.updatedAt,
          ...registry.characters.map((m) => m.lastPlayedAt ?? 0),
        );
        const next = { ...metadata, lastPlayedAt: at, updatedAt: at };
        tx.put(
          "registry",
          "current",
          nextRegistry(
            registry,
            registry.characters.map((m) => (m.id === id ? next : m)),
            id,
          ),
        );
        tx.done({ ...loaded, metadata: next });
      },
    );
  }
  async recover(id: string, expectedRevision: number): Promise<CharacterLoad> {
    const now = registryInteger(this.now());
    return this.withCharacter(
      id,
      "readwrite",
      (tx, registry, metadata, current, previous) => {
        this.checkRevision(metadata, expectedRevision);
        const loaded = inspectCharacter(metadata, current, previous);
        if (loaded.kind !== "recoverable")
          throw Error("No validated backup for this character");
        // Recovery may restore an earlier level/class; archive current and its metadata together.
        const next = characterMetadata(
          id,
          metadata.name,
          loaded.session,
          now,
          expectedRevision + 1,
        );
        const restored = {
          ...next,
          createdAt: metadata.createdAt,
          updatedAt: Math.max(now, metadata.updatedAt),
          lastPlayedAt: metadata.lastPlayedAt,
        };
        tx.put("archives", `recovery:${id}:${expectedRevision}`, {
          metadata,
          current,
          previous,
        });
        tx.put("characters", id, {
          id,
          revision: restored.revision,
          text: characterRecord(previous, id)!.text,
        });
        tx.put(
          "registry",
          "current",
          nextRegistry(
            registry,
            registry.characters.map((m) => (m.id === id ? restored : m)),
          ),
        );
        tx.done({ kind: "valid", metadata: restored, session: loaded.session });
      },
    );
  }
  async delete(id: string, expectedRevision: number): Promise<void> {
    return this.withCharacter(
      id,
      "readwrite",
      (tx, registry, metadata, current, previous) => {
        this.checkRevision(metadata, expectedRevision);
        tx.put("archives", `deleted:${id}`, { metadata, current, previous });
        tx.remove("characters", id);
        tx.remove("previous", id);
        tx.put(
          "registry",
          "current",
          nextRegistry(
            registry,
            registry.characters.filter((m) => m.id !== id),
            registry.lastPlayed === id ? null : registry.lastPlayed,
          ),
        );
        tx.done(undefined);
      },
    );
  }
  async migrateLegacy(name = "Legacy Adventurer"): Promise<LegacyMigration> {
    characterName(name);
    const legacy = new InventoryStorage(undefined, this.legacyDatabase);
    let archive: Awaited<ReturnType<InventoryStorage["readArchive"]>>;
    try {
      archive = await legacy.readArchive();
    } finally {
      legacy.close();
    }
    const source = archive.current as
      { revision?: unknown; text?: unknown } | undefined;
    return this.transaction(STORES, "readwrite", (tx) =>
      tx.get("registry", "current", (value) => {
        const registry = storedRegistry(value);
        tx.get("archives", "legacy-migration-v1", (value) => {
          if (value !== undefined) {
            const receipt = value as {
              version?: unknown;
              source?: unknown;
              revision?: unknown;
              text?: unknown;
              id?: unknown;
            };
            if (
              !receipt ||
              receipt.version !== 1 ||
              receipt.id !== LEGACY_CHARACTER_ID ||
              receipt.source !== this.legacyDatabase
            )
              throw Error(
                "Invalid legacy migration receipt; originals retained",
              );
            if (
              receipt.revision !== source?.revision ||
              receipt.text !== source?.text
            )
              throw Error(
                "Legacy source changed since migration; both histories retained, explicit reconciliation required",
              );
            const deleted = !registry.characters.some(
              (m) => m.id === LEGACY_CHARACTER_ID,
            );
            if (deleted) {
              tx.get(
                "archives",
                `deleted:${LEGACY_CHARACTER_ID}`,
                (tombstone) => {
                  if (tombstone === undefined)
                    throw Error(
                      "Migrated character is missing; original archive retained, recovery required",
                    );
                  tx.done({
                    kind: "already-migrated",
                    id: LEGACY_CHARACTER_ID,
                    deleted: true,
                  });
                },
              );
            } else
              tx.done({
                kind: "already-migrated",
                id: LEGACY_CHARACTER_ID,
                deleted: false,
              });
            return;
          }
          if (
            archive.current === undefined &&
            archive.previous === undefined &&
            archive.quarantine === undefined
          ) {
            tx.done({ kind: "empty" });
            return;
          }
          if (!source || typeof source.text !== "string")
            throw Error(
              "Legacy current is corrupt or missing; recover explicitly before migration",
            );
          const revision = registryInteger(source.revision, 1),
            session = deserializeCharacter(source.text);
          const metadata = characterMetadata(
            LEGACY_CHARACTER_ID,
            name,
            session,
            this.now(),
            revision,
          );
          if (registry.characters.length >= CHARACTER_CAPACITY)
            throw Error(
              "All eight character slots are occupied; legacy retained",
            );
          tx.get("archives", `identity:${LEGACY_CHARACTER_ID}`, (identity) => {
            if (
              identity !== undefined ||
              registry.characters.some((m) => m.id === LEGACY_CHARACTER_ID)
            )
              throw Error(
                "Legacy character identity already used; originals retained",
              );
            tx.get("characters", LEGACY_CHARACTER_ID, (current) => {
              if (current !== undefined)
                throw Error(
                  "Legacy target already occupied; original retained",
                );
              tx.put("characters", LEGACY_CHARACTER_ID, {
                id: LEGACY_CHARACTER_ID,
                revision,
                text: source.text,
              });
              const previous = archive.previous as
                { revision?: unknown; text?: unknown } | undefined;
              if (
                previous &&
                typeof previous.text === "string" &&
                Number.isSafeInteger(previous.revision) &&
                Number(previous.revision) > 0
              )
                tx.put("previous", LEGACY_CHARACTER_ID, {
                  id: LEGACY_CHARACTER_ID,
                  revision: previous.revision,
                  text: previous.text,
                });
              tx.put("archives", `identity:${LEGACY_CHARACTER_ID}`, {
                id: LEGACY_CHARACTER_ID,
              });
              tx.put("archives", "legacy-migration-v1", {
                version: 1,
                id: LEGACY_CHARACTER_ID,
                source: this.legacyDatabase,
                revision,
                text: source.text,
                archive,
              });
              tx.put(
                "registry",
                "current",
                nextRegistry(registry, [...registry.characters, metadata]),
              );
              tx.done({
                kind: "migrated",
                id: LEGACY_CHARACTER_ID,
                deleted: false,
              });
            });
          });
        });
      }),
    );
  }
  /** Explicit export keeps deleted/damaged records and migration rollback material reviewable. */
  async archive(key: string): Promise<unknown> {
    return this.transaction(["archives"], "readonly", (tx) =>
      tx.get("archives", key, (value) => tx.done(value)),
    );
  }
}

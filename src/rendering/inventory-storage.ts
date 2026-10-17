import {
  inspectSnapshots,
  serializeCharacter,
  type SnapshotPair,
} from "../simulation/inventory-save";
import type { InventorySession } from "../simulation/inventory-world";
import type { Navigation } from "../world/navigation";
interface StoredSnapshot {
  revision: number;
  text: string;
}
export type StorageLoad = SnapshotPair & { revision: number };
function stored(value: unknown): StoredSnapshot | null {
  if (value === undefined) return null;
  if (!value || typeof value !== "object")
    throw Error("Invalid storage record; original retained");
  const v = value as Partial<StoredSnapshot>;
  if (
    !Number.isSafeInteger(v.revision) ||
    (v.revision ?? -1) < 1 ||
    typeof v.text !== "string"
  )
    throw Error("Invalid storage record; original retained");
  return v as StoredSnapshot;
}
/** Single transaction writes current + previous; compare-and-swap prevents stale tabs overwriting saves. */
export class InventoryStorage {
  private db: IDBDatabase | null = null;
  private revision = 0;
  private writable = false;
  constructor(
    private nav?: Navigation,
    private name = "hollowbane-character-v1",
  ) {}
  async open(): Promise<void> {
    if (this.db) return;
    if (typeof indexedDB === "undefined")
      throw Error("IndexedDB unavailable; use snapshot export");
    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.name, 1);
      let blocked = false;
      request.onupgradeneeded = () =>
        request.result.createObjectStore("snapshots");
      request.onerror = () =>
        reject(request.error ?? Error("Cannot open character storage"));
      request.onblocked = () => {
        blocked = true;
        reject(Error("Character storage blocked by another tab"));
      };
      request.onsuccess = () => {
        if (blocked) {
          request.result.close();
          return;
        }
        resolve(request.result);
      };
    });
    this.db.onversionchange = () => this.close();
  }
  close(): void {
    this.db?.close();
    this.db = null;
    this.writable = false;
  }
  private async read(): Promise<{
    current: StoredSnapshot | null;
    previous: StoredSnapshot | null;
  }> {
    await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction("snapshots", "readonly"),
        store = tx.objectStore("snapshots");
      const current = store.get("current"),
        previous = store.get("previous");
      tx.onabort = () => reject(tx.error ?? Error("Character read failed"));
      tx.onerror = () => {
        /* onabort reports transaction failure. */
      };
      tx.oncomplete = () => {
        try {
          resolve({
            current: stored(current.result),
            previous: stored(previous.result),
          });
        } catch (e) {
          reject(e);
        }
      };
    });
  }
  async load(): Promise<StorageLoad> {
    this.writable = false;
    const { current, previous } = await this.read();
    const result = inspectSnapshots(
      current?.text ?? null,
      previous?.text ?? null,
      this.nav,
    );
    this.revision = current?.revision ?? 0;
    this.writable = result.kind === "valid" || result.kind === "empty";
    return { ...result, revision: this.revision };
  }
  async save(session: InventorySession): Promise<number> {
    if (!this.writable)
      throw Error("Load or explicitly recover character storage before saving");
    const text = serializeCharacter(session, this.nav);
    return this.write(text, false);
  }
  /** Explicit user recovery preserves the damaged current in quarantine before replacing it. */
  async recover(): Promise<InventorySession> {
    const { current, previous } = await this.read();
    const result = inspectSnapshots(
      current?.text ?? null,
      previous?.text ?? null,
      this.nav,
    );
    if (result.kind !== "recoverable")
      throw Error("No validated previous snapshot to recover");
    if ((current?.revision ?? 0) !== this.revision)
      throw Error("Character storage changed in another tab; reload required");
    await this.write(serializeCharacter(result.session, this.nav), true);
    this.writable = true;
    return result.session;
  }
  private write(text: string, recovery: boolean): Promise<number> {
    if (!this.db) return Promise.reject(Error("Character storage closed"));
    const expected = this.revision;
    if (expected >= Number.MAX_SAFE_INTEGER)
      return Promise.reject(Error("Save revision limit reached"));
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction("snapshots", "readwrite"),
        store = tx.objectStore("snapshots");
      let failure: Error | null = null;
      const get = store.get("current");
      get.onsuccess = () => {
        try {
          const current = stored(get.result);
          if ((current?.revision ?? 0) !== expected)
            throw Error(
              "Character storage changed in another tab; local items retained, reload required",
            );
          if (current) store.put(current, recovery ? "quarantine" : "previous");
          store.put(
            { revision: expected + 1, text } satisfies StoredSnapshot,
            "current",
          );
        } catch (e) {
          failure = e instanceof Error ? e : Error("Invalid character storage");
          tx.abort();
        }
      };
      tx.onerror = () => {
        /* onabort handles failure without changing in-memory revision. */
      };
      tx.onabort = () =>
        reject(
          failure ??
            tx.error ??
            Error("Character save transaction failed; local items retained"),
        );
      tx.oncomplete = () => {
        this.revision = expected + 1;
        resolve(this.revision);
      };
    });
  }
}

import { CharacterStorage } from "./character-storage";
import type { InventoryCheckpoint, StorageLoad } from "./inventory-storage";
import type { InventorySession } from "../simulation/inventory-world";
import { characterId } from "../simulation/character-registry";

/** One immutable owner per gameplay instance. Never falls back to legacy or another slot. */
export class CharacterCheckpoint implements InventoryCheckpoint {
  private store = new CharacterStorage();
  private revision = 0;
  private writable = false;
  constructor(private readonly id: string) {
    characterId(id);
  }
  lock(): void {
    this.writable = false;
  }
  close(): void {
    this.lock();
    this.store.close();
  }
  async load(): Promise<StorageLoad> {
    this.lock();
    const result = await this.store.load(this.id);
    this.revision = result.metadata.revision;
    return { ...result, revision: this.revision };
  }
  /** Called only after the runtime has accepted/prepared the complete snapshot. */
  async accepted(): Promise<void> {
    await this.store.activate(this.id, this.revision);
    this.writable = true;
  }
  async save(session: InventorySession): Promise<number> {
    if (!this.writable)
      throw Error("Character is not activated; return to character selection");
    const metadata = await this.store.update(this.id, this.revision, session);
    this.revision = metadata.revision;
    return this.revision;
  }
  async recover(): Promise<InventorySession> {
    this.lock();
    const result = await this.store.recover(this.id, this.revision);
    this.revision = result.metadata.revision;
    if (result.kind !== "valid") throw Error("No validated character backup");
    return result.session;
  }
}

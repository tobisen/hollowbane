import { createCharacterInventory } from "../simulation/equipment";
import {
  captureEquipmentBase,
  deriveEquipment,
  applyEquipment,
  type DerivedEquipment,
  type EquipmentBase,
} from "../simulation/equipment-stats";
import {
  reserveOwned,
  validateSession,
  type InventorySession,
} from "../simulation/inventory-world";
import type { InventoryResult } from "../simulation/inventory-grid";
import type { CombatActor } from "../simulation/combat";
import type { LootWorld } from "../simulation/world-loot";
export class InventoryRuntime {
  character = createCharacterInventory();
  derived: DerivedEquipment;
  base: EquipmentBase;
  private actor: CombatActor;
  private key = "";
  private speed = 0;
  private weapon: CombatActor["weapon"] = "melee";
  listeners = new Set<(reason: string) => void>();
  constructor(
    private getActor: () => CombatActor,
    private getMana: () => { mana: number; maxMana: number } | undefined,
    private getLoot: () => LootWorld,
    private setLoot: (world: LootWorld) => void,
  ) {
    this.actor = getActor();
    this.base = captureEquipmentBase(this.actor);
    this.derived = deriveEquipment(this.character, this.base);
  }
  session(): InventorySession {
    return { character: this.character, loot: this.getLoot() };
  }
  sync(speed = this.speed, weapon = this.weapon): void {
    this.speed = speed;
    this.weapon = weapon;
    const actor = this.getActor();
    if (actor !== this.actor) {
      this.actor = actor;
      this.base = captureEquipmentBase(actor);
      this.key = "";
    }
    const key = `${this.character.revision}/${speed}/${weapon}`;
    if (key !== this.key) {
      this.derived = deriveEquipment(
        this.character,
        { ...this.base, weapon, range: weapon === "melee" ? 1.05 : 6 },
        speed,
      );
      applyEquipment(this.derived, actor, this.getMana());
      this.key = key;
    }
    if (actor.controller.timeline.phase === "idle") {
      actor.weapon = this.derived.weapon;
      actor.range = this.derived.range;
      actor.attackSpeed = this.derived.attackSpeed;
    }
  }
  commit(result: InventoryResult<InventorySession>, reason = "change"): string {
    if (!result.ok) return result.reason;
    this.character = result.value.character;
    this.setLoot(reserveOwned(result.value).loot);
    this.key = "";
    this.sync();
    for (const listener of this.listeners) listener(reason);
    return "Success";
  }
  restore(session: InventorySession): void {
    validateSession(session);
    this.commit({ ok: true, value: session }, "load");
  }
}

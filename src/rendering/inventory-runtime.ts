import type { MonsterExperience } from "../simulation/monster-experience";
import type { EquipmentRequirementContext } from "../simulation/equipment-requirements";
import {
  allocateAttributes,
  type Attribute,
  attributeValues,
  type CharacterAttributes,
} from "../simulation/attributes";
import {
  reconcileEquipmentRequirements,
  createCharacterInventory,
} from "../simulation/equipment";
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
  private recovery = 0;
  private weapon: CombatActor["weapon"] = "melee";
  listeners = new Set<(reason: string) => void>();
  constructor(
    private getActor: () => CombatActor,
    private getMana: () =>
      { mana: number; maxMana: number; castSpeed?: number } | undefined,
    private getLoot: () => LootWorld,
    private setLoot: (world: LootWorld) => void,
    initialLevel = 12,
    private getAttributes: () => CharacterAttributes | undefined = () =>
      undefined,
    private getProgression: () => MonsterExperience | undefined = () =>
      undefined,
  ) {
    this.character = createCharacterInventory(initialLevel);
    this.actor = getActor();
    this.base = captureEquipmentBase(
      this.actor,
      getMana()?.maxMana ?? 100,
      getMana()?.castSpeed ?? 0,
    );
    const attributes = getAttributes();
    if (attributes) this.base.attributes = attributeValues(attributes);
    this.derived = deriveEquipment(this.character, this.base);
  }
  progression(): MonsterExperience | undefined {
    return this.getProgression();
  }
  allocate(attribute: Attribute, expected: CharacterAttributes): string {
    const xp = this.progression();
    if (!xp || xp.attributes !== expected)
      return "Character changed; review points and retry.";
    try {
      const attributes = allocateAttributes(expected, { [attribute]: 1 });
      const requirements = {
        ...this.requirements(),
        attributes: attributeValues(attributes),
      };
      const reconciled = reconcileEquipmentRequirements(
        this.character,
        this.character.level,
        requirements,
      );
      if (!reconciled.ok) return reconciled.reason;
      // Prepare/validate all derived data before committing either half of the transaction.
      deriveEquipment(reconciled.value, {
        ...this.base,
        attributes: requirements.attributes,
      });
      xp.attributes = attributes;
      this.character = reconciled.value;
      this.key = "";
      this.sync();
      for (const listener of this.listeners) listener("attributes");
      return `Allocated 1 ${attribute}.`;
    } catch (error) {
      return error instanceof Error
        ? error.message
        : "Allocation rejected; state unchanged.";
    }
  }
  requirements(): EquipmentRequirementContext {
    const state = this.getAttributes();
    return {
      attributes: state
        ? attributeValues(state)
        : { strength: 0, dexterity: 0 },
    };
  }
  session(): InventorySession {
    return {
      character: this.character,
      loot: this.getLoot(),
      requirements: this.requirements(),
    };
  }
  sync(
    speed = this.speed,
    weapon = this.weapon,
    recovery = this.recovery,
  ): void {
    this.speed = speed;
    this.recovery = recovery;
    this.weapon = weapon;
    const actor = this.getActor();
    if (actor !== this.actor) {
      this.actor = actor;
      this.base = captureEquipmentBase(
        actor,
        this.getMana()?.maxMana ?? 100,
        this.getMana()?.castSpeed ?? 0,
      );
      this.key = "";
    }
    const attributes = this.getAttributes();
    if (attributes) this.base.attributes = attributeValues(attributes);
    else delete this.base.attributes;
    const values = this.base.attributes;
    const key = `${this.character.revision}/${speed}/${weapon}/${recovery}/${values ? `${values.strength}/${values.dexterity}/${values.vitality}/${values.energy}` : ""}`;
    if (key !== this.key) {
      this.derived = deriveEquipment(
        this.character,
        {
          ...this.base,
          weapon,
          range: weapon === "melee" ? 1.05 : 6,
          recoveryBonus: this.base.recoveryBonus + recovery,
        },
        speed,
      );
      applyEquipment(this.derived, actor, this.getMana());
      this.key = key;
    }
    if (actor.controller.timeline.phase === "idle") {
      actor.weapon = this.derived.weapon;
      actor.range = this.derived.range;
      actor.attackSpeed = this.derived.attackSpeed;
      actor.recoveryBonus = this.derived.recoveryBonus;
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

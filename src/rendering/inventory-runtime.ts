import {
  allocateSkillRanks,
  type SkillProgression,
} from "../simulation/skill-progression";
import { DEFAULT_XP_CURVE } from "../simulation/experience";
import {
  progressionAtLevel,
  validateProgression,
} from "../simulation/progression-save";
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
  private boundProgression: MonsterExperience | undefined;
  private lastXp = -1;
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
    progressionFloor = 1,
  ) {
    this.character = createCharacterInventory(initialLevel);
    this.actor = getActor();
    const xp = this.progression();
    this.boundProgression = xp;
    if (xp) {
      if (progressionFloor > 1 && xp.character.totalXp === 0) {
        const initial = progressionAtLevel(progressionFloor);
        xp.character = initial.character;
        xp.attributes = initial.attributes;
        xp.skills = initial.skills;
      }
      this.character.level = xp.character.level;
      this.lastXp = xp.character.totalXp;
    }
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
  /** Domain API only; selection and input routing remain separate. */
  allocateSkills(
    request: Readonly<Record<string, number>>,
    expected: SkillProgression,
  ): string {
    const xp = this.progression();
    if (!xp || xp.skills !== expected)
      return "Character changed; review skills and retry.";
    try {
      const skills = allocateSkillRanks(expected, xp.character.level, request);
      xp.skills = skills;
      for (const listener of this.listeners) listener("skills");
      return "Allocated skill points.";
    } catch (error) {
      return error instanceof Error
        ? error.message
        : "Skill allocation rejected.";
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
    this.sync();
    const xp = this.progression();
    if (xp && JSON.stringify(xp.curve) !== JSON.stringify(DEFAULT_XP_CURVE))
      throw Error("Unsupported XP curve for save");
    return {
      ...(xp
        ? {
            progression: validateProgression({
              curve: "xp-v1",
              character: xp.character,
              attributes: xp.attributes,
              skills: xp.skills,
            }),
          }
        : {}),
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
    const xp = this.progression();
    if (xp && xp !== this.boundProgression) {
      if (this.boundProgression) {
        xp.character = this.boundProgression.character;
        xp.attributes = this.boundProgression.attributes;
        xp.skills = this.boundProgression.skills;
      }
      this.boundProgression = xp;
    }
    if (xp && this.character.level !== xp.character.level)
      this.character = { ...this.character, level: xp.character.level };
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
    if (xp && this.lastXp !== xp.character.totalXp) {
      this.lastXp = xp.character.totalXp;
      for (const listener of this.listeners) listener("progression");
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
    const snapshot = validateProgression(
      session.progression ?? progressionAtLevel(session.character.level),
    );
    const requirements = {
      ...this.requirements(),
      attributes: attributeValues(snapshot.attributes),
    };
    const candidate = { ...session, progression: snapshot, requirements };
    validateSession(candidate);
    deriveEquipment(candidate.character, {
      ...this.base,
      attributes: requirements.attributes,
    });
    const xp = this.progression();
    if (xp) {
      xp.character = snapshot.character;
      xp.attributes = snapshot.attributes;
      xp.skills = snapshot.skills;
    }
    this.boundProgression = xp;
    this.lastXp = snapshot.character.totalXp;
    this.commit({ ok: true, value: candidate }, "load");
  }
}

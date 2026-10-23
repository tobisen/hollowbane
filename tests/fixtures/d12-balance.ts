import { createD08CampaignFixture } from "./d08-campaign";
import type { ClassId } from "../../src/simulation/character-classes";
import {
  allocateSkillRanks,
  assignSkill,
} from "../../src/simulation/skill-progression";
import { createCombat, stepCombat } from "../../src/simulation/combat";
import { commandCombat } from "../../src/simulation/combat-targeting";
import {
  applyEquipment,
  captureEquipmentBase,
  deriveEquipment,
} from "../../src/simulation/equipment-stats";
import { attributeValues } from "../../src/simulation/attributes";
import {
  createSkills,
  actorSkill,
  requestSkill,
  skillHooks,
} from "../../src/simulation/skills";
import { WorldEncounterRuntime } from "../../src/simulation/world-encounter-runtime";
import { CRYPT_FINALE_ACTOR } from "../../src/simulation/world-encounters";
import { bossHooks } from "../../src/simulation/boss";
import { areaNavigation } from "../../src/world/navigation";
import { consumeLootDeaths } from "../../src/simulation/world-loot";
import { itemContentForVersion } from "../../src/simulation/item-content";

export const D12_PRIMARY = {
  warrior: ["warrior-arms-foundation", "iron-fan"],
  sorcerer: ["sorcerer-ember-foundation", "ember-lance"],
  ranger: ["ranger-wilds-foundation", "briar-edge"],
} as const;
/** Earned D08 checkpoints, one legal primary rank; no extra XP, gear or resources.
 * This is an isolated stationary finale budget, not a continuous pack-AI expedition. */
export function createD12Fixture(classId: ClassId) {
  const f = createD08CampaignFixture(classId),
    [node, skill] = D12_PRIMARY[classId];
  if (!f.world.experience.skills.ranks[node])
    f.world.experience.skills = allocateSkillRanks(
      f.world.experience.skills,
      f.world.experience.character.level,
      { [node]: 1 },
    );
  f.world.experience.skills = assignSkill(f.world.experience.skills, 0, skill);
  return f;
}
export function measureD12Finale(f: ReturnType<typeof createD12Fixture>) {
  const world = f.world,
    player = world.actors[0]!,
    classId = world.experience.skills.classId!,
    skill = D12_PRIMARY[classId][1];
  f.session.restoreDeaths(f.inventory.loot, world);
  world.actors = [player];
  const runtime = new WorldEncounterRuntime(
    world,
    f.session.travel.layout,
    f.inventory.loot.deaths,
    true,
  );
  player.controller.walker.position = { ...f.session.travel.layout.spawn };
  runtime.activate();
  const target = world.actors.find((a) => a.id === CRYPT_FINALE_ACTOR)!;
  world.actors = [player, target];
  const boss = runtime.boss!,
    nav = areaNavigation(f.session.travel.layout.map),
    skills = createSkills(world),
    user = skills.users[0]!;
  applyEquipment(
    deriveEquipment(f.inventory.character, {
      ...captureEquipmentBase(createCombat().actors[0]!),
      attributes: attributeValues(world.experience.attributes),
    }),
    player,
    user,
  );
  player.hp = player.maxHp;
  user.mana = user.maxMana;
  player.controller.walker.position = {
    x: target.controller.walker.position.x + 1.2,
    y: target.controller.walker.position.y,
  };
  const firstTick = world.tick,
    xp = world.experience.character.totalXp,
    sequence = f.inventory.loot.sequence;
  const phaseTicks: number[] = [],
    warnings = new Set<string>();
  let casts = 0,
    lowestMana = user.mana;
  for (let i = 0; i < 3600 && !boss.state.complete && player.hp > 0; i++) {
    if (phaseTicks[boss.state.phase] === undefined)
      phaseTicks[boss.state.phase] = world.tick - firstTick;
    if (boss.state.telegraph) warnings.add(boss.state.telegraph.attack);
    const ability = actorSkill(skills, 0, skill)!;
    if (!user.cast && player.controller.timeline.phase === "idle") {
      if (
        user.mana >= ability.mana &&
        (user.cooldowns[skill] ?? 0) <= world.tick
      ) {
        const a = player.controller.walker.position,
          b = target.controller.walker.position;
        requestSkill(skills, {
          actor: 0,
          skill,
          target: target.id,
          direction: { x: b.x - a.x, y: b.y - a.y },
        });
      } else
        player.controller = commandCombat(player.controller, {
          kind: "attack",
          target: target.id,
          repeat: false,
        });
    }
    stepCombat(
      world,
      nav,
      { x: 0, y: 0 },
      1,
      bossHooks(
        world,
        boss.definition,
        boss.state,
        boss.arena,
        nav,
        skillHooks(skills, nav),
      ),
    );
    casts += skills.events.filter(
      (e) => e.tick === world.tick && e.kind === "start" && e.actor === 0,
    ).length;
    lowestMana = Math.min(lowestMana, user.mana);
    f.session.consumeQuestDeaths(world);
    consumeLootDeaths(
      f.inventory.loot,
      world,
      nav,
      undefined,
      itemContentForVersion(3),
    );
  }
  return {
    classId,
    seed: 42,
    level: world.experience.character.level,
    ticks: world.tick - firstTick,
    hp: player.hp,
    maxHp: player.maxHp,
    mana: user.mana,
    maxMana: user.maxMana,
    lowestMana,
    casts,
    phaseTicks,
    warnings: [...warnings],
    strikes: boss.state.attacks,
    interrupts: boss.state.events.filter((e) => e.kind === "interrupt").length,
    complete: boss.state.complete,
    xp: world.experience.character.totalXp - xp,
    lootRolls: f.inventory.loot.sequence - sequence,
  };
}

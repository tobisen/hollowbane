import { createD06CampaignFixture } from "./d06-campaign";
import { ACT1_FINALE, QUESTS } from "../../src/simulation/quests";
import { cryptBossSpawn } from "../../src/simulation/crypt-boss";
import { planWorldEncounters } from "../../src/simulation/world-encounters";
import { allocateAttributes } from "../../src/simulation/attributes";
import type { ClassId } from "../../src/simulation/character-classes";
import { areaNavigation, findPath } from "../../src/world/navigation";

/** Constructed earned checkpoint: genuine domain duels and rewards, not a live debug hook.
 * Pack AI/continuous expedition survival are covered separately; no finale death is fabricated.
 */
export function createD08CampaignFixture(classId: ClassId = "warrior") {
  const f = createD06CampaignFixture(classId);
  const clear = (count: number) => {
    f.defeat(count, () => {
      const points = f.world.experience.attributes.available;
      f.world.experience.attributes = allocateAttributes(
        f.world.experience.attributes,
        {
          strength: Math.floor(points / 2),
          vitality: points - Math.floor(points / 2),
        },
      );
    });
  };
  const story = QUESTS.filter(
    (q) => q.chapter === "act1" && q.id !== ACT1_FINALE,
  );
  for (let index = 0; index < story.length; index++) {
    if (!f.session.acceptQuest(story[index]!.id))
      throw Error("D08 prerequisite");
    f.travel("forest");
    if (index === 0) clear(15);
    if (index >= 1) f.travel("graveyard");
    // Keep Rhusk alive. All ordinary return-path hostiles are defeated in real duels.
    if (index === 1) clear(17);
    if (index === 2) {
      f.travel("crypt");
      clear(27);
      f.idleAt(f.session.objectivePosition!);
      if (!f.session.interactExpedition(f.world)) throw Error("D08 beacon");
    } else f.treasure();
    if (index === 2) f.travel("graveyard");
    if (index >= 1) f.travel("forest");
    f.travel("camp");
    f.claim(index);
    if (index === 0 && classId === "warrior") f.prepareWarrior();
    if (index === 0 && classId !== "warrior") f.prepareBoots();
  }
  const beforeAccept = f.checkpoint().text;
  if (!f.session.acceptQuest(ACT1_FINALE, f.inventory.loot))
    throw Error("D08 finale");
  f.travel("forest");
  f.travel("graveyard");
  f.travel("crypt");
  f.world.experience.attributes = allocateAttributes(
    f.world.experience.attributes,
    {
      vitality: f.world.experience.attributes.available,
    },
  );
  const layout = f.session.travel.layout;
  const boss = cryptBossSpawn(layout, planWorldEncounters(layout))!;
  const approach = [
    ...findPath(areaNavigation(layout.map), layout.spawn, boss.position),
  ]
    .reverse()
    .find(
      (p) => Math.hypot(p.x - boss.position.x, p.y - boss.position.y) >= 10,
    );
  f.idleAt(approach ?? layout.spawn);
  return {
    ...f,
    get session() {
      return f.session;
    },
    get inventory() {
      return f.inventory;
    },
    beforeAccept,
    boss,
  };
}

import { createCombat, stepCombat } from "../../src/simulation/combat";
import {
  applyEquipment,
  captureEquipmentBase,
  deriveEquipment,
} from "../../src/simulation/equipment-stats";
import { attributeValues } from "../../src/simulation/attributes";
import { WorldEncounterRuntime } from "../../src/simulation/world-encounter-runtime";
import { CRYPT_FINALE_ACTOR } from "../../src/simulation/world-encounters";
import { commandCombat } from "../../src/simulation/combat-targeting";
import { bossHooks } from "../../src/simulation/boss";
import { consumeLootDeaths } from "../../src/simulation/world-loot";
import { itemContentForVersion } from "../../src/simulation/item-content";

/** A genuine deterministic boss fight used only to construct saved-state test fixtures. */
export function fightD08Finale(f: ReturnType<typeof createD08CampaignFixture>) {
  const world = f.world,
    player = world.actors[0]!;
  applyEquipment(
    deriveEquipment(f.inventory.character, {
      ...captureEquipmentBase(createCombat().actors[0]!),
      attributes: attributeValues(world.experience.attributes),
    }),
    player,
  );
  player.hp = player.maxHp;
  // Explicit full derived resources for this isolated domain duel. Browser
  // acceptance separately covers actual restart defaults; no mid-fight healing.
  f.session.restoreDeaths(f.inventory.loot, world);
  world.actors = [player];
  const runtime = new WorldEncounterRuntime(
    world,
    f.session.travel.layout,
    f.inventory.loot.deaths,
    true,
  );
  // Runtime activation requires the player to start outside the safe spawn radius.
  const position = { x: f.boss.position.x + 1.2, y: f.boss.position.y };
  player.controller.walker.position = f.session.travel.layout.spawn;
  runtime.activate();
  player.controller.walker.position = position;
  const boss = runtime.boss!,
    nav = areaNavigation(f.session.travel.layout.map);
  world.actors = [
    player,
    world.actors.find((a) => a.id === CRYPT_FINALE_ACTOR)!,
  ];
  player.controller = commandCombat(player.controller, {
    kind: "attack",
    target: CRYPT_FINALE_ACTOR,
    repeat: true,
  });
  const xp = world.experience.character.totalXp,
    sequence = f.inventory.loot.sequence;
  for (let i = 0; i < 6000 && !boss.state.complete && player.hp > 0; i++) {
    stepCombat(
      world,
      nav,
      { x: 0, y: 0 },
      1,
      bossHooks(world, boss.definition, boss.state, boss.arena, nav),
    );
    f.session.consumeQuestDeaths(world);
    consumeLootDeaths(
      f.inventory.loot,
      world,
      nav,
      undefined,
      itemContentForVersion(3),
    );
  }
  if (!boss.state.complete || player.hp <= 0)
    throw Error("D08 fixture boss fight failed");
  return { world, player, boss, xp, sequence };
}

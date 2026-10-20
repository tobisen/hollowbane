import {
  createCombat,
  stepCombat,
  type CombatEvent,
} from "../../src/simulation/combat";
import {
  commandCombat,
  createController,
} from "../../src/simulation/combat-targeting";
import { createWalker } from "../../src/simulation/locomotion";
import { WorldSession } from "../../src/simulation/world-session";
import { WorldEncounterRuntime } from "../../src/simulation/world-encounter-runtime";
import { QUESTS } from "../../src/simulation/quests";
import { CAMP_NPCS } from "../../src/simulation/camp-dialogue";
import {
  createInventorySession,
  pickupDrop,
  identifyOwned,
  moveOwned,
} from "../../src/simulation/inventory-world";
import {
  deserializeCharacter,
  serializeCharacter,
} from "../../src/simulation/inventory-save";
import {
  allocateSkillRanks,
  assignSkill,
  chooseSkillClass,
} from "../../src/simulation/skill-progression";
import {
  allocateAttributes,
  attributeValues,
} from "../../src/simulation/attributes";
import {
  applyEquipment,
  captureEquipmentBase,
  deriveEquipment,
} from "../../src/simulation/equipment-stats";
import { consumeLootDeaths } from "../../src/simulation/world-loot";
import { itemContentForVersion } from "../../src/simulation/item-content";
import {
  areaNavigation,
  canWalk,
  segmentWalkable,
} from "../../src/world/navigation";
import type { ClassId } from "../../src/simulation/character-classes";

const story = QUESTS.filter((q) => q.chapter === "act1");
function requireFixture(value: unknown, message: string): asserts value {
  if (!value) throw Error(`D06 fixture: ${message}`);
}

/**
 * Constructs domain checkpoints, not a continuous survivor/pack-AI playthrough.
 * Each recorded kill comes from a vulnerable player's timed basic attacks in an
 * isolated duel, using the generated encounter's unmodified health/damage/XP.
 * Positions and normal full resources are explicitly constructed per duel;
 * saved checkpoints do not store HP, matching the application's load policy.
 * Browser combat separately covers live AI and continuous survival.
 */
export function createD06CampaignFixture(classId: ClassId = "warrior") {
  let session = new WorldSession(undefined, 42, 2);
  let inventory = createInventorySession(42);
  const world = createCombat(42);
  world.actors = [world.actors[0]!];
  world.experience.skills = chooseSkillClass(world.experience.skills, classId);
  inventory.character.level = 1;
  const base = captureEquipmentBase(world.actors[0]!);
  const provenance: {
    deaths: number[];
    visited: string[];
    damageEvents: number;
    playerDamage: number;
  } = {
    deaths: [],
    visited: ["ashen-refuge"],
    damageEvents: 0,
    playerDamage: 0,
  };
  const nav = () => areaNavigation(session.travel.layout.map);
  const idleAt = (position: { x: number; y: number }) => {
    requireFixture(canWalk(nav(), position), "checkpoint position walkable");
    world.actors[0]!.controller = createController(createWalker(position));
  };
  const travel = (exit: string) => {
    const edge = session.travel.layout.exits.find((e) => e.id === exit);
    requireFixture(edge, `exit ${exit}`);
    idleAt({ ...edge.trigger });
    requireFixture(
      session.transition(world, inventory.loot),
      `transition ${exit}`,
    );
    provenance.visited.push(session.travel.state.area);
  };
  const checkpoint = () => {
    inventory.character.level = world.experience.character.level;
    inventory.progression = {
      curve: "xp-v1",
      character: world.experience.character,
      attributes: world.experience.attributes,
      skills: world.experience.skills,
    };
    inventory.exploration = session.capture(
      world.actors[0]!.controller.walker.position,
      inventory.loot,
    );
    const text = serializeCharacter(inventory);
    const loaded = deserializeCharacter(text);
    session = new WorldSession(loaded.exploration);
    inventory = loaded;
    session.restoreDeaths(inventory.loot, world);
    return { text, loaded };
  };
  const defeat = (count = 2) => {
    const generated = createCombat(42);
    generated.actors = [generated.actors[0]!];
    generated.actors[0]!.controller.walker.position = {
      ...session.travel.layout.spawn,
    };
    const encounters = new WorldEncounterRuntime(
      generated,
      session.travel.layout,
      inventory.loot.deaths,
    );
    encounters.activate();
    // The enemy selector is stable; combat difficulty/health is never rewritten.
    const targets = generated.actors
      .filter((a) => a.kind === "hostile")
      .sort((a, b) => a.maxHp - b.maxHp || a.id - b.id)
      .slice(0, count);
    requireFixture(
      targets.length === count,
      "enough surviving generated encounters",
    );
    for (const target of targets) {
      const duel = createCombat(42);
      duel.experience = world.experience;
      const player = duel.actors[0]!;
      applyEquipment(
        deriveEquipment(inventory.character, {
          ...base,
          attributes: attributeValues(world.experience.attributes),
        }),
        player,
      );
      // Resources are restored on loading a checkpoint in the actual app too.
      player.hp = player.maxHp;
      const center = session.travel.layout.spawn;
      const offset = [
        { x: 0.7, y: 0 },
        { x: -0.7, y: 0 },
        { x: 0, y: 0.7 },
      ]
        .map((p) => ({ x: center.x + p.x, y: center.y + p.y }))
        .find((p) => segmentWalkable(nav(), center, p));
      requireFixture(offset, "duel has a clear combat segment");
      player.controller = createController(createWalker({ ...center }));
      target.controller = createController(createWalker(offset));
      duel.actors = [player, target];
      player.controller = commandCombat(player.controller, {
        kind: "attack",
        target: target.id,
        repeat: true,
      });
      const events: CombatEvent[] = [];
      // Both stationary combatants are already within basic attack range on a
      // verified clear segment. The duel has no navigation responsibility.
      const duelNavigation = { boundary: nav().boundary, obstacles: [] };
      for (
        let tick = 0;
        tick < 3000 && target.hp > 0 && player.hp > 0;
        tick++
      ) {
        stepCombat(duel, duelNavigation);
        events.push(...duel.events.filter((e) => e.tick === duel.tick));
      }
      requireFixture(
        player.controller.walker.position.x === center.x &&
          player.controller.walker.position.y === center.y &&
          target.controller.walker.position.x === offset.x &&
          target.controller.walker.position.y === offset.y,
        "duel remained on verified segment",
      );
      requireFixture(
        player.hp > 0 && target.hp === 0,
        `real duel ${target.id} completed alive (${player.hp}/${target.hp})`,
      );
      const death = events.find(
        (e) => e.kind === "death" && e.target === target.id,
      );
      requireFixture(death, "combat produced death event");
      world.tick += duel.tick;
      world.actors = [player, target];
      world.events = [{ ...death, tick: world.tick }];
      session.consumeQuestDeaths(world);
      consumeLootDeaths(
        inventory.loot,
        world,
        nav(),
        world.events,
        itemContentForVersion(3),
      );
      provenance.deaths.push(target.id);
      provenance.damageEvents += events.filter(
        (e) => e.kind === "damage",
      ).length;
      provenance.playerDamage += events.reduce(
        (total, e) =>
          total + (e.kind === "damage" && e.target === 0 ? e.result.amount : 0),
        0,
      );
      idleAt({ ...center });
    }
  };
  const treasure = () => {
    const c = session.containers[0]!;
    idleAt({ ...c.position });
    requireFixture(
      session.openContainer(
        c.id,
        c.position,
        inventory.loot,
        world.tick,
        itemContentForVersion(3),
      ),
      "cache opened",
    );
    requireFixture(
      !session.openContainer(
        c.id,
        c.position,
        inventory.loot,
        world.tick,
        itemContentForVersion(3),
      ),
      "cache duplicate rejected",
    );
  };
  const claim = (index: number) => {
    const q = story[index]!;
    const npc = CAMP_NPCS.find((n) => n.id === q.returnTo)!;
    idleAt({ ...npc.position });
    session.beginDialogue(npc.id, world);
    const xp = world.experience.character.totalXp;
    const gold = session.containerState.gold;
    requireFixture(
      session
        .claimQuest(q.id, world, inventory.loot)
        .includes("Reward claimed"),
      `claim ${index}`,
    );
    requireFixture(
      world.experience.character.totalXp === xp + q.reward.xp,
      `exact XP ${index}`,
    );
    requireFixture(
      session.containerState.gold === gold + q.reward.gold,
      `exact gold ${index}`,
    );
    requireFixture(
      !session
        .claimQuest(q.id, world, inventory.loot)
        .includes("Reward claimed"),
      `duplicate ${index}`,
    );
    requireFixture(
      world.experience.character.totalXp === xp + q.reward.xp &&
        session.containerState.gold === gold + q.reward.gold,
      `duplicate reward totals ${index}`,
    );
  };
  const prepareWarrior = () => {
    const item = inventory.loot.drops.find(
      (d) => d.item.base === "trail-boots",
    );
    requireFixture(item, "quest boots");
    let result = pickupDrop(
      inventory,
      item.item.id,
      world.actors[0]!.controller.walker.position,
      nav(),
    );
    requireFixture(result.ok, "pick up reward");
    inventory = result.value;
    result = identifyOwned(inventory, item.item.id);
    requireFixture(result.ok, "identify reward");
    inventory = result.value;
    inventory.character.level = world.experience.character.level;
    result = moveOwned(inventory, item.item.id, {
      kind: "equipment",
      slot: "boots",
    });
    requireFixture(result.ok, "equip reward");
    inventory = result.value;
    world.experience.attributes = allocateAttributes(
      world.experience.attributes,
      { vitality: world.experience.attributes.available },
    );
    world.experience.skills = assignSkill(
      allocateSkillRanks(
        world.experience.skills,
        world.experience.character.level,
        { "warrior-arms-foundation": 1 },
      ),
      0,
      "iron-fan",
    );
  };
  return {
    get session() {
      return session;
    },
    get inventory() {
      return inventory;
    },
    world,
    provenance,
    travel,
    defeat,
    treasure,
    claim,
    checkpoint,
    prepareWarrior,
    idleAt,
  };
}

export function createD06Checkpoints() {
  const f = createD06CampaignFixture();
  requireFixture(f.session.acceptQuest(story[0]!.id), "first quest");
  f.travel("forest");
  f.defeat();
  f.treasure();
  f.travel("camp");
  const firstReady = f.checkpoint().text;
  f.claim(0);
  f.prepareWarrior();
  const firstClaimed = f.checkpoint().text;
  requireFixture(f.session.acceptQuest(story[1]!.id), "second quest");
  f.travel("forest");
  f.travel("graveyard");
  const graveyard = f.checkpoint().text;
  f.defeat();
  f.treasure();
  f.travel("forest");
  f.travel("camp");
  const secondReady = f.checkpoint().text;
  f.claim(1);
  const secondClaimed = f.checkpoint().text;
  requireFixture(f.session.acceptQuest(story[2]!.id), "third quest");
  f.travel("forest");
  f.travel("graveyard");
  f.travel("crypt");
  f.defeat();
  f.idleAt({ ...f.session.objectivePosition! });
  const cryptBeacon = f.checkpoint().text;
  requireFixture(f.session.interactExpedition(f.world), "crypt beacon");
  requireFixture(!f.session.interactExpedition(f.world), "beacon duplicate");
  f.travel("graveyard");
  f.travel("forest");
  f.travel("camp");
  const thirdReady = f.checkpoint().text;
  f.claim(2);
  const complete = f.checkpoint().text;
  f.travel("forest");
  f.defeat(13); // The other thirteen authored forest identities, through combat.
  const forestNavigation = f.checkpoint().text;
  return {
    firstReady,
    firstClaimed,
    secondReady,
    secondClaimed,
    thirdReady,
    complete,
    forestNavigation,
    graveyard,
    cryptBeacon,
    provenance: f.provenance,
  };
}

import { createD06CampaignFixture } from "./d06-campaign";
import { QUESTS } from "../../src/simulation/quests";
import { cairnwardenSpawn } from "../../src/simulation/stonebound-miniboss";
import { planWorldEncounters } from "../../src/simulation/world-encounters";
import { areaNavigation, findPath } from "../../src/world/navigation";

/** Earned Warrior, explicit isolated encounter checkpoint; never a live save hook. */
export function createD07MinibossCheckpoint() {
  const f = createD06CampaignFixture();
  f.session.acceptQuest(QUESTS.find((q) => q.chapter === "act1")!.id);
  f.travel("forest");
  f.defeat();
  f.treasure();
  f.travel("camp");
  f.claim(0);
  f.prepareWarrior();
  f.travel("forest");
  f.travel("graveyard");
  const layout = f.session.travel.layout;
  const plan = planWorldEncounters(layout);
  const boss = cairnwardenSpawn(layout, plan)!;
  // Existing fixture real timed duels clear weaker identities; boss stays alive.
  f.defeat(plan.length - 1);
  if (f.inventory.loot.deaths.has(boss.id))
    throw Error("Fixture killed miniboss");
  const route = findPath(
    areaNavigation(layout.map),
    layout.spawn,
    boss.position,
  );
  const approach = [...route]
    .reverse()
    .find(
      (p) => Math.hypot(p.x - boss.position.x, p.y - boss.position.y) >= 10,
    );
  f.idleAt(approach ?? layout.spawn);
  return { text: f.checkpoint().text, id: boss.id };
}

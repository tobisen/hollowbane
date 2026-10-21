import {
  advanceExpedition,
  newExpedition,
  migrateExpedition,
  EXPEDITION_REWARD,
} from "./world-expedition";
import { grantCharacterXp } from "./monster-experience";
import {
  QUESTS,
  ACT1_FINALE,
  newQuestState,
  acceptQuest,
  trackQuest,
  advanceQuests,
  claimedQuest,
  type QuestEvent,
} from "./quests";
import { questRewardItem } from "./quest-rewards";
import { CRYPT_FINALE_ACTOR } from "./world-encounters";
import { placeLoot } from "./world-loot";
import { areaNavigation } from "../world/navigation";
import {
  CAMP_NPCS,
  beginCampDialogue,
  newCampConversations,
} from "./camp-dialogue";
import { discoveryCell, revealDiscovery } from "./world-discovery";
import { planWorldContainers, openWorldContainer } from "./world-containers";
import type { ItemContent } from "./item-content";
import { configureWorldRewards } from "./world-rewards";
import {
  worldLayout,
  layoutFingerprint,
  GENERATED_WORLD_VERSION,
} from "./world-layout";
import { itemTree } from "./item-ownership";
import { WorldTravel } from "./world-travel";
import { stepWorldTravel } from "./world-runtime";
import { AREA_IDS, areaSeed, type AreaId } from "./world";
import {
  restoredPosition,
  validateExploration,
  type ExplorationSnapshot,
} from "./world-save";
import type { CombatWorld } from "./combat";
import type { LootWorld } from "./world-loot";
import type { WorldPoint } from "./world";
/** Only area-local state is parked; item generation keeps one global loot stream. */
export class WorldSession {
  travel: WorldTravel;
  private snapshot: ExplorationSnapshot;
  constructor(
    snapshot?: ExplorationSnapshot,
    seed = 42,
    contentVersion = GENERATED_WORLD_VERSION,
    initialArea: AreaId = "ashen-refuge",
  ) {
    this.snapshot = snapshot
      ? validateExploration(snapshot)
      : {
          version: 2,
          containers: { version: 1, gold: 0, opened: [] },
          contentVersion,
          seed,
          area: initialArea,
          position: worldLayout(initialArea, seed, contentVersion).spawn,
          visited: [initialArea],
          areas: AREA_IDS.map((id) => ({
            id,
            seed: areaSeed(seed, id),
            ...(contentVersion === 2
              ? {
                  layoutFingerprint: layoutFingerprint(
                    worldLayout(id, seed, contentVersion),
                  ),
                }
              : {}),
            drops: [],
            deaths: [],
          })),
        };
    // Explicit nested-state migration; saved map versions/fingerprints are retained.
    if (this.snapshot.version === 1)
      this.snapshot = {
        ...this.snapshot,
        version: 2,
        containers: { version: 1, gold: 0, opened: [] },
      };
    if (this.snapshot.version === 2)
      this.snapshot = {
        ...this.snapshot,
        version: 3,
        areas: this.snapshot.areas.map((a) => ({
          ...a,
          discovery: {
            version: 1,
            fingerprint: layoutFingerprint(
              worldLayout(
                a.id,
                this.snapshot.seed,
                this.snapshot.contentVersion,
              ),
            ),
            cells: [],
          },
        })),
      };
    if (this.snapshot.version === 3)
      this.snapshot = {
        ...this.snapshot,
        version: 4,
        expedition: newExpedition(
          this.snapshot.seed,
          this.snapshot.contentVersion,
        ),
      };
    if (this.snapshot.version === 4)
      this.snapshot = {
        ...this.snapshot,
        version: 5,
        dialogue: newCampConversations(),
      };
    if (this.snapshot.version === 5)
      this.snapshot = { ...this.snapshot, version: 6, quests: newQuestState() };
    const s = this.snapshot;
    s.expedition = migrateExpedition(s.expedition!);
    this.travel = new WorldTravel(
      s.seed,
      worldLayout(s.area, s.seed, s.contentVersion),
    );
    this.travel.setPosition(restoredPosition(s));
  }
  get expedition() {
    return { ...migrateExpedition(this.snapshot.expedition!) };
  }
  get conversations() {
    return {
      ...this.snapshot.dialogue!,
      met: [...this.snapshot.dialogue!.met],
    };
  }
  get quests() {
    return structuredClone(this.snapshot.quests!);
  }
  get finaleUnlocked(): boolean {
    return this.snapshot.quests!.entries.some((e) => e.id === ACT1_FINALE);
  }
  get campaignComplete(): boolean {
    return this.snapshot.quests!.entries.some(
      (e) => e.id === ACT1_FINALE && e.status === "claimed",
    );
  }
  acceptQuest(id: string, liveLoot?: LootWorld): boolean {
    if (id === ACT1_FINALE && this.travel.state.area !== "ashen-refuge")
      return false;
    const definition = QUESTS.find((q) => q.id === id);
    if (definition?.chapter === "act1" && this.contentVersion !== 2)
      return false;
    const next = acceptQuest(this.snapshot.quests!, id);
    if (next === this.snapshot.quests) return false;
    this.snapshot.quests = next;
    // Travel and finite encounters are durable world facts. Reconcile them on
    // acceptance so clearing an area early cannot require impossible respawns.
    // This grants objective progress only, never another monster XP/loot reward.
    for (const area of this.snapshot.areas) {
      if (!this.snapshot.visited.includes(area.id)) continue;
      this.questEvent({ kind: "travel", area: area.id, id: area.id });
      const deaths =
        area.id === this.travel.state.area && liveLoot
          ? liveLoot.deaths
          : area.deaths;
      for (const death of deaths)
        this.questEvent({
          kind: death === CRYPT_FINALE_ACTOR ? "boss" : "defeat",
          area: area.id,
          id: String(death),
        });
      const base = 50000 + AREA_IDS.indexOf(area.id) * 100;
      for (const id of this.containerState.opened.filter(
        (id) => id >= base && id < base + 6,
      ))
        this.questEvent({
          kind: "interact",
          area: area.id,
          id: `container:${id}`,
        });
    }
    if (
      this.expedition.stage === "returning" ||
      this.expedition.stage === "complete"
    )
      this.questEvent({
        kind: "interact",
        area: "ancient-crypt",
        id: "crypt-beacon",
      });
    return true;
  }
  trackQuest(id: string): boolean {
    const next = trackQuest(this.snapshot.quests!, id);
    if (next === this.snapshot.quests) return false;
    this.snapshot.quests = next;
    return true;
  }
  questEvent(event: QuestEvent): boolean {
    const next = advanceQuests(this.snapshot.quests!, event);
    if (next === this.snapshot.quests) return false;
    this.snapshot.quests = next;
    return true;
  }
  consumeQuestDeaths(world: CombatWorld): boolean {
    let changed = false;
    for (const event of world.events) {
      if (
        event.kind !== "death" ||
        event.tick !== world.tick ||
        event.actor !== world.experience.player
      )
        continue;
      const target = world.actors.find((a) => a.id === event.target);
      if (world.actors.find((a) => a.id === event.actor)?.kind !== "player")
        continue;
      if (
        !target ||
        target.kind !== "hostile" ||
        !target.monsterRole ||
        target.hp !== 0
      )
        continue;
      changed =
        this.questEvent({
          kind: target.id === CRYPT_FINALE_ACTOR ? "boss" : "defeat",
          area: this.travel.state.area,
          id: String(target.id),
        }) || changed;
    }
    return changed;
  }
  claimQuest(id: string, world: CombatWorld, loot: LootWorld): string {
    const q = QUESTS.find((q) => q.id === id),
      player = world.actors[0]!;
    if (
      !q ||
      this.travel.state.area !== "ashen-refuge" ||
      player.hp <= 0 ||
      ![
        player.controller.walker.position.x,
        player.controller.walker.position.y,
      ].every(Number.isFinite) ||
      player.controller.timeline.phase !== "idle"
    )
      return "Return safely to camp to claim rewards.";
    if (q.returnTo) {
      const npc = CAMP_NPCS.find((npc) => npc.id === q.returnTo)!;
      if (
        Math.hypot(
          npc.position.x - player.controller.walker.position.x,
          npc.position.y - player.controller.walker.position.y,
        ) > 1.2
      )
        return `Return to ${npc.name} in Ashen Refuge to claim this reward.`;
    }
    const quests = claimedQuest(this.snapshot.quests!, id);
    if (quests === this.snapshot.quests)
      return "Quest reward is not available.";
    const gold = this.containerState.gold + q.reward.gold;
    if (!Number.isSafeInteger(gold))
      return "Gold limit reached; reward retained.";
    const xp = { ...world.experience },
      staged = { ...loot, drops: [...loot.drops] };
    try {
      grantCharacterXp(xp, q.reward.xp);
      const item = questRewardItem(q.reward);
      if (
        item &&
        !placeLoot(
          staged,
          item,
          player.controller.walker.position,
          world.tick,
          -2,
          areaNavigation(this.travel.layout.map),
        )
      )
        return "No safe space for the reward item; make room and retry.";
      // Prepare everything before committing; the existing atomic snapshot owns all halves.
      world.experience.character = xp.character;
      world.experience.attributes = xp.attributes;
      world.experience.skills = xp.skills;
      loot.drops = staged.drops;
      this.containerState.gold = gold;
      this.snapshot.quests = quests;
      return item
        ? "Reward claimed. Your item is on the ground nearby."
        : "Reward claimed.";
    } catch {
      return "Reward could not be prepared; state unchanged.";
    }
  }
  beginDialogue(id: string, world: CombatWorld) {
    const player = world.actors[0]!;
    const result = beginCampDialogue(
      this.snapshot.dialogue!,
      id,
      this.travel.state.area,
      player.controller.walker.position,
      player.hp > 0,
      player.controller.timeline.phase === "idle",
    );
    if (result) {
      if (id === "edda-vey" && this.campaignComplete)
        result.cursor.node = "conclusion";
      this.snapshot.dialogue = result.state;
      const changed = this.questEvent({
        kind: "interact",
        area: this.travel.state.area,
        id,
      });
      return { ...result, changed: result.changed || changed };
    }
    return result;
  }
  /** Existing generated crypt spawn is a reachable chamber, clear of exit triggers. */
  get objectivePosition(): WorldPoint | null {
    return this.travel.state.area === "ancient-crypt"
      ? this.travel.layout.spawn
      : null;
  }
  canInteractExpedition(world: CombatWorld): boolean {
    const player = world.actors[0]!;
    if (player.hp <= 0 || player.controller.timeline.phase !== "idle")
      return false;
    if (this.expedition.stage === "ready")
      return this.travel.state.area === "ashen-refuge";
    const p = this.objectivePosition;
    return (
      this.expedition.stage === "outbound" &&
      this.expedition.reached === 3 &&
      !!p &&
      Math.hypot(
        player.controller.walker.position.x - p.x,
        player.controller.walker.position.y - p.y,
      ) <= 1
    );
  }
  interactExpedition(world: CombatWorld): boolean {
    if (!this.canInteractExpedition(world)) return false;
    const objective = this.expedition.stage === "outbound";
    if (objective) {
      const gold = this.containerState.gold + EXPEDITION_REWARD.gold;
      if (this.expedition.reward !== "pending" || !Number.isSafeInteger(gold))
        return false;
      // XP/point arithmetic prepares all values before mutation. The ledger, gold,
      // XP and objective are then captured by the existing atomic checkpoint.
      grantCharacterXp(world.experience, EXPEDITION_REWARD.xp);
      this.containerState.gold = gold;
    }
    this.snapshot.expedition = {
      ...this.expedition,
      stage: this.expedition.stage === "ready" ? "outbound" : "returning",
      reward: objective ? "claimed" : this.expedition.reward,
    };
    if (objective)
      this.questEvent({
        kind: "interact",
        area: "ancient-crypt",
        id: "crypt-beacon",
      });
    return true;
  }
  private lastReveal = "";
  private knownCells = new Map<AreaId, Set<number>>();
  discoveryRevision = 0;
  get discovery() {
    return this.snapshot.areas.find((a) => a.id === this.travel.state.area)!
      .discovery!;
  }
  reveal(position: WorldPoint): boolean {
    const area = this.travel.state.area,
      t = this.travel.layout.map.terrain;
    const cell = discoveryCell(t, position),
      key = `${area}:${cell}`;
    if (cell < 0 || key === this.lastReveal) return false;
    this.lastReveal = key;
    let known = this.knownCells.get(area);
    if (!known) {
      known = new Set(this.discovery.cells);
      this.knownCells.set(area, known);
    }
    const added = revealDiscovery(t, cell, known);
    if (!added.length) return false;
    this.discovery.cells.push(...added);
    this.discoveryRevision++;
    return true;
  }
  get containerState() {
    return this.snapshot.containers!;
  }
  private containerLayout: typeof this.travel.layout | undefined;
  private containerPlan: ReturnType<typeof planWorldContainers> = [];
  get containers() {
    if (this.containerLayout !== this.travel.layout) {
      this.containerLayout = this.travel.layout;
      this.containerPlan = planWorldContainers(this.travel.layout);
    }
    return this.containerPlan;
  }
  openContainer(
    id: number,
    player: WorldPoint,
    loot: LootWorld,
    tick: number,
    content: ItemContent,
  ): boolean {
    const container = this.containers.find((c) => c.id === id);
    const opened =
      !!container &&
      openWorldContainer(
        this.travel.layout,
        container,
        player,
        this.containerState,
        loot,
        tick,
        content,
      );
    if (opened)
      this.questEvent({
        kind: "interact",
        area: this.travel.state.area,
        id: `container:${id}`,
      });
    return opened;
  }
  get contentVersion(): number {
    return this.snapshot.contentVersion;
  }
  capture(position: WorldPoint, loot: LootWorld): ExplorationSnapshot {
    if (!this.travel.setPosition(position))
      throw Error("Invalid live exploration position");
    return validateExploration({
      ...this.snapshot,
      area: this.travel.state.area,
      position,
      areas: this.snapshot.areas.map((a) =>
        a.id === this.travel.state.area
          ? { ...a, deaths: [...loot.deaths] }
          : a,
      ),
    });
  }
  restoreDeaths(loot: LootWorld, world?: CombatWorld): void {
    if (this.snapshot.contentVersion === 2)
      configureWorldRewards(loot, this.travel.state.area);
    loot.deaths = new Set(
      this.snapshot.areas.find((a) => a.id === this.travel.state.area)!.deaths,
    );
    if (world) {
      world.experience.deaths.clear();
      for (const area of this.snapshot.areas)
        for (const id of area.deaths) world.experience.deaths.add(id);
    }
  }
  transition(world: CombatWorld, loot: LootWorld): boolean {
    const before = this.travel.state.area;
    if (!stepWorldTravel(this.travel, world, this.snapshot.contentVersion))
      return false;
    const after = this.travel.state.area;
    this.questEvent({ kind: "travel", area: after, id: after });
    const destination = this.snapshot.areas.find((a) => a.id === after)!;
    this.snapshot = {
      ...this.snapshot,
      expedition: advanceExpedition(this.expedition, before, after),
      area: after,
      position: this.travel.state.position,
      visited: [...new Set([...this.snapshot.visited, after])],
      areas: this.snapshot.areas.map((a) =>
        a.id === before
          ? { ...a, drops: loot.drops, deaths: [...loot.deaths] }
          : a.id === after
            ? { ...a, drops: [] }
            : a,
      ),
    };
    const activeIds = new Set(
      itemTree(destination.drops.map((d) => d.item)).map((i) => i.id),
    );
    loot.reserved = [
      ...new Set([
        ...(loot.reserved ?? []).filter((id) => !activeIds.has(id)),
        ...itemTree(
          this.snapshot.areas.flatMap((a) => a.drops.map((d) => d.item)),
        ).map((i) => i.id),
      ]),
    ];
    loot.drops = destination.drops;
    loot.deaths = new Set(destination.deaths);
    if (this.snapshot.contentVersion === 2) configureWorldRewards(loot, after);
    return true;
  }
}

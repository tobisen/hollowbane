/** Presentation progress only: never grants rewards or mutates a character save. */
export const BEGINNER_HINTS = [
  "movement",
  "quests",
  "inventory",
  "attack",
  "skill",
  "resources",
  "loot",
  "return",
] as const;
export type BeginnerHint = (typeof BEGINNER_HINTS)[number];
export interface BeginnerProgress {
  readonly version: 1;
  readonly enabled: boolean;
  readonly dismissed: readonly BeginnerHint[];
  readonly completed: readonly BeginnerHint[];
  readonly ventured: boolean;
}
export interface BeginnerObservation {
  readonly inCamp: boolean;
  readonly moved: boolean;
  readonly attacked: boolean;
  readonly cast: boolean;
  readonly collected: boolean;
  readonly inventory: boolean;
  readonly quests: boolean;
  readonly lootAvailable: boolean;
  readonly needsRecovery: boolean;
}
export function newBeginnerProgress(): BeginnerProgress {
  return {
    version: 1,
    enabled: true,
    dismissed: [],
    completed: [],
    ventured: false,
  };
}
export function readBeginnerProgress(text: string | null): BeginnerProgress {
  try {
    if (!text || text.length > 4096) return newBeginnerProgress();
    const p = JSON.parse(text) as BeginnerProgress;
    if (
      !p ||
      Object.keys(p).sort().join() !==
        "completed,dismissed,enabled,ventured,version" ||
      p.version !== 1 ||
      typeof p.enabled !== "boolean" ||
      typeof p.ventured !== "boolean"
    )
      throw Error("Invalid guidance progress");
    for (const list of [p.dismissed, p.completed])
      if (
        !Array.isArray(list) ||
        list.length > BEGINNER_HINTS.length ||
        new Set(list).size !== list.length ||
        list.some((id) => !BEGINNER_HINTS.includes(id))
      )
        throw Error("Invalid guidance hints");
    return { ...p, dismissed: [...p.dismissed], completed: [...p.completed] };
  } catch {
    return newBeginnerProgress();
  }
}
export function observeBeginnerProgress(
  p: BeginnerProgress,
  o: BeginnerObservation,
): BeginnerProgress {
  const learned: Partial<Record<BeginnerHint, boolean>> = {
    movement: o.moved,
    attack: o.attacked,
    skill: o.cast,
    loot: o.collected,
    inventory: o.inventory,
    quests: o.quests,
    return: p.ventured && o.inCamp,
  };
  const completed = BEGINNER_HINTS.filter(
    (id) => p.completed.includes(id) || learned[id],
  );
  const ventured = p.ventured || !o.inCamp;
  return completed.length === p.completed.length && ventured === p.ventured
    ? p
    : { ...p, completed, ventured };
}
export function beginnerHint(
  p: BeginnerProgress,
  o: BeginnerObservation,
): BeginnerHint | null {
  if (!p.enabled) return null;
  return (
    BEGINNER_HINTS.find((id) => {
      if (p.dismissed.includes(id) || p.completed.includes(id)) return false;
      if (id === "attack" || id === "skill" || id === "return")
        return !o.inCamp;
      if (id === "loot") return o.lootAvailable;
      if (id === "resources")
        return (
          o.needsRecovery ||
          p.completed.includes("attack") ||
          p.completed.includes("skill")
        );
      return true;
    }) ?? null
  );
}
export function dismissBeginnerHint(
  p: BeginnerProgress,
  id: BeginnerHint,
): BeginnerProgress {
  return p.dismissed.includes(id)
    ? p
    : { ...p, dismissed: [...p.dismissed, id] };
}

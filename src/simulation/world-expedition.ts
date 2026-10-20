import type { AreaId } from "./world";
interface ExpeditionProgress {
  id: string;
  stage: "ready" | "outbound" | "returning" | "complete";
  reached: number;
}
export interface ExpeditionState extends ExpeditionProgress {
  version: 2;
  reward: "pending" | "claimed" | "legacy";
}
export interface LegacyExpeditionState extends ExpeditionProgress {
  version: 1;
}
/** Expedition state2 reward contract; retuning requires explicit migration. */
export const EXPEDITION_REWARD = Object.freeze({ xp: 250, gold: 120 });
/** Do not retrospectively reward a previously attuned or completed objective. */
export function migrateExpedition(
  state: ExpeditionState | LegacyExpeditionState,
): ExpeditionState {
  return state.version === 2
    ? state
    : {
        ...state,
        version: 2,
        reward:
          state.stage === "returning" || state.stage === "complete"
            ? "legacy"
            : "pending",
      };
}
export function expeditionIdentity(
  seed: number,
  contentVersion: number,
): string {
  return `expedition-1:${seed}:${contentVersion}`;
}
export function newExpedition(
  seed: number,
  contentVersion: number,
): ExpeditionState {
  return {
    version: 2,
    reward: "pending",
    id: expeditionIdentity(seed, contentVersion),
    stage: "ready",
    reached: 0,
  };
}
/** Only committed route edges advance the single expedition identity. */
export function advanceExpedition(
  state: ExpeditionState,
  before: AreaId,
  after: AreaId,
): ExpeditionState {
  const route: readonly AreaId[] = [
    "ashen-refuge",
    "haunted-forest",
    "forgotten-graveyard",
    "ancient-crypt",
  ];
  if (state.stage === "ready" && before === route[0] && after === route[1])
    return { ...state, stage: "outbound", reached: 1 };
  if (
    state.stage === "outbound" &&
    before === route[state.reached] &&
    after === route[state.reached + 1]
  )
    return { ...state, reached: state.reached + 1 };
  if (
    state.stage === "returning" &&
    before === "haunted-forest" &&
    after === "ashen-refuge"
  )
    return { ...state, stage: "complete" };
  return state;
}

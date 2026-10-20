import type { AreaId } from "./world";
export interface ExpeditionState {
  version: 1;
  id: string;
  stage: "ready" | "outbound" | "returning" | "complete";
  reached: number;
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
    version: 1,
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

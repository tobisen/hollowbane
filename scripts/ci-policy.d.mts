export interface Change {
  path: string;
  patch: string;
  deleted?: boolean;
  before?: string;
  after?: string;
}
export interface ReleasePlan {
  tier: "fast" | "integration" | "full";
  reasons: string[];
  groups: string[];
  unit: string[];
  browser: string[];
  changed: string[];
  impactedUnits: string[];
  integrationShards?: number[];
}
export function publicContract(source: string): string;
export function addIntegrationReplay(
  plan: ReleasePlan,
  replay: ReleasePlan,
  reason: string,
): ReleasePlan;
export function importGraph(
  files: string[],
  read?: (path: string) => string,
): Map<string, string[]>;
export function classify(
  changes: Change[],
  graph: Map<string, string[]>,
  all: string[],
  requested?: string,
  trustedEmpty?: boolean,
): ReleasePlan;
export function acceptedBaseline(
  repository: string | undefined,
  token: string | undefined,
  fetcher?: (
    url: string,
    init: RequestInit,
  ) => Promise<{ ok: boolean; json?: () => Promise<unknown> }>,
): Promise<string>;

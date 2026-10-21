export interface Change {
  path: string;
  patch: string;
  deleted?: boolean;
}
export interface ReleasePlan {
  tier: "fast" | "full";
  reasons: string[];
  groups: string[];
  unit: string[];
  browser: string[];
  changed: string[];
  impactedUnits: string[];
}
export function importGraph(
  files: string[],
  read?: (path: string) => string,
): Map<string, string[]>;
export function classify(
  changes: Change[],
  graph: Map<string, string[]>,
  all: string[],
  requested?: string,
): ReleasePlan;
export function acceptedBaseline(
  repository: string | undefined,
  token: string | undefined,
  fetcher?: (
    url: string,
    init: RequestInit,
  ) => Promise<{ ok: boolean; json?: () => Promise<unknown> }>,
): Promise<string>;

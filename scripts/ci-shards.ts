import { readdirSync } from "node:fs";
import { join } from "node:path";
import timings from "../docs/ci/browser-durations.json" with { type: "json" };

export function specFiles(directory: string, prefix = ""): string[] {
  return readdirSync(join(directory, prefix), { withFileTypes: true }).flatMap(
    (entry) => {
      const file = prefix + entry.name;
      return entry.isDirectory()
        ? specFiles(directory, file + "/")
        : file.endsWith(".spec.ts")
          ? [file]
          : [];
    },
  );
}

// Keep files intact (including hooks/order) and one worker on each machine.
// New files are always included, using a conservative weight until measured.
export function balancedShards(
  files: readonly string[],
  durations: Readonly<Record<string, number>> = timings.secondsByFile,
  count = 2,
): string[][] {
  if (!Number.isSafeInteger(count) || count < 1)
    throw Error("Invalid shard count");
  const shards: string[][] = Array.from({ length: count }, () => []);
  const totals = Array.from({ length: count }, () => 0);
  const weight = (file: string) => durations[file] ?? 60;
  for (const file of [...files].sort(
    (a, b) => weight(b) - weight(a) || a.localeCompare(b),
  )) {
    const index = totals.indexOf(Math.min(...totals));
    shards[index]!.push(file);
    totals[index]! += weight(file);
  }
  return shards;
}

export function selectedShard(directory: string, shard: string): string[] {
  if (!["1", "2", "3", "4"].includes(shard)) {
    throw new Error("PLAYWRIGHT_CI_SHARD must be 1 through 4");
  }
  return balancedShards(specFiles(directory), timings.secondsByFile, 4)[
    Number(shard) - 1
  ]!;
}

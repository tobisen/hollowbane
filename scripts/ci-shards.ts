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
): string[][] {
  const shards: string[][] = [[], []];
  const totals = [0, 0];
  const weight = (file: string) => durations[file] ?? 60;
  for (const file of [...files].sort(
    (a, b) => weight(b) - weight(a) || a.localeCompare(b),
  )) {
    const index = totals[0]! <= totals[1]! ? 0 : 1;
    shards[index]!.push(file);
    totals[index]! += weight(file);
  }
  return shards;
}

export function selectedShard(directory: string, shard: string): string[] {
  if (shard !== "1" && shard !== "2") {
    throw new Error("PLAYWRIGHT_CI_SHARD must be 1 or 2");
  }
  return balancedShards(specFiles(directory))[Number(shard) - 1]!;
}

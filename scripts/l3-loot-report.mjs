import { createServer } from "vite";
import { performance } from "node:perf_hooks";
import { writeFile } from "node:fs/promises";
import os from "node:os";
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
});
try {
  const { simulateLoot } = await server.ssrLoadModule(
    "/src/simulation/loot-diagnostics.ts",
  );
  const { L3_ITEM_CONTENT } = await server.ssrLoadModule(
    "/src/simulation/item-registry.ts",
  );
  const results = [];
  const contexts = [];
  for (const level of [1, 12, 40, 99])
    for (let repeat = 0; repeat < 5; repeat++)
      contexts.push({
        seed: 7001 + contexts.length,
        areaLevel: level,
        monsterLevel: level,
        table: ["court", "reliquary", "sanctum"][repeat % 3],
      });
  for (const level of [1, 40])
    for (const table of ["gem-cache", "sigil-cache"])
      contexts.push({
        seed: 7001 + contexts.length,
        areaLevel: level,
        monsterLevel: level,
        table,
      });
  for (const context of contexts) {
    const start = performance.now();
    const report = simulateLoot(context, 100000, L3_ITEM_CONTENT);
    delete report.examples;
    if (!report.distributionValid || report.invalidItems)
      throw Error("Invalid generation/distribution");
    results.push({
      ...report,
      generationAndReplayValidationMs: performance.now() - start,
    });
    console.log(
      context.seed,
      context.table,
      context.areaLevel,
      report.drops,
      report.quality,
      "valid",
    );
  }
  const quality = {},
    bases = {};
  for (const r of results) {
    for (const [key, value] of Object.entries(r.quality))
      quality[key] = (quality[key] ?? 0) + value;
    for (const [key, value] of Object.entries(r.bases))
      bases[key] = (bases[key] ?? 0) + value;
  }
  await writeFile(
    "docs/items/l3-distributions.json",
    JSON.stringify(
      {
        contentVersion: 8,
        cpu: os.cpus()[0]?.model,
        method:
          "24 distinct seed domains ×100000 sequence values:20 natural-table runs across levels1/12/40/99 plus4 guaranteed component-cache runs. Every generated item replay-validates; advanced affix/category/level/group/exclusion invariants checked. Canonical version/seed/sequence IDs and disjoint seed domains guarantee no duplicate generated identities. Six-sigma+5-count binomial bands for drop/base/conditional-quality distributions. Cache results are developer fixtures, not natural rarity. CPU includes generation AND replay validation; not frame-time performance.",
        totals: {
          rolls: results.reduce((s, r) => s + r.rolls, 0),
          drops: results.reduce((s, r) => s + r.drops, 0),
          invalidItems: 0,
          distributionFailures: 0,
          quality,
          bases,
        },
        results,
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await server.close();
}

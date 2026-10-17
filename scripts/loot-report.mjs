import { performance } from "node:perf_hooks";
import { build } from "vite";
import { writeFile, mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import os from "node:os";
await build({
  configFile: false,
  logLevel: "error",
  build: {
    lib: {
      entry: "src/simulation/loot-diagnostics.ts",
      formats: ["es"],
      fileName: () => "model.mjs",
    },
    outDir: ".local/loot-report",
    emptyOutDir: true,
    minify: false,
  },
});
const { simulateLoot, inspectDropTable } = await import(
  pathToFileURL(process.cwd() + "/.local/loot-report/model.mjs").href
);
const results = [];
for (const seed of [42, 7331, 2026])
  for (const level of [1, 12, 30, 99]) {
    const start = performance.now();
    const r = simulateLoot(
      { seed, monsterLevel: level, areaLevel: level, table: "court" },
      100000,
    );
    results.push({
      ...r,
      generationAndReplayValidationMs: performance.now() - start,
    });
    console.log(seed, level, r.drops, r.quality, r.distributionValid);
    if (!r.distributionValid) throw Error("Unexpected distribution");
  }
await mkdir("docs/loot", { recursive: true });
await writeFile(
  "docs/loot/distributions.json",
  JSON.stringify(
    {
      cpu: os.cpus()[0]?.model,
      method:
        "12 seeded 100000-roll runs (same seeds paired across levels), seeds42/7331/2026 × levels1/12/30/99. Binomial 6-sigma+5-count diagnostic bands, conditional qualities account for ineligible unique fallback. Every item replay-validates and affix invariants are checked. Elapsed CPU includes validation/report work, not per-frame gameplay.",
      tables: [1, 12, 30, 99].map((l) => inspectDropTable(l)),
      results,
    },
    null,
    2,
  ) + "\n",
);

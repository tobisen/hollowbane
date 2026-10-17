import { build } from "vite";
import { writeFile, mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";
import os from "node:os";
await mkdir(".local", { recursive: true });
await writeFile(
  ".local/loot-burst-entry.ts",
  'export {createEncounter, ENCOUNTER_NAV} from "../src/simulation/encounter"; export {ITEM_VERSION} from "../src/simulation/item-content"; export {createLootWorld,consumeLootDeaths} from "../src/simulation/world-loot";',
);
await build({
  configFile: false,
  logLevel: "error",
  build: {
    lib: {
      entry: ".local/loot-burst-entry.ts",
      formats: ["es"],
      fileName: () => "model.mjs",
    },
    outDir: ".local/loot-burst",
    emptyOutDir: true,
    minify: false,
  },
});
const {
  createEncounter,
  ENCOUNTER_NAV,
  createLootWorld,
  consumeLootDeaths,
  ITEM_VERSION,
} = await import(
  pathToFileURL(process.cwd() + "/.local/loot-burst/model.mjs").href
);
const samples = [];
let drops = 0,
  blocked = 0;
for (let i = 0; i < 1050; i++) {
  const e = createEncounter(30, i),
    world = createLootWorld(i);
  e.combat.events = [];
  for (const actor of e.combat.actors.filter((a) => a.id !== 0)) {
    actor.hp = 0;
    e.combat.events.push({
      tick: 1,
      kind: "death",
      actor: 0,
      target: actor.id,
    });
  }
  const start = performance.now();
  consumeLootDeaths(world, e.combat, ENCOUNTER_NAV);
  const elapsed = performance.now() - start;
  if (i >= 50) {
    samples.push(elapsed);
    drops += world.drops.length;
    blocked += world.blocked;
  }
}
const sorted = [...samples].sort((a, b) => a - b);
await writeFile(
  "docs/loot/burst-performance.json",
  JSON.stringify(
    {
      contentVersion: ITEM_VERSION,
      cpu: os.cpus()[0]?.model,
      node: process.version,
      method:
        "50 warmup then1000 seeded actual30-monster encounter death batches. Only consumeLootDeaths timed; encounter setup excluded. Includes generation, dedup and collision-aware placement. Node CPU, no browser/render/native latency claim.",
      bursts: samples.length,
      deathAttempts: samples.length * 30,
      drops,
      blocked,
      p50: sorted[500],
      p95: sorted[950],
      max: sorted.at(-1),
      samples,
    },
    null,
    2,
  ) + "\n",
);
console.log({
  bursts: samples.length,
  drops,
  blocked,
  p50: sorted[500],
  p95: sorted[950],
  max: sorted.at(-1),
});

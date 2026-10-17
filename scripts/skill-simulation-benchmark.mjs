import { createServer } from "vite";
import { performance } from "node:perf_hooks";
import { writeFile } from "node:fs/promises";
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
});
try {
  const { createEncounter, ENCOUNTER_NAV } = await server.ssrLoadModule(
    "/src/simulation/encounter.ts",
  );
  const { createSkills, requestSkill, stepSkillCombat } =
    await server.ssrLoadModule("/src/simulation/skills.ts");
  const results = [];
  for (const active of [0, 5, 10, 20, 30]) {
    const samples = [];
    for (let repeat = 0; repeat < 100; repeat++) {
      const e = createEncounter(30),
        r = createSkills(e.combat);
      for (const a of e.combat.actors) a.invulnerableUntil = 9999;
      for (const a of e.combat.actors.slice(1, active + 1))
        requestSkill(r, {
          actor: a.id,
          skill: "oath-echo",
          target: null,
          direction: { x: 1, y: 0 },
        });
      const begin = performance.now();
      for (let i = 0; i < 40; i++) stepSkillCombat(r, ENCOUNTER_NAV);
      samples.push((performance.now() - begin) / 40);
    }
    samples.sort((a, b) => a - b);
    results.push({
      active,
      meanTickMs: samples.reduce((a, b) => a + b, 0) / samples.length,
      p50TickMs: samples[50],
      p95TickMs: samples[95],
    });
  }
  const baseline = results[0].meanTickMs;
  for (const r of results)
    r.incrementalMeanPerCastTickMs = r.active
      ? (r.meanTickMs - baseline) / r.active
      : 0;
  await writeFile(
    ".local/skill-simulation-performance.json",
    JSON.stringify(
      {
        method:
          "100 fresh 40-tick windows, 31 actors, 0/5/10/20/30 simultaneous buff casts. Node Vite SSR, simulation only. Incremental mean includes status work, not a pure function microbenchmark; warmup/JIT/order can dominate tiny deltas.",
        results,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(results);
} finally {
  await server.close();
}

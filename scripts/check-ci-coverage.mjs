import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

function collect(shard) {
  const result = spawnSync(
    process.execPath,
    [
      "node_modules/@playwright/test/cli.js",
      "test",
      "--list",
      "--reporter=json",
    ],
    {
      encoding: "utf8",
      env: { ...process.env, PLAYWRIGHT_CI_SHARD: shard },
    },
  );
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  const identities = [];
  function visit(suite) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests) {
        identities.push(
          JSON.stringify([
            spec.file,
            spec.line,
            spec.column,
            spec.title,
            test.projectName,
          ]),
        );
      }
    }
    for (const child of suite.suites ?? []) visit(child);
  }
  visit(JSON.parse(result.stdout));
  return identities;
}
const all = collect("");
const first = collect("1");
const second = collect("2");
assert(all.length > 0, "empty release suite");
assert.deepEqual([...first, ...second].sort(), all.sort());
assert.equal(new Set([...first, ...second]).size, all.length);
console.log(
  `Release coverage: ${all.length} tests, ${first.length} + ${second.length}; no gaps or overlap`,
);

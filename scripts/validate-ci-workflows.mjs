import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import yaml from "js-yaml";

const workflow = {};
for (const file of readdirSync(".github/workflows")) {
  const parsed = yaml.load(readFileSync(`.github/workflows/${file}`, "utf8"));
  assert(parsed.on && parsed.jobs, `${file}: missing triggers/jobs`);
  assert.deepEqual(parsed.permissions, { contents: "read" });
  for (const [id, job] of Object.entries(parsed.jobs)) {
    for (const dependency of [job.needs ?? []].flat())
      assert(parsed.jobs[dependency], `${file}/${id}: invalid dependency`);
    for (const permission of Object.keys(job.permissions ?? {}))
      assert(["pages", "id-token"].includes(permission) && id === "deploy");
  }
  workflow[file] = parsed;
}
const release = workflow["verify-deploy.yml"];
assert.equal(release.jobs.verify.if, "always()");
assert.deepEqual(release.jobs.verify.needs, ["fast", "full"]);
assert.equal(release.jobs.deploy.needs, "verify");
assert.equal(release.jobs["hosted-smoke"].needs, "deploy");
assert.equal(release.jobs.full.if, "needs.fast.outputs.tier == 'full'");
assert(
  release.jobs.verify.steps.some((s) => s.run === "bash tools/ci/risk_gate.sh"),
);
assert.equal(release.jobs.full.with["artifact-ready"], true);
assert(workflow["full-regression.yml"].on.workflow_call);
assert(!workflow["full-regression.yml"].on.push);
assert(!workflow["deep-qa.yml"].on.push);
assert(!workflow["legacy-full.yml"].on.push);
console.log(
  "Workflow triggers, permission boundaries and risk/deployment DAG validated",
);

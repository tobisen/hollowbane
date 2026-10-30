/** Targeted forward-entry audit; never accepts the complete staff configuration. */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import attachments from "../tests/fixtures/warrior-staff-attachments.json" with { type: "json" };

const [candidate, approved, output] = process.argv
  .slice(2)
  .map((p) => resolve(p));
if (
  !candidate ||
  !approved ||
  !output ||
  [candidate, approved, output].some(
    (p) => !relative(process.cwd(), p).startsWith(".."),
  ) ||
  candidate === output ||
  approved === output
)
  throw Error(
    "Pass external candidate, approved death and audit output directories",
  );
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const proofBytes = await readFile(resolve(candidate, "staff.json")),
  proof = JSON.parse(proofBytes),
  review = JSON.parse(await readFile(resolve(candidate, "review.json"))),
  original = JSON.parse(await readFile(resolve(approved, "staff.json"))),
  controls = await readFile(
    "assets/source/q3/warrior-staff-se/death-forward.json",
  ),
  body = JSON.parse(await readFile("public/dev/warrior-death/warrior.json"));
if (
  proof.productionApproved ||
  !review.sampledGeometryPassed ||
  review.proofSha256 !== hash(proofBytes) ||
  proof.motionSha256 !== hash(controls) ||
  proof.samples.length !== 16 ||
  proof.samples.some((s) => s.direction !== "se")
)
  throw Error("Unreviewed or changed Southeast correction");
for (const [i, sample] of proof.samples.entries()) {
  if (
    sample.index !== i ||
    sample.approvedHipDrop !== body.views.se.frames[i].hipDrop ||
    !(sample.lowerBodyMatrixMaximumError < 1e-5) ||
    sample.staffReleased !== i > 5 ||
    sample.staffBodyIntersections.length ||
    sample.bodyGroundMinimum < -0.001 ||
    sample.staffGroundMinimum < 0 ||
    sample.contactErrors.some((e) => e >= 1e-6) ||
    hash(await readFile(resolve(candidate, sample.name + ".png"))) !==
      sample.pngSha256
  )
    throw Error("Changed collapse, grip, release or source pixels at " + i);
  if (i >= 4 && sample.pngSha256 !== original.samples[i].pngSha256)
    throw Error("Approved fall/release/terminal image changed at " + i);
}
const guides = (s) => {
  const n = Math.hypot(...s.axis);
  return {
    palm: s.palmR,
    left: s.palmR.map((v, i) => v + (0.24 * s.axis[i]) / n),
    tip: s.palmR.map((v, i) => v + (1.4 * s.axis[i]) / n),
  };
};
const step = (a, b) =>
  Math.max(
    ...["palm", "left", "tip"].map((k) =>
      Math.hypot(...a[k].map((v, i) => v - b[k][i])),
    ),
  );
await mkdir(output, { recursive: true });
const bundle = resolve(output, "cases.mjs");
await build({
  entryPoints: ["tests/helpers/warrior-staff-transitions.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: bundle,
  logLevel: "silent",
});
const { staffTransitionCase, STAFF_TRANSITION_STEP_LIMIT } = await import(
  pathToFileURL(bundle)
);
const plans = [];
for (const action of ["primary", "iron-fan"])
  for (const frame of [4, 5, 6])
    for (const speed of [0, 25, 60, 100])
      plans.push(staffTransitionCase(action, frame, "death", speed));
for (const recovery of [0, 25, 60])
  plans.push(staffTransitionCase("primary", 4, "hit", 0, recovery, 42, 0));
const cases = plans.map((c) => {
  const entry = c.rows.find((r) => r.pose.set === "death");
  if (
    !entry ||
    entry.frame.clip !== "hit-extended" ||
    entry.frame.frame !== 0 ||
    c.deathEvents !== 1
  )
    throw Error("Case does not exercise the corrected forward-held entry");
  let previous = null,
    maximumStep = 0;
  for (const r of c.rows) {
    const next =
      r.pose.set === "death"
        ? guides(proof.samples[r.pose.frame])
        : attachments.frames[r.frame.clip + ":" + r.frame.frame];
    if (!next) throw Error("Missing reviewed attachment");
    if (previous) maximumStep = Math.max(maximumStep, step(previous, next));
    previous = next;
  }
  if (
    maximumStep > STAFF_TRANSITION_STEP_LIMIT + 1e-12 ||
    c.rows.at(-1).pose.frame !== 15
  )
    throw Error("Staff step or terminal hold regressed");
  return {
    action: c.action,
    targetFrame: c.targetFrame,
    effect: c.effect,
    speed: c.speed,
    recovery: c.recovery,
    killFrame: c.killFrame,
    deathEvents: c.deathEvents,
    maximumStep,
    ticks: c.rows.length,
  };
});
const report = {
  producerSha256: hash(await readFile(new URL(import.meta.url))),
  proofSha256: hash(proofBytes),
  cases,
  ticks: cases.reduce((n, c) => n + c.ticks, 0),
  maximumStep: Math.max(...cases.map((c) => c.maximumStep)),
  unchangedStepLimit: STAFF_TRANSITION_STEP_LIMIT,
  approvedSuffixImages: 12,
  productionApproved: false,
  completeTransitionAcceptance: false,
};
await writeFile(
  resolve(output, "audit.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    cases: cases.length,
    ticks: report.ticks,
    maximumStep: report.maximumStep,
    unchangedStepLimit: STAFF_TRANSITION_STEP_LIMIT,
  }),
);

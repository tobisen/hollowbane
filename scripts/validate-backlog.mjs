import { readFileSync } from "node:fs";
const issues = JSON.parse(readFileSync("docs/backlog.json", "utf8"));
const ids = new Set(issues.map((i) => i.id));
if (issues.length !== 231 || ids.size !== 231)
  throw new Error("Expected 231 unique imported IDs");
const source = readFileSync("docs/source/diabloish_master_backlog.md", "utf8");
const original = new Map(
  [...source.matchAll(/^- (DBL-\d+): (.+)$/gm)].map((match) => [
    match[1],
    match[2],
  ]),
);
const done = new Set();
for (const [index, issue] of issues.entries()) {
  if (issue.id !== `DBL-${String(index + 1).padStart(3, "0")}`)
    throw new Error("Missing stable ID");
  if (original.get(issue.id) !== issue.title)
    throw new Error(`Source requirement changed: ${issue.id}`);
  if (
    !Number.isInteger(issue.targetPhase) ||
    issue.targetPhase < 0 ||
    issue.targetPhase > 35
  )
    throw new Error(`Invalid target phase: ${issue.id}`);
  for (const dep of issue.dependencies)
    if (!done.has(dep)) throw new Error(`Missing/cyclic dependency ${dep}`);
  for (const heading of [
    "Acceptance criteria",
    "Test requirements",
    "Definition of done",
    "Non-goals",
  ])
    if (!issue.body.includes(`## ${heading}`))
      throw new Error(`${issue.id} lacks ${heading}`);
  done.add(issue.id);
}
console.log("Validated 231 issues, required fields and acyclic dependencies.");

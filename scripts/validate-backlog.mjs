import { readFileSync } from "node:fs";
const issues = JSON.parse(readFileSync("docs/backlog.json", "utf8"));
const ids = new Set(issues.map((i) => i.id));
if (issues.length < 231 || ids.size !== issues.length)
  throw new Error("Expected all 231 source IDs and unique scoped IDs");
const source = readFileSync("docs/source/diabloish_master_backlog.md", "utf8");
const original = new Map(
  [...source.matchAll(/^- (DBL-\d+): (.+)$/gm)].map((match) => [
    match[1],
    match[2],
  ]),
);

for (const [index, issue] of issues.entries()) {
  if (issue.id !== `DBL-${String(index + 1).padStart(3, "0")}`)
    throw new Error("Missing stable ID");
  if (index < 231 && original.get(issue.id) !== issue.title)
    throw new Error(`Source requirement changed: ${issue.id}`);
  if (
    !Number.isInteger(issue.targetPhase) ||
    issue.targetPhase < 0 ||
    issue.targetPhase > 35
  )
    throw new Error(`Invalid target phase: ${issue.id}`);
  if (index >= 231 && (!issue.parent || !ids.has(issue.parent)))
    throw new Error(`Missing scoped parent: ${issue.id}`);
  for (const dep of issue.dependencies)
    if (!ids.has(dep)) throw new Error(`Missing dependency ${dep}`);
  for (const heading of [
    "Acceptance criteria",
    "Test requirements",
    "Definition of done",
    "Non-goals",
  ])
    if (!issue.body.includes(`## ${heading}`))
      throw new Error(`${issue.id} lacks ${heading}`);
}
// Later scoped dependency issues need not renumber stable IDs. Validate the graph itself.
const visiting = new Set(),
  visited = new Set(),
  byId = new Map(issues.map((i) => [i.id, i]));
function visit(id) {
  if (visiting.has(id)) throw new Error(`Cyclic dependency ${id}`);
  if (visited.has(id)) return;
  visiting.add(id);
  for (const dep of byId.get(id).dependencies) visit(dep);
  visiting.delete(id);
  visited.add(id);
}
for (const issue of issues) visit(issue.id);
console.log(
  `Validated ${issues.length} issues, all 231 original requirements, scoped parents and acyclic dependencies.`,
);

import { readFileSync } from "node:fs";
const issues = JSON.parse(
  readFileSync(new URL("../docs/backlog.json", import.meta.url), "utf8"),
);
const phases = JSON.parse(
  readFileSync(new URL("../docs/phases.json", import.meta.url), "utf8"),
);
const repo = process.env.GITHUB_REPOSITORY ?? "tobisen/hollowbane";
if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error("Invalid repository");
if (!process.argv.includes("--apply")) {
  console.log(
    `DRY RUN: reconcile ${phases.length} milestones, phase/priority/type/gate labels and ${issues.length} DBL issues in ${repo}. No requests made. Use --apply with GITHUB_TOKEN.`,
  );
  process.exit(0);
}
if (!process.env.GITHUB_TOKEN)
  throw new Error("GITHUB_TOKEN is required; no requests made.");
async function api(path, method = "GET", body) {
  const response = await fetch(`https://api.github.com/repos/${repo}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok)
    throw new Error(
      `GitHub ${method} ${path}: ${response.status} (rerun is safe; existing records are reconciled)`,
    );
  return response.status === 204 ? null : response.json();
}
async function list(path) {
  const result = [];
  for (let page = 1; ; page++) {
    const batch = await api(
      `${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}`,
    );
    result.push(...batch);
    if (batch.length < 100) return result;
  }
}
const labels = [
  ...phases.map((_, i) => `phase:${String(i).padStart(2, "0")}`),
  ...["p0", "p1", "p2", "p3"].map((x) => `priority:${x}`),
  ...["feature", "bug", "asset", "test", "docs"].map((x) => `type:${x}`),
  ...Array.from({ length: 7 }, (_, i) => `gate:g${i}`),
];
const existingLabels = new Set((await list("labels")).map((x) => x.name));
for (const name of labels)
  if (!existingLabels.has(name))
    await api("labels", "POST", { name, color: "706044" });
const milestones = await list("milestones?state=all");
for (const [index, name] of phases.entries()) {
  const title = `Phase ${String(index).padStart(2, "0")} — ${name}`;
  if (!milestones.some((m) => m.title === title))
    milestones.push(
      await api("milestones", "POST", {
        title,
        description:
          "Target roadmap phase; imported source phase may differ. See ROADMAP.md.",
      }),
    );
}
const existing = await list("issues?state=all");
for (const issue of issues) {
  const matches = existing.filter(
    (x) => !x.pull_request && x.title.startsWith(`${issue.id}:`),
  );
  if (matches.length > 1)
    throw new Error(`Duplicate stable ID ${issue.id}; reconcile manually.`);
  const found = matches[0];
  const body = issue.body;
  const title = `${issue.id}: ${issue.title}`;
  const issueLabels = [
    `phase:${String(issue.targetPhase).padStart(2, "0")}`,
    `priority:${issue.priority}`,
    issue.phase === 0 ? "type:docs" : "type:feature",
  ];
  const milestone = milestones.find((m) =>
    m.title.startsWith(`Phase ${String(issue.targetPhase).padStart(2, "0")} —`),
  );
  if (!milestone) throw new Error(`Missing target milestone for ${issue.id}`);
  const payload = {
    title,
    body,
    labels: issueLabels,
    milestone: milestone.number,
  };
  if (!found) {
    await api("issues", "POST", payload);
    console.log(`Created ${issue.id}`);
  } else if (
    found.title !== title ||
    found.body !== body ||
    found.milestone?.number !== payload.milestone ||
    issueLabels.some(
      (label) => !found.labels.some((existing) => existing.name === label),
    )
  ) {
    await api(`issues/${found.number}`, "PATCH", payload);
    console.log(`Updated ${issue.id}`);
  }
}
console.log(
  "Import complete. Reruns reconcile stable IDs without duplicate issues.",
);

import {
  appendFileSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, posix, resolve } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

export const coreUnits = [
  "src/simulation/core.test.ts",
  "src/simulation/damage.test.ts",
  "src/simulation/combat-timing.test.ts",
  "src/simulation/inventory-save.test.ts",
  "src/simulation/item-save.test.ts",
  "tests/ci-shards.test.ts",
  "tests/ci-policy.test.ts",
];
export const groups = {
  merchant: {
    match: /(?:camp-merchant|overnight-d09)/,
    unit: /(?:overnight-d09|inventory|world-save).*\.test\.ts$/,
    browser: ["overnight-d09.spec.ts"],
  },
  boss: {
    match: /(?:boss|stonebound)/,
    unit: /(?:boss|stonebound|combat|damage|status).*\.test\.ts$/,
    browser: [
      "overnight-d07.spec.ts",
      "overnight-d07b.spec.ts",
      "overnight-d08.spec.ts",
      "overnight-d08b.spec.ts",
    ],
  },
  persistence: {
    match: /(?:save|inventory|item-|equipment|rune|socket|affix|loot)/,
    unit: /(?:save|inventory|item-|equipment|rune|socket|affix|loot|world-rewards).*\.test\.ts$/,
    browser: [
      "inventory-storage.spec.ts",
      "advanced-inventory-sockets.spec.ts",
    ],
  },
  world: {
    match: /(?:world|navigation|generation|wilderness|area-|dungeon)/,
    unit: /(?:world|navigation|generation|wilderness|area-|dungeon).*\.test\.ts$/,
    browser: ["world.spec.ts"],
  },
  quest: {
    match: /(?:quest|camp-dialogue)/,
    unit: /(?:quest|overnight-d0[68]|world-rewards|world-save).*\.test\.ts$/,
    browser: ["overnight-d06.spec.ts", "overnight-d08b.spec.ts"],
  },
};
export function filesIn(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((e) => {
    const path = `${root}/${e.name}`;
    return e.isDirectory() ? filesIn(path) : [path];
  });
}
export function importGraph(files, read = (p) => readFileSync(p, "utf8")) {
  const known = new Set(files),
    graph = new Map();
  for (const file of files.filter((f) => /\.[cm]?[jt]s$/.test(f))) {
    const source = ts.createSourceFile(
        file,
        read(file),
        ts.ScriptTarget.Latest,
        true,
      ),
      imports = [];
    function visit(node) {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      )
        imports.push(node.moduleSpecifier.text);
      if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments[0] &&
        ts.isStringLiteral(node.arguments[0])
      )
        imports.push(node.arguments[0].text);
      ts.forEachChild(node, visit);
    }
    visit(source);
    graph.set(
      file,
      imports
        .filter((p) => p.startsWith("."))
        .flatMap((p) => {
          const base = posix.normalize(`${dirname(file)}/${p}`);
          const found = [
            base,
            `${base}.ts`,
            `${base}.json`,
            `${base}/index.ts`,
          ].find((p) => known.has(p));
          return found ? [found] : [];
        }),
    );
  }
  return graph;
}
export function affectedFiles(changes, graph) {
  const affected = new Set(changes);
  let previous = -1;
  while (previous !== affected.size) {
    previous = affected.size;
    for (const [file, imports] of graph)
      if (imports.some((p) => affected.has(p))) affected.add(file);
  }
  return affected;
}
export function classify(changes, graph, all, requested = "auto") {
  const reasons = [],
    selected = new Set(),
    changed = changes.map((c) => c.path);
  const affected = affectedFiles(changed, graph),
    unit = new Set(coreUnits);
  let full = requested === "full";
  if (full) reasons.push("Explicit Full/milestone/tag request");
  if (!changes.length) {
    full = true;
    reasons.push("No trustworthy change set");
  }
  for (const change of changes) {
    const path = change.path;
    if (
      /\.md$/.test(path) &&
      !/^docs\/ci\/(?:fast-policy|test-inventory)\.md$/.test(path)
    )
      continue;
    if (change.deleted) {
      full = true;
      reasons.push(`Deleted file: ${path}`);
      continue;
    }
    if (
      /^(?:\.github\/|scripts\/|tools\/|package|.*config\.|docs\/ci\/)/.test(
        path,
      )
    ) {
      full = true;
      reasons.push(`Build/test policy: ${path}`);
      continue;
    }
    if (/\.test\.ts$/.test(path)) {
      unit.add(path);
      continue;
    }
    if (!/^src\//.test(path)) {
      full = true;
      reasons.push(`Unclassified input: ${path}`);
      continue;
    }
    if (
      /^[+-](?![+-]).*\b(?:export|interface|type |schema|version|migrat|indexedDB|JSON\.(?:parse|stringify))\b/m.test(
        change.patch,
      )
    ) {
      full = true;
      reasons.push(`Public/data contract content: ${path}`);
    }
    const matches = Object.entries(groups).filter(([, rule]) =>
      rule.match.test(path),
    );
    if (!matches.length) {
      full = true;
      reasons.push(`Unknown/shared module: ${path}`);
    }
    for (const [name] of matches) selected.add(name);
  }
  const impactedUnits = [...affected].filter((p) => /\.test\.ts$/.test(p));
  for (const file of impactedUnits) unit.add(file);
  if (impactedUnits.length > 35) {
    full = true;
    reasons.push(`Broad import impact: ${impactedUnits.length} unit files`);
  }
  for (const name of selected)
    for (const file of all) if (groups[name].unit.test(file)) unit.add(file);
  const browser = [
    ...new Set([...selected].flatMap((name) => groups[name].browser)),
  ];
  return {
    tier: full ? "full" : "fast",
    reasons,
    groups: [...selected].sort(),
    unit: [...unit].sort(),
    browser,
    changed,
    impactedUnits,
  };
}
function run(args, env = {}) {
  const result = spawnSync(process.execPath, args, {
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
export async function acceptedBaseline(repository, token, fetcher = fetch) {
  if (!token || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository ?? ""))
    throw new Error("Missing release history access");
  const response = await fetcher(
    `https://api.github.com/repos/${repository}/actions/workflows/verify-deploy.yml/runs?branch=main&status=success&per_page=1`,
    {
      signal: globalThis.AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    },
  );
  if (!response.ok) throw new Error("Release history unavailable");
  const run = (await response.json()).workflow_runs?.[0];
  if (
    run?.conclusion !== "success" ||
    run.head_branch !== "main" ||
    !/^[a-f0-9]{40}$/.test(run.head_sha)
  )
    throw new Error("No fully accepted release baseline");
  if (!Number.isSafeInteger(run.id)) throw new Error("Invalid release run");
  const jobsResponse = await fetcher(
    `https://api.github.com/repos/${repository}/actions/runs/${run.id}/jobs?per_page=100`,
    {
      signal: globalThis.AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    },
  );
  if (!jobsResponse.ok) throw new Error("Release job history unavailable");
  const jobs = (await jobsResponse.json()).jobs ?? [];
  for (const name of [
    "verify",
    "deploy",
    "Hosted exact SHA and selected critical flow",
  ]) {
    if (!jobs.some((job) => job.name === name && job.conclusion === "success"))
      throw new Error("Release publication/hosted history incomplete");
  }
  return run.head_sha;
}
async function main() {
  const command = process.argv[2];
  if (command === "plan") {
    let base = process.env.CI_BASE;
    if (process.env.CI_RELEASE === "1") {
      try {
        base = await acceptedBaseline(
          process.env.CI_REPOSITORY,
          process.env.CI_HISTORY_TOKEN,
        );
        execFileSync("git", [
          "merge-base",
          "--is-ancestor",
          base,
          process.env.GITHUB_SHA ?? "HEAD",
        ]);
      } catch {
        base = undefined;
      }
    }
    const head = process.env.GITHUB_SHA ?? "HEAD";
    const all = [...filesIn("src"), ...filesIn("tests")];
    let changes = [];
    if (base && !/^0+$/.test(base)) {
      try {
        const names = execFileSync(
          "git",
          ["diff", "--name-status", "--no-renames", base, head],
          { encoding: "utf8" },
        )
          .trim()
          .split("\n")
          .filter(Boolean);
        changes = names.map((line) => {
          const [status, path] = line.split("\t");
          return {
            path,
            deleted: status === "D",
            patch: execFileSync(
              "git",
              ["diff", "--unified=0", base, head, "--", path],
              { encoding: "utf8" },
            ),
          };
        });
      } catch {
        /* Invalid history fails closed to Full. */
      }
    }
    const plan = classify(changes, importGraph(all), all, process.env.CI_TIER);
    writeFileSync("ci-plan.json", JSON.stringify(plan, null, 2) + "\n");
    console.log(JSON.stringify(plan, null, 2));
    if (process.env.GITHUB_OUTPUT)
      appendFileSync(process.env.GITHUB_OUTPUT, `tier=${plan.tier}\n`);
    if (process.env.GITHUB_STEP_SUMMARY)
      appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        `## Required release tier: ${plan.tier}\n\nGroups: ${plan.groups.join(", ") || "stable core"}\n\n${plan.reasons.join("\n\n")}\n`,
      );
  } else if (command === "unit") {
    const plan = JSON.parse(readFileSync("ci-plan.json", "utf8"));
    run(["node_modules/vitest/vitest.mjs", "run", ...plan.unit]);
  } else if (command === "browser" || command === "hosted") {
    const plan = JSON.parse(readFileSync("ci-plan.json", "utf8")),
      boss = plan.groups.includes("boss");
    run(
      [
        "node_modules/@playwright/test/cli.js",
        "test",
        "--config",
        "playwright.fast.config.ts",
      ],
      {
        CI_SMOKE_BOSS: boss ? "1" : "0",
        CI_HOSTED: command === "hosted" ? "1" : "0",
        CI_SMOKE_GROUPS: JSON.stringify(plan.groups),
        CI_AFFECTED_BROWSER:
          command === "browser" ? JSON.stringify(plan.browser) : "[]",
      },
    );
  } else if (command === "inventory") {
    const all = [...filesIn("src"), ...filesIn("tests")];
    const inventory = {
      units: all.filter((p) => p.endsWith(".test.ts")),
      chromium: all.filter(
        (p) => p.startsWith("tests/e2e/") && p.endsWith(".spec.ts"),
      ),
      deep: all.filter((p) => p.endsWith(".qa.ts")),
      core: coreUnits,
      groups,
      full: "All unit + all Chromium + existing 15 compatibility + validators + tooling",
      deepCoverage:
        "Full + existing broader Firefox/WebKit + extended generation/loot + benchmark",
    };
    writeFileSync(
      "docs/ci/test-inventory.json",
      JSON.stringify(
        inventory,
        (_, value) => (value instanceof RegExp ? value.source : value),
        2,
      ) + "\n",
    );
  } else throw new Error(`Unknown CI policy command: ${command}`);
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main();

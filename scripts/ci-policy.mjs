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
  "tests/ci-results.test.ts",
];
export const groups = {
  act1release: {
    match: /(?:overnight-d14|d14-campaign)/,
    unit: /(?:overnight-d14|progression-quality|character-classes|world-rewards|inventory-save|world-save).*\.test\.ts$/,
    browser: [
      "world.spec.ts",
      "world-minimap.spec.ts",
      "world-containers.spec.ts",
      "class-gameplay.spec.ts",
      "inventory-storage.spec.ts",
      "gamepad.spec.ts",
      "overnight-d14.spec.ts",
    ],
  },
  act1polish: {
    match: /(?:overnight-d13|boss-presentation|boss-view)/,
    unit: /(?:overnight-d13|inventory-navigation|world-discovery|combat-audio).*\.test\.ts$/,
    browser: ["overnight-d13.spec.ts", "overnight-d08.spec.ts"],
  },
  balance: {
    match: /(?:overnight-d12|d12-balance|crypt-boss|class-abilities)/,
    unit: /(?:overnight-d12|overnight-d02|class-abilities|character-classes|progression-quality|world-rewards|boss).*\.test\.ts$/,
    browser: ["overnight-d12.spec.ts"],
  },
  waypoint: {
    match: /(?:world-waypoint|overnight-d11)/,
    unit: /(?:overnight-d11|world-save|world-travel|world-discovery|inventory-save).*\.test\.ts$/,
    browser: ["overnight-d11.spec.ts"],
  },
  stash: {
    match: /(?:camp-stash|overnight-d10)/,
    unit: /(?:overnight-d10|inventory|world-save).*\.test\.ts$/,
    browser: ["overnight-d10.spec.ts"],
  },
  merchant: {
    match: /(?:camp-merchant|overnight-d09)/,
    unit: /(?:overnight-d09|inventory|world-save).*\.test\.ts$/,
    browser: ["overnight-d09.spec.ts"],
  },
  boss: {
    match: /^src\/simulation\/.*(?:boss|stonebound)/,
    unit: /(?:boss|stonebound|combat|damage|status).*\.test\.ts$/,
    browser: [
      "overnight-d07.spec.ts",
      "overnight-d07b.spec.ts",
      "overnight-d08.spec.ts",
      "overnight-d08b.spec.ts",
    ],
  },
  persistence: {
    match:
      /^src\/simulation\/.*(?:save|inventory|item-|equipment|rune|socket|affix|loot)/,
    unit: /(?:save|inventory|item-|equipment|rune|socket|affix|loot|world-rewards).*\.test\.ts$/,
    browser: [
      "inventory-storage.spec.ts",
      "advanced-inventory-sockets.spec.ts",
    ],
  },
  world: {
    match:
      /^src\/(?:simulation|world)\/.*(?:world|navigation|generation|wilderness|area-|dungeon)/,
    unit: /(?:world|navigation|generation|wilderness|area-|dungeon).*\.test\.ts$/,
    browser: ["world.spec.ts", "world-minimap.spec.ts"],
  },
  quest: {
    match: /(?:quest|camp-dialogue)/,
    unit: /(?:quest|overnight-d0[68]|world-rewards|world-save).*\.test\.ts$/,
    browser: ["overnight-d06.spec.ts", "overnight-d08b.spec.ts"],
  },
  inventoryUI: {
    match: /^src\/rendering\/(?:inventory|advanced-inventory)/,
    unit: /(?:inventory|equipment|socket|item-ownership).*\.test\.ts$/,
    browser: [
      "inventory.spec.ts",
      "inventory-storage.spec.ts",
      "advanced-inventory.spec.ts",
      "advanced-inventory-sockets.spec.ts",
      "advanced-inventory-laboratory.spec.ts",
      "overnight-d13.spec.ts",
    ],
  },
  controller: {
    match:
      /^src\/(?:rendering|simulation)\/(?:controller-ui|gamepad|analog|input-context)/,
    unit: /(?:controller|gamepad|analog|input-context|inventory-navigation).*\.test\.ts$/,
    browser: [
      "gamepad.spec.ts",
      "character-controller.spec.ts",
      "overnight-d13.spec.ts",
    ],
  },
  rendering: {
    match:
      /^src\/rendering\/(?:projection|camera|depth|sprite|animation|environment)/,
    unit: /(?:projection|camera|depth|animation|environment).*\.test\.ts$/,
    browser: ["prototype.spec.ts", "world-environments.spec.ts"],
  },
  minimap: {
    match: /^src\/rendering\/world-minimap/,
    unit: /(?:world-discovery|world-waypoint|world-save).*\.test\.ts$/,
    browser: ["world-minimap.spec.ts", "overnight-d13.spec.ts"],
  },
};

// Compare parsed public shapes, not the presence of "export" in changed lines.
// Inferred return expressions remain conservative: changing one changes the
// fingerprint. Explicitly typed implementations can change without an API change.
export function publicContract(text) {
  const source = ts.createSourceFile(
    "contract.ts",
    text,
    ts.ScriptTarget.Latest,
    true,
  );
  if (source.parseDiagnostics.length)
    throw Error("Unparseable source contract");
  const tokens = (text) => {
    const scanner = ts.createScanner(
      ts.ScriptTarget.Latest,
      true,
      ts.LanguageVariant.Standard,
      text,
    );
    const result = [];
    while (scanner.scan() !== ts.SyntaxKind.EndOfFileToken)
      result.push(scanner.getTokenText());
    return result.join(" ");
  };
  const shape = (node) => {
    if (!node) return "missing";
    if (ts.isNumericLiteral(node)) return "number";
    if (ts.isObjectLiteralExpression(node))
      return node.properties.map((p) =>
        ts.isPropertyAssignment(p)
          ? [p.name.getText(source), shape(p.initializer)]
          : tokens(p.getText(source)),
      );
    if (ts.isArrayLiteralExpression(node)) return node.elements.map(shape);
    return tokens(node.getText(source));
  };
  const signature = (node) => {
    if (node.body) {
      const returns = [];
      const visit = (child) => {
        if (child !== node.body && ts.isFunctionLike(child)) return;
        if (ts.isReturnStatement(child))
          returns.push(child.expression?.getText(source) ?? "void");
        ts.forEachChild(child, visit);
      };
      if (!node.type && !ts.isConstructorDeclaration(node)) visit(node.body);
      return [
        tokens(text.slice(node.getStart(source), node.body.getStart(source))),
        returns.map(tokens),
      ];
    }
    if (ts.isClassDeclaration(node))
      return [
        tokens(text.slice(node.getStart(source), node.members.pos)),
        node.members
          .filter(
            (m) =>
              !m.modifiers?.some(
                (v) => v.kind === ts.SyntaxKind.PrivateKeyword,
              ),
          )
          .map(signature),
      ];
    if (ts.isVariableStatement(node))
      return node.declarationList.declarations.map((d) => [
        d.name.getText(source),
        d.type ? tokens(d.type.getText(source)) : shape(d.initializer),
      ]);
    return tokens(node.getText(source));
  };
  return JSON.stringify(
    source.statements
      .filter(
        (node) =>
          ts.isInterfaceDeclaration(node) ||
          ts.isTypeAliasDeclaration(node) ||
          ts.isEnumDeclaration(node) ||
          ts.isExportDeclaration(node) ||
          node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword),
      )
      .map(signature),
  );
}
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
export function classify(
  changes,
  graph,
  all,
  requested = "auto",
  trustedEmpty = false,
) {
  const reasons = [],
    selected = new Set(),
    changedBrowser = new Set(),
    changed = changes.map((c) => c.path);
  const affected = affectedFiles(changed, graph),
    unit = new Set(coreUnits);
  let full = requested === "full";
  if (full) reasons.push("Explicit Full/milestone/tag request");
  if (requested && !["auto", "full"].includes(requested)) {
    full = true;
    reasons.push("Invalid tier request; risk cannot be lowered by a caller");
  }
  if (!changes.length && !trustedEmpty) {
    full = true;
    reasons.push("No trustworthy change set");
  }
  for (const change of changes) {
    const path = change.path;
    if (/(?:overnight-d14|d14-campaign)\./.test(path)) {
      selected.add("act1release");
      full = true;
      reasons.push(`Act 1 release acceptance milestone: ${path}`);
    }
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
      /^(?:\.github\/|scripts\/|tools\/|tests\/ci-[^/]+\.test\.ts$|package|.*config\.|docs\/ci\/)/.test(
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
    if (/^tests\//.test(path)) {
      const consumers = [...affectedFiles([path], graph)];
      const specs = consumers.filter((p) =>
        /^tests\/e2e\/.*\.spec\.ts$/.test(p),
      );
      for (const file of specs)
        changedBrowser.add(file.slice("tests/e2e/".length));
      if (!specs.length && !consumers.some((p) => /\.test\.ts$/.test(p))) {
        full = true;
        reasons.push(`Unmapped test dependency: ${path}`);
      }
      continue;
    }
    if (!/^src\//.test(path)) {
      full = true;
      reasons.push(`Unclassified input: ${path}`);
      continue;
    }
    let contractChanged = true;
    try {
      if (typeof change.before === "string" && typeof change.after === "string")
        contractChanged =
          publicContract(change.before) !== publicContract(change.after);
    } catch {
      /* Missing or unparseable contracts fail closed. */
    }
    if (
      contractChanged ||
      /(?:^|\/)[^/]*(?:save|migration|schema)[^/]*\.ts$/.test(path) ||
      /^[+-](?![+-]).*\b(?:indexedDB|JSON\.(?:parse|stringify)|version|schema|migrat\w*)\b/m.test(
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
  if (selected.size > 3) {
    full = true;
    reasons.push(`Broad integration impact: ${selected.size} domain groups`);
  }
  for (const name of selected)
    for (const file of all) if (groups[name].unit.test(file)) unit.add(file);
  const browser = [
    ...new Set(
      [...selected]
        .flatMap((name) => groups[name].browser)
        .concat([...changedBrowser]),
    ),
  ].sort();
  if (selected.size || browser.length)
    reasons.push(
      `Affected integration: ${[...selected].sort().join(", ") || "test dependency consumers"}`,
    );
  return {
    tier: full
      ? "full"
      : selected.size || browser.length
        ? "integration"
        : "fast",
    reasons,
    groups: [...selected].sort(),
    unit: [...unit].sort(),
    browser,
    changed,
    impactedUnits,
  };
}
export function addIntegrationReplay(plan, replay, reason) {
  if (replay.tier !== "integration")
    throw Error("Representative replay no longer selects Integration");
  for (const key of ["groups", "unit", "browser"])
    plan[key] = [...new Set([...plan[key], ...replay[key]])].sort();
  if (plan.tier === "fast") plan.tier = "integration";
  plan.reasons.push(reason);
  return plan;
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
            before:
              status === "A"
                ? ""
                : execFileSync("git", ["show", `${base}:${path}`], {
                    encoding: "utf8",
                    maxBuffer: 4 * 1024 * 1024,
                  }),
            after:
              status === "D"
                ? ""
                : execFileSync("git", ["show", `${head}:${path}`], {
                    encoding: "utf8",
                    maxBuffer: 4 * 1024 * 1024,
                  }),
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
    const graph = importGraph(all);
    const plan = classify(
      changes,
      graph,
      all,
      process.env.CI_TIER,
      base === head,
    );
    // An additive, fixed historical application replay measures a real gameplay
    // integration release without editing gameplay or allowing a lower risk gate.
    if (process.env.CI_INTEGRATION_PROBE === "inventory-ui") {
      const commit = "a615c2a70997246d767e6bacde518541bc52b017";
      execFileSync("git", ["merge-base", "--is-ancestor", commit, head]);
      const path = "src/rendering/inventory-view.ts";
      const before = execFileSync("git", ["show", `${commit}^:${path}`], {
        encoding: "utf8",
      });
      const after = execFileSync("git", ["show", `${commit}:${path}`], {
        encoding: "utf8",
      });
      const patch = execFileSync(
        "git",
        ["diff", "--unified=0", `${commit}^`, commit, "--", path],
        { encoding: "utf8" },
      );
      const replay = classify([{ path, before, after, patch }], graph, all);
      addIntegrationReplay(
        plan,
        replay,
        `Additive historical inventory UI gameplay replay: ${commit}, ${path}; actual change gate preserved`,
      );
    } else if (process.env.CI_INTEGRATION_PROBE)
      throw Error("Unknown integration probe");
    plan.integrationShards = plan.browser.length > 1 ? [1, 2] : [1];
    writeFileSync("ci-plan.json", JSON.stringify(plan, null, 2) + "\n");
    console.log(JSON.stringify(plan, null, 2));
    if (process.env.GITHUB_OUTPUT)
      appendFileSync(
        process.env.GITHUB_OUTPUT,
        `tier=${plan.tier}\nintegration-shards=${JSON.stringify(plan.integrationShards)}\n`,
      );
    if (process.env.GITHUB_STEP_SUMMARY)
      appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        `## Required release tier: ${plan.tier}\n\nGroups: ${plan.groups.join(", ") || "stable core"}\n\n${plan.reasons.join("\n\n")}\n`,
      );
  } else if (command === "unit") {
    const plan = JSON.parse(readFileSync("ci-plan.json", "utf8"));
    run([
      "node_modules/vitest/vitest.mjs",
      "run",
      ...(plan.tier === "full" ? coreUnits : plan.unit),
    ]);
  } else if (
    command === "browser" ||
    command === "hosted" ||
    command === "integration"
  ) {
    const plan = JSON.parse(readFileSync("ci-plan.json", "utf8"));
    run(
      [
        "node_modules/@playwright/test/cli.js",
        "test",
        "--config",
        "playwright.fast.config.ts",
      ],
      {
        CI_HOSTED: command === "hosted" ? "1" : "0",
        CI_AFFECTED_BROWSER:
          command === "integration" ? JSON.stringify(plan.browser) : "[]",
        CI_INTEGRATION_ONLY: command === "integration" ? "1" : "0",
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

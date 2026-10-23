import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function requirePassingBrowserReport(report) {
  if (
    !Number.isSafeInteger(report.stats?.expected) ||
    report.stats.expected < 1
  )
    throw Error("Required browser suite produced no passing cases");
  if (
    report.errors?.length ||
    ["skipped", "unexpected", "flaky"].some((key) => report.stats[key] !== 0)
  )
    throw Error(
      "Required browser suite has skipped, failed, flaky or missing results",
    );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const report = JSON.parse(
    readFileSync("playwright-report/results.json", "utf8"),
  );
  requirePassingBrowserReport(report);
  console.log(
    `Required browser report: ${report.stats.expected} passed; no skipped, failed or flaky cases`,
  );
}

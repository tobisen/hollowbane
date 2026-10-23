import { expect, it } from "vitest";
import { requirePassingBrowserReport } from "../scripts/check-browser-results.mjs";

it("rejects an empty, missing, skipped, failed or flaky required browser suite", () => {
  const stats = { expected: 2, skipped: 0, unexpected: 0, flaky: 0 };
  expect(() =>
    requirePassingBrowserReport({ stats, errors: [] }),
  ).not.toThrow();
  expect(() => requirePassingBrowserReport({})).toThrow();
  for (const key of ["skipped", "unexpected", "flaky"] as const) {
    expect(() =>
      requirePassingBrowserReport({ stats: { ...stats, [key]: 1 } }),
    ).toThrow();
    const missing = { ...stats };
    delete (missing as Partial<typeof stats>)[key];
    expect(() => requirePassingBrowserReport({ stats: missing })).toThrow();
  }
  expect(() =>
    requirePassingBrowserReport({ stats: { ...stats, expected: 0 } }),
  ).toThrow();
  expect(() =>
    requirePassingBrowserReport({ stats, errors: ["worker crashed"] }),
  ).toThrow();
});

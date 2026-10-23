export function requirePassingBrowserReport(report: {
  stats?: {
    expected?: number;
    skipped?: number;
    unexpected?: number;
    flaky?: number;
  };
  errors?: unknown[];
}): void;

import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    // Bound concurrent generated-world fixtures on high-core developer machines.
    maxWorkers: 2,
  },
});

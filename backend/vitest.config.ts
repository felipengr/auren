import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: ["./tests/global-setup.ts"],
    setupFiles: ["./tests/setup.ts"],
    // All tests share one SQLite file; running files in parallel would race
    // on it, so keep the suite sequential rather than add locking machinery.
    fileParallelism: false,
    testTimeout: 15000,
  },
});

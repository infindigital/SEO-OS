import { defineConfig } from "vitest/config";

// Browser-backed crawler tests. These launch headless Chromium via Playwright
// and require PLAYWRIGHT_CHROMIUM_EXECUTABLE to be set. Excluded from the
// default test run and CI (which do not provision a browser). Run with:
//   npm run test:crawler
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["backend/**/*.crawler.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});

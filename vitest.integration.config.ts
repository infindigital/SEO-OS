import { defineConfig } from "vitest/config";

// Integration tests that require a live PostgreSQL database. Run explicitly
// with `npx vitest run --config vitest.integration.config.ts` and a valid
// DATABASE_URL — they are intentionally excluded from the default test run.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["backend/**/*.integration.ts"],
  },
});

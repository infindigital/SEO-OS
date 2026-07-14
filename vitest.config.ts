import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["backend/**/*.test.ts"],
    // Browser-backed crawler tests run separately via `npm run test:crawler`.
    exclude: [...configDefaults.exclude, "**/*.crawler.test.ts"],
  },
});

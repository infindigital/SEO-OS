import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Component render smoke tests. Server-render the dashboard view (including the
// Recharts client components) to markup to catch runtime rendering errors that
// typechecking cannot. Run with:
//   npx vitest run --config vitest.components.config.ts
export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["dashboard/**/*.render.test.tsx"],
  },
});

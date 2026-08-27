import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  test: {
    exclude: ["open/**", "node_modules/**"],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@lieshoucloud/contract-api": path.resolve(__dirname, "open/contract-api/src"),
      "@lieshoucloud/contract-types": path.resolve(__dirname, "open/contract-types/src"),
      "@lieshoucloud/ui": path.resolve(__dirname, "open/ui/src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      thresholds: {
        lines: 50,
        statements: 50,
        functions: 50,
        branches: 50,
      },
    },
  },
});

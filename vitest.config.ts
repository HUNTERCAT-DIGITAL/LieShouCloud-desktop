import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  test: {
    exclude: ["open/**", "node_modules/**", "e2e/**"],
  },
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "src") },
      {
        find: "@lieshoucloud/contract-api",
        replacement: path.resolve(__dirname, "open/contract-api/src"),
      },
      {
        find: "@lieshoucloud/contract-types",
        replacement: path.resolve(__dirname, "open/contract-types/src"),
      },
      {
        find: "@lieshoucloud/ui",
        replacement: path.resolve(__dirname, "open/ui/src"),
      },
      {
        find: "@lieshoucloud/core-web",
        replacement: path.resolve(__dirname, "open/core-web/src"),
      },
      // 客户包兜底（与 vite.config.ts 同步）：客户仓注入物在测试转换时也能解析
      {
        find: /^@lieshoucloud\/(?!contract-api|contract-config|contract-types|ui|core-web)([a-z-]+)(\/.*)?$/,
        replacement: path.resolve(__dirname, "../packages/$1/src$2"),
      },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    passWithNoTests: true,
    exclude: ["open/**", "node_modules/**", "e2e/**"],
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

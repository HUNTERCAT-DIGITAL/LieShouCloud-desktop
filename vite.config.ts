import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Vite 配置 · 端自身骨架 + Tauri 适配.
 *  - Tauri devUrl/strictPort 必须与下方端口对齐（tauri.conf.json devUrl）
 *  - watch 忽略 src-tauri/**（Rust 端变更由 cargo 监听）
 *  - 上游共享模块（contract-api / core-web / ui 等）待统一重构后接入，当前仅 @ alias
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "src") },
      // 共享包显式 alias（嵌套 workspace（客户仓 submodule）场景 symlink 解析漂移 → 强制端内 open/*）
      { find: "@lieshoucloud/contract-api", replacement: path.resolve(__dirname, "open/contract-api/src") },
      { find: "@lieshoucloud/contract-config", replacement: path.resolve(__dirname, "open/contract-config/src") },
      { find: "@lieshoucloud/contract-types", replacement: path.resolve(__dirname, "open/contract-types/src") },
      { find: "@lieshoucloud/core-web", replacement: path.resolve(__dirname, "open/core-web/src") },
      { find: "@lieshoucloud/i18n", replacement: path.resolve(__dirname, "open/i18n/src") },
      // 客户包兜底：@lieshoucloud/<client>[/<subpath>] → ../packages/<client>/src[/<subpath>]
      // （正则捕获组 + $1/$2 由 Vite alias 字符串替换展开；共享包走显式 alias，排除避免误命中）
      {
        find: /^@lieshoucloud\/(?!contract-api|contract-config|contract-types|ui|core-web|charts|hooks|i18n|ui-native)([a-z-]+)(\/.*)?$/,
        replacement: path.resolve(__dirname, "../packages/$1/src$2"),
      },
    ],
  },
  clearScreen: false,
  server: {
    port: 21302,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
    hmr: { protocol: "ws", host: "localhost", port: 21303 },
  },
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  build: {
    target: ["es2021", "chrome100", "safari13"],
    minify: process.env.TAURI_ENV_DEBUG ? false : "esbuild",
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
});

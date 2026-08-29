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
    alias: [{ find: "@", replacement: path.resolve(__dirname, "src") }],
  },
  clearScreen: false,
  server: {
    port: 1425,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
    hmr: { protocol: "ws", host: "localhost", port: 1426 },
  },
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  build: {
    target: ["es2021", "chrome100", "safari13"],
    minify: process.env.TAURI_ENV_DEBUG ? false : "esbuild",
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
});

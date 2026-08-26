import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

/**
 * Vite 配置 - monorepo + Tauri 适配.
 *  - Tauri 默认固定端口 1420; devUrl 与 strictPort 必须对齐
 *  - watch 忽略 src-tauri/** (Rust 端变更由 cargo 监听)
 *  - alias 与 tsconfig.json paths 完全同步
 * @see .ai/decisions/0015-desktop.md
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@lieshoucloud/api-client": path.resolve(__dirname, "open/packages/api-client/src"),
      "@lieshoucloud/types": path.resolve(__dirname, "open/packages/types/src"),
      "@lieshoucloud/ui": path.resolve(__dirname, "open/packages/ui/src"),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: "0.0.0.0",
    hmr: { protocol: "ws", host: "localhost", port: 1421 },
    watch: { ignored: ["**/src-tauri/**"] },
    proxy: {
      // 转发到 Spring Cloud Gateway（与 admin dev 一致）
      "/api": {
        target: process.env.VITE_DEV_PROXY_TARGET || "http://localhost:9000",
        changeOrigin: true,
      },
    },
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: "esnext",
    minify: "esbuild",
    sourcemap: true,
  },
});

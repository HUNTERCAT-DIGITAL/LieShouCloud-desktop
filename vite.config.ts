import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

/**
 * Vite 配置 - monorepo + Tauri 适配.
 *  - Tauri 默认固定端口 1420; devUrl 与 strictPort 必须对齐
 *  - watch 忽略 src-tauri/** (Rust 端变更由 cargo 监听)
 *  - alias 与 tsconfig.json paths 完全同步
 * @see .ai/decisions/0015-desktop.md
 *
 * 客户聚合仓模式（2026-09）：客户包 @lieshoucloud/<client> 由客户仓
 * deploy:prepare 生成 tsconfig.<client>.json（paths → ../packages/<client>/src），
 * 此处补充 Vite 运行时 alias（顺序：具体包在前，客户包正则兜底）。
 * 独立仓库（无客户仓）不 import 客户包，正则兜底不会命中，安全。
 */
export default defineConfig({
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
      // 客户包兜底：@lieshoucloud/<client>[/<subpath>] → ../packages/<client>/src[/<subpath>]
      // （正则捕获组 + $1/$2 由 String.replace 展开）
      {
        find: /^@lieshoucloud\/(?!api-client|config|types|ui|core-web)([a-z-]+)(\/.*)?$/,
        replacement: path.resolve(__dirname, "../packages/$1/src$2"),
      },
    ],
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

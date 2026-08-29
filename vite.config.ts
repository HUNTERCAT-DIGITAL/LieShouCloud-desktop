import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Vite 配置 · 端自身骨架 + Tauri 适配.
 *  - Tauri devUrl/strictPort 必须与下方端口对齐（tauri.conf.json devUrl）
 *  - watch 忽略 src-tauri/**（Rust 端变更由 cargo 监听）
 *  - 上游共享模块（contract-api / core-web / ui 等）待统一重构后接入，当前仅 @ alias
 *  - VITE_BASE 注入子路径部署（如 /desktop/ · 对标 mobile-web /h5/ 浏览器托管模式）
 *  - /api 同源反代 → gateway（dev 与 preview 一致；浏览器/Tauri 调试无 CORS 依赖）
 */
export default defineConfig({
  // 子路径部署：VITE_BASE=/desktop/ pnpm build（BrowserRouter basename 跟随 import.meta.env.BASE_URL）
  base: process.env.VITE_BASE ?? "/",
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
      { find: /^@lieshoucloud\/ui($|\/)/, replacement: path.resolve(__dirname, "open/ui/src") + "$1" },
      // 客户包 antd 页面（../packages/<client>/src 位于端仓外）：antd 从 import 文件向上
      // 解析不到端内 node_modules → 强制 alias（E13 同款 · react-router-dom/antd 等）
      { find: "antd", replacement: path.resolve(__dirname, "node_modules/antd") },
      { find: "@ant-design/icons", replacement: path.resolve(__dirname, "node_modules/@ant-design/icons") },
      { find: "@ant-design/pro-components", replacement: path.resolve(__dirname, "node_modules/@ant-design/pro-components") },
      { find: "dayjs", replacement: path.resolve(__dirname, "node_modules/dayjs") },
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
    host: true,
    // 联调域名/内网 IP 访问 dev 需放行（vite 6 allowedHosts 校验 · E10；
    // dev.dwjk.lieshou.huntercat.cn/desktop 经 nginx 反代访问 dev server）
    allowedHosts: true,
    port: 21302,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
    hmr: { protocol: "ws", host: "localhost", port: 21303 },
    // dev 同源反代：浏览器直接访问 http://localhost:21302 时 /api → gateway（无 CORS）
    // ⚠️ changeOrigin 必须为 false：gateway CorsConfig「同源放行」依赖 Origin==Host
    // （2026-08 修复），proxy 改 Host 会破坏同源判断 → 浏览器 POST 带 Origin 被拦 403
    proxy: {
      "/api": {
        target: process.env.VITE_PROXY_TARGET ?? "http://127.0.0.1:21000",
        changeOrigin: false,
      },
    },
  },
  preview: {
    port: 21304,
    strictPort: true,
    // preview（构建产物浏览器调试）同源反代，语义同 server.proxy（changeOrigin 同理必须 false）
    proxy: {
      "/api": {
        target: process.env.VITE_PROXY_TARGET ?? "http://127.0.0.1:21000",
        changeOrigin: false,
      },
    },
  },
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  build: {
    target: ["es2021", "chrome100", "safari13"],
    minify: process.env.TAURI_ENV_DEBUG ? false : "esbuild",
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
});

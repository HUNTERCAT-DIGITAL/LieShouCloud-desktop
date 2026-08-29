/**
 * Playwright E2E 配置（desktop · vite preview 模式）.
 *
 * 说明：
 * - webServer 起 vite preview(生产构建产物),跑纯 Web 层用户流;
 * - Tauri 特有 API(getVersion / updater / process)在浏览器环境会 reject,
 *   应用代码均有 catch 兜底,不影响测试;
 * - API 由各 spec 的 page.route 拦截 mock,不依赖真实后端、不写脏数据。
 */
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4174",
    headless: true,
  },
  webServer: {
    command: "pnpm preview --port 4174 --strictPort",
    url: "http://localhost:4174",
    // 不复用已有服务:避免占用端口上跑着别的应用(如 admin-web preview)
    reuseExistingServer: false,
    timeout: 60_000,
  },
});

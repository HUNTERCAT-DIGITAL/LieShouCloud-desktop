import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider, message } from "antd";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { configureCore } from "@lieshoucloud/core-web";
import { request, setBaseUrl } from "@lieshoucloud/contract-api";
import { resolveApiBase } from "@lieshoucloud/contract-config";
import App from "./App";
import { getBranding, getEdition } from "./config/editions";
import { colors } from "./theme/colors";
import zhCN from "antd/locale/zh_CN";
import "./styles/global.css";

// —— API 网关基址：env 优先（VITE_API_BASE，与发布脚本 publish-desktop-update.sh 注入一致），缺省本地 Tauri 联调 ——
// 修复：未 setBaseUrl 时 request() 走空 base → 相对路径在 Tauri 里打到前端页面（HTML 而非 JSON）。
// 注意 key 必须与发布脚本注入的 VITE_API_BASE 对齐（API_BASE），否则生产构建回落 localhost:9000 导致登录 Failed to fetch。
setBaseUrl(resolveApiBase({ key: "API_BASE", defaultBase: "http://localhost:9000" }));

// —— 注入 core-web 端口（业务核心层 · 2026-09 铺开）——
configureCore({
  storage: {
    get: (k) => localStorage.getItem(k),
    set: (k, v) => localStorage.setItem(k, v),
    remove: (k) => localStorage.removeItem(k),
  },
  notifier: {
    success: (m) => message.success(m),
    error: (m) => message.error(m),
  },
  navigation: {
    to: (p) => { window.location.hash = p; },
    replace: (p) => { window.location.hash = p; },
  },
  api: {
    request: (path, init) => {
      const method = (init?.method ?? "GET") as "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      const body = typeof init?.body === "string" ? (JSON.parse(init.body) as unknown) : init?.body;
      return request({ method, path, body });
    },
  },
});

// —— 品牌（可配置 · 2026-09）：antd 主题 token 用版别主色；原生窗口标题用版别品牌 ——
const branding = getBranding();
const brandColors = {
  ...colors,
  primary: branding.colorPrimary || colors.primary,
};

// 原生窗口标题（沉浸式无边框窗口下 OS 任务栏/alt-tab 展示；浏览器 dev 环境静默跳过）
if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
  getCurrentWindow()
    .setTitle(branding.windowTitle || getEdition().brandName)
    .catch(() => undefined);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: brandColors.primary,
          colorInfo: brandColors.primary,
          borderRadius: 6,
          fontSize: 14,
          colorBgLayout: colors.pageBg,
        },
        components: {
          Table: { headerBg: colors.surface, headerColor: colors.textSecondary },
          Card: { headerFontSize: 15 },
          Layout: { siderBg: colors.siderBg },
          Menu: {
            darkItemBg: "transparent",
            darkItemSelectedBg: colors.primary,
            darkItemHoverBg: "rgba(255,255,255,0.08)",
            darkSubMenuItemBg: "transparent",
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>,
);

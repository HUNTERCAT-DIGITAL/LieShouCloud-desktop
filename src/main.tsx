import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider, message } from "antd";
import { configureCore } from "@lieshoucloud/core-web";
import { request, setBaseUrl } from "@lieshoucloud/contract-api";
import { resolveApiBase } from "@lieshoucloud/contract-config";
import App from "./App";
import { colors } from "./theme/colors";
import zhCN from "antd/locale/zh_CN";
import "./styles/global.css";

// —— API 网关基址：env 优先（VITE_API_BASE_URL），缺省本地 Tauri 联调 ——
// 修复：未 setBaseUrl 时 request() 走空 base → 相对路径在 Tauri 里打到前端页面（HTML 而非 JSON）。
setBaseUrl(resolveApiBase({ key: "API_BASE_URL", defaultBase: "http://localhost:9000" }));

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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: colors.primary,
          colorInfo: colors.primary,
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

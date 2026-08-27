import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { message } from "antd";
import { configureCore } from "@lieshoucloud/core-web";
import { request } from "@lieshoucloud/contract-api";
import App from "./App";

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
    <App />
  </StrictMode>,
);

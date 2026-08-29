import React from 'react';
import ReactDOM from 'react-dom/client';

import { configureCore, useAuthStore } from '@lieshoucloud/core-web';
import { createApiClient } from '@lieshoucloud/contract-api';

import App from './App';
import { getEdition } from './config/editions';
import './styles/global.css';

// API 网关地址：VITE_API_BASE（生产发布脚本注入）→ 本地 Tauri 联调 localhost:9000
// （与 src-tauri/tauri.conf.json CSP connect-src 白名单对齐）
const API_BASE =
  (import.meta.env?.VITE_API_BASE as string | undefined)?.replace(/\/+$/, '') ??
  'http://localhost:21000';

// —— API 客户端（contract-api：token 注入 + 401 单飞刷新 + 会话过期兜底）——
const api = createApiClient({
  baseUrl: API_BASE,
  hooks: {
    getAccessToken: () => useAuthStore.getState().accessToken,
    refreshTokens: async () => {
      try {
        await useAuthStore.getState().refresh();
        return true;
      } catch {
        return false;
      }
    },
    onUnauthorized: () => {
      useAuthStore.getState().logout();
    },
  },
});

// —— 注入 core-web 端口（统一登录态/存储/通知/导航）——
configureCore({
  storage: {
    get: (k) => localStorage.getItem(k),
    set: (k, v) => localStorage.setItem(k, v),
    remove: (k) => localStorage.removeItem(k),
  },
  notifier: {
    // eslint-disable-next-line no-console -- 骨架无 UI 库，占位提示
    success: (m) => console.log('[notify]', m),
    error: (m) => console.error('[notify]', m),
  },
  navigation: {
    to: (p) => {
      window.location.href = p;
    },
    replace: (p) => {
      window.location.replace(p);
    },
  },
  // HTTP 传输：桥接 contract-api 实例（全路径透传 + skipAuth401/asBlob）
  api: {
    request: (path, init) => {
      const method = (init?.method ?? 'GET').toUpperCase() as
        | 'GET'
        | 'POST'
        | 'PUT'
        | 'DELETE'
        | 'PATCH';
      const body =
        typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : init?.body;
      const skipAuth401 = (init as { skipAuth401?: boolean } | undefined)?.skipAuth401;
      const asBlob = (init as { asBlob?: boolean } | undefined)?.asBlob;
      return api.request({ method, path, body, skipAuth401, asBlob });
    },
  },
});

// core-web auth store：端口注入后显式恢复会话
void useAuthStore.persist.rehydrate();

// 运行时按版别设置文档标题
const edition = getEdition();
document.title = edition.brandName;

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Missing #root mount element');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

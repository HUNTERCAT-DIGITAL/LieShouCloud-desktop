# Desktop 端定位与职责（5 端之一 · 归档）

> 状态：现行（2026-09）· 适用于 lieshou-app-desktop 端仓的开发与维护
> 定位：本文档是 desktop 端的**开发依据**——端仓职责、装配机制、运行形态、踩坑速查。
> 配套：工作区根 `AGENTS.md`（仓库地图/协作边界）、各客户仓 `docs/`（客户视角）。

---

## 1. 定位：5 端分工中的桌面客户端

| 端 | 形态 | 技术栈 | 定位 |
| --- | --- | --- | --- |
| **desktop（本仓）** | 桌面客户端 | Tauri 2 + React 19 + Vite 6 | 桌面壳：登录 + 启动页 + 客户业务页（注入） |
| admin-web | B 端管理后台 | Vite 6 + React 19 + antd | Web 管理台 |
| mobile | 移动原生 | Expo 57 + RN | 移动端（Expo Go/真机） |
| mobile-web | 移动 H5 | Vue 3 + Vant | 浏览器 H5（/h5/ 子路径） |
| mini-program | 微信小程序 | Taro 4 | 小程序 |

**desktop 的核心特征**：
- 前端是**纯 Web**（零 Tauri API 引用）——Tauri 只是 WebView 壳，同一前端可在浏览器访问。
- **薄壳化**（2026-08 决策）：端仓清空业务代码，只保留登录 + 启动页骨架；业务页全部由客户仓注入。
- **客户页 = 端外**：单一客户页面在 delivery 仓 `packages/<client>/`，经 `*.extra.ts` 注入，端仓零客户代码。

---

## 2. 职责边界（三层模型 · 核心约定）

```
┌─────────────────────────────────────────────────┐
│ 端仓 lieshou-app-desktop（本仓 · 通用壳）          │
│   登录/启动页/认证/版别解析/extraRoutes 装配槽位    │
├─────────────────────────────────────────────────┤
│ 行业能力（可选装配）                               │
│   页面可在端仓（按 edition.industries 裁剪）       │
│   或在客户包（industry/ 等分端目录）               │
├─────────────────────────────────────────────────┤
│ 客户页面（delivery 仓 packages/<client>）          │
│   唯一客户专属代码所在地，经 extra 注入，禁止 fork  │
└─────────────────────────────────────────────────┘
```

**规则**：
1. ❌ 端仓不写客户专属页面/逻辑（客户名只出现在配置与测试）。
2. ❌ 客户仓不 fork 端仓（只 import 上游 + 注入）。
3. ✅ 跨仓改动两段式：先改共享仓/端仓 → 提交推送 → 客户仓 bump submodule pin。

---

## 3. 技术架构（端仓全貌）

### 3.1 源文件清单（src 共 9 个）

| 文件 | 职责 |
| --- | --- |
| `src/App.tsx` | 路由装配：`/login`、`/`、`/home` + **extraRoutes 懒加载注入**（LazyRoute）；有客户菜单声明时套 ConsoleLayout（shouldUseConsole） |
| `src/layout/ConsoleLayout.tsx` | **控制台主框架壳**（ProLayout）：侧栏菜单（name/icon/order/group + hiddenMenus 裁剪 + roles 角色过滤 + badge 角标轮询）+ 顶栏（品牌/用户/退出）+ 内容区 Outlet |
| `src/main.tsx` | 启动：contract-api 模块级配置（E12）+ configureCore 端口注入 + 会话恢复 |
| `src/pages/LoginPage.tsx` | 登录页（租户/账号/密码 → core-web login） |
| `src/pages/HomePage.tsx` | 启动页（品牌 + 版本 + 后端连通检查 GET /api/auth/me） |
| `src/config/editions/index.ts` | 版别解析 + **withExtras 合并**（glob 收集 `*.extra.ts`） |
| `src/config/editions/generic.ts` | 通用版别配置（brandName/slogan/tenantCode/login） |
| `src/config/version.ts` | APP_VERSION |
| `src/styles/global.css` | 全局样式 |
| `src/vite-env.d.ts` | vite/client 类型 |

### 3.2 版别（Edition）机制

- `VITE_EDITION` 构建期注入 → `resolveEditionId()` → generic 兜底。
- **客户注入**：`import.meta.glob('./*.extra.ts', { eager: true })` 自动收集
  delivery 仓 `deploy:prepare` 生成的 `editions/<client>.extra.ts`（独立仓无匹配 = 空）。
- `withExtras()`：客户字段覆盖 + `extraRoutes` 追加（`extraRoutes: [...base, ...extra]`）。
- 登录后后端 `tenantEdition` 为权威（端内解析仅负责首屏/构建期）。

### 3.3 extraRoutes 装配（客户页面的唯一入口）

```ts
// App.tsx —— LazyRoute 必须 useMemo 缓存 lazy（E13）
function LazyRoute({ load }: { load: () => Promise<{ default: ComponentType }> }) {
  const Lazy = useMemo(() => lazy(load), [load]);  // ⚠️ 勿每次 render new
  return <Suspense fallback={<div style={{padding:40,textAlign:'center',color:'#999'}}>加载中…</div>}><Lazy /></Suspense>;
}
// BrowserRouter 必须：basename={import.meta.env.BASE_URL} + useTransitions={false}（E13）
```

- `layoutRoutes`（非 standalone）在登录守卫内；`standaloneRoutes` 独立注册（外部落地页）。
- 客户包页面依赖（antd 等）由**端仓依赖 + vite 强制 alias** 保证解析（见 3.5）。
- **控制台壳**：`shouldUseConsole`（extraRoutes 有 menu 声明或 dutyConsole）→ 套 `ConsoleLayout`（ProLayout）；无菜单版别（generic 骨架）保持扁平路由。菜单数据源 = `extraRoutes[].menu`（`roles` 角色裁剪、`badge` 角标轮询，contract-types 7d734d4+）。

### 3.4 API 与认证

- `main.tsx`：`API_BASE = VITE_API_BASE ?? 'http://localhost:21000'`。
  - **浏览器/部署形态必须 `VITE_API_BASE=''`**（同源 `/api`，经 nginx/反代到 gateway）。
  - Tauri 联调默认绝对地址 21000（gateway dev 端口）。
- contract-api 模块级配置（`setBaseUrl/setAccessTokenProvider/setRefreshTokensProvider/setUnauthorizedHandler`）
  ——**客户包 `api.ts` 走模块级 request，必须配置（E12）**。
- 登录态统一来自 `@lieshoucloud/core-web` 的 `useAuthStore`（storage/notifier/navigation/api 端口在 main.tsx 注入）。

### 3.5 vite.config 关键点

| 项 | 值 | 说明 |
| --- | --- | --- |
| `base` | `process.env.VITE_BASE ?? '/'` | 子路径部署（`/desktop/`） |
| `server.port` | 21302（HMR 21303） | Tauri devUrl 对齐；**勿改** |
| `server.host/allowedHosts` | `true` | E10——域名访问 dev 不被 vite 6 拦 |
| `server.proxy` | `/api → VITE_PROXY_TARGET ?? 127.0.0.1:21000` | **changeOrigin 必须 false**（见 §6） |
| alias | `antd → node_modules/antd` | 客户包文件在端仓外，import 解析不到端内依赖（E13 同款） |
| alias | `@lieshoucloud/*` 显式 → `open/*/src` | 嵌套 workspace symlink 漂移 |
| alias | `@lieshoucloud/<client>` 兜底 → `../packages/<client>/src` | 客户包 |

### 3.6 依赖策略

- 端仓 dependencies：react / react-dom / react-router-dom / 共享包 + **antd ^5.22.0**。
- **antd 必须存在**：客户包页面（如 dwjk GridOpsBoard）用 antd 编写，端仓不装则 rollup 无法解析。
- Tauri 插件（@tauri-apps/api、plugin-process/shell/updater）仅打包壳使用，前端不 import。

---

## 4. 开发流程

### 4.1 端仓改动 → 客户仓 bump（标准两段式）

```bash
# ① 端仓（本仓）
cd lieshou-app-desktop
git fetch origin main && git status -sb   # 确认无落后（并发纪律）
# ...改代码...
pnpm typecheck && pnpm build
git commit -m "feat(desktop): ..." && git push origin main

# ② 客户仓（如 delivery-dwjk）
cd ../lieshou-delivery-dwjk/desktop
git fetch origin main && git checkout <新commit>
cd .. && git add desktop && git commit -m "chore(desktop): bump submodule → <hash>（说明影响面）"
git push origin main
```

### 4.2 客户注入物（delivery 仓，勿手改端仓）

`deploy/prepare.mjs` 生成（一个部署 = 一个客户）：
- `desktop/src/config/editions/<client>.extra.ts`（extraRoutes + 品牌/租户等）
- `desktop/tsconfig.<client>.json`（paths → `../packages/<client>/src`）
- 端仓 `tsconfig.json` 已 `exclude *.extra.ts`（extra 不参与端仓类型检查）。

### 4.3 本地调试三形态

| 形态 | 命令 | 访问 |
| --- | --- | --- |
| Tauri 窗口 | `pnpm tauri:dev` | devUrl http://localhost:21302（需 Rust） |
| 浏览器 dev | `VITE_BASE=/desktop/ VITE_API_BASE='' pnpm dev --port 21306` | http://localhost:21306/desktop/ |
| 构建产物 | `VITE_BASE=/desktop/ VITE_API_BASE='' pnpm build` + nginx 托管 | 见 §5 |

> ⚠️ vite preview 不支持子路径 base（assets 被 SPA fallback 重写为 HTML）——浏览器调试用 dev server，生产用 nginx。

---

## 5. 部署（dev 环境实测链路）

```
https://dev.dwjk.lieshou.huntercat.cn/desktop
  DNS → 入口机 nginx(TLS, acme.sh 证书) → frps 5189 → frpc → 本地 nginx
    /desktop/ → 127.0.0.1:21306  (desktop dev server, VITE_BASE=/desktop/)
    /api/     → 127.0.0.1:21000  (gateway; Host 透传 → CorsConfig 同源放行)
    /         → 21300 (admin-web)   /h5/ → 21301 (mobile-web)
```

- 本地 nginx 配置：`delivery-dwjk/deploy/nginx-local/dev.dwjk.lieshou.huntercat.cn.conf`
  （仓库版已含 /desktop/ 分流；安装：`sudo cp` → `/etc/nginx/conf.d/` → `nginx -t && reload`）。
- **dev server 需常驻**：`VITE_BASE=/desktop/ VITE_API_BASE='' pnpm dev --port 21306`（建议 systemd 化）。
- 生产静态托管（无 dev server）：nginx `location /desktop/ { alias dist/; try_files $uri $uri/ /desktop/index.html; }` + `location /api → gateway`。

---

## 6. 踩坑速查（下次先查这里）

| # | 症状 | 根因 | 修复 |
| --- | --- | --- | --- |
| E10 | 域名访问 dev 403 | vite 6 Host 校验 | `server.host:true + allowedHosts:true` |
| E12 | 客户包 API 401 | 模块级 request 未配置 | main.tsx 补 `setBaseUrl/setAccessTokenProvider/...` |
| E13 | 懒加载页导航卡旧 UI | BrowserRouter startTransition + lazy 重建 | `useTransitions={false}` + `useMemo(() => lazy(load))` |
| — | 浏览器登录 403 | proxy `changeOrigin:true` 改写 Host → gateway 同源放行（Origin==Host）失效 | proxy `changeOrigin:false`（Host 透传） |
| — | build 报 `Rollup failed to resolve import "antd"` | 客户包文件在端仓外解析不到端内依赖 | 端仓 dependencies 装 antd + alias antd |
| — | `/desktop/` 页面空白（preview） | vite preview 不剥 base，assets 被 SPA fallback 重写为 HTML | 用 dev server；生产 nginx |
| — | Tauri 窗口与浏览器不一致 | — | 不会发生：devUrl 就是 vite dev server 同页 |

---

## 7. 当前状态与待办（2026-09）

**已实现**：
- 登录 / 启动页 / 后端连通检查；客户 extraRoutes 装配（GridOpsBoard 经 `/desktop/dwjk/ops` 浏览器可达）。
- `/desktop/` 子路径浏览器调试 + dev.dwjk 公网链路。
- **控制台主框架壳**（2026-09）：ProLayout 侧栏菜单 + 顶栏 + 内容区；roles 角色裁剪 + badge 角标轮询（P2 能力一次到位）。
- 登录落地客户主页（edition.homePath，dwjk=/dwjk/ops）。

**待办**：
- [ ] iot-service 实现 `/api/iot/tickets*`（GridOpsBoard 数据出空 —— 前端已通，等后端）。
- [ ] desktop 行业页补全（dwjk extraRoutes 注入 /iot/overview、/iot/devices、/iot/alerts 等 industry 页面 + 菜单声明）。
- [ ] `src-tauri/tauri.conf.json` 品牌定制（productName/window title 仍为通用）。
- [ ] dev server 常驻 systemd 化（重启机器后自动恢复 21306）。
- [ ] README.md 更新（当前描述为薄壳前业务，已过时）。

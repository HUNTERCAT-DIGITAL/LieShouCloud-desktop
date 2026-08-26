# @lieshoucloud/desktop

LieShou Cloud Desktop —— **Tauri 2 + React 19**（系统 webview 中的 SPA）。

## 启动

前置：
- Node 22 + pnpm 9+
- **Rust toolchain**（[rustup.rs](https://rustup.rs/)）
- 平台特定：
  - **macOS**：Xcode Command Line Tools（`xcode-select --install`）
  - **Windows**：WebView2（Win11 自带）+ Visual Studio Build Tools
  - **Linux**：webkit2gtk + libsoup

```bash
# 仓库根 - 装所有 workspace
pnpm install

# 仅 desktop (启动 Vite 1420 + Rust 进程 + 桌面窗口)
pnpm turbo run tauri:dev --filter=@lieshoucloud/desktop
# 或
cd apps/desktop && pnpm tauri:dev

# Type check
pnpm turbo run typecheck --filter=@lieshoucloud/desktop

# Test
pnpm turbo run test --filter=@lieshoucloud/desktop

# 生产 build（输出到 src-tauri/target/release/bundle/{dmg,msi,deb,app}）
cd apps/desktop && pnpm tauri:build
```

## 路由（React Router 7）

```
src/pages/
├── Home.tsx     /         欢迎页
└── Health.tsx   /health   健康状态（含 packages/ui HealthBadge 复用）
```

## 跨包共享（首个完整复用 web 端能力）

| 包 | desktop 用法 | 备注 |
|---|---|---|
| `@lieshoucloud/types` | `import type { HealthStatus }` | 类型共享 |
| `@lieshoucloud/api-client` | `import { request }` | HTTP fetch wrapper |
| **`@lieshoucloud/ui`** | **`import { HealthBadge }`** | **DOM 组件复用（react 19 一致）** ✅ |

> **desktop 是第一个完整复用 `packages/ui` 的端**。
> mobile（RN 18.3）/ mini-program（Taro 4）因 react peerDep 冲突 / 平台抽象不同无法复用；
> admin（React 19 + DOM）与 desktop 是同一栈，理论上也能复用——后续 Phase 5+ 整理。

## 架构

```
┌─────────────────────────────────┐
│ React SPA in system webview     │
│   ├─ @lieshoucloud/ui (跨包)     │
│   ├─ @lieshoucloud/api-client   │
│   └─ Tauri invoke (IPC)         │
└─────────────────────────────────┘
         ↕ IPC commands
┌─────────────────────────────────┐
│ Rust process (Tauri 2)          │
│   ├─ Window management          │
│   ├─ System tray / menu         │
│   └─ Native APIs                │
└─────────────────────────────────┘
         ↕ HTTP (when needed)
┌─────────────────────────────────┐
│ Spring Cloud Gateway :9000      │
└─────────────────────────────────┘
```

## 技术栈

| 维度 | 选型 |
|---|---|
| 桌面框架 | Tauri 2.x（Rust + 系统 webview） |
| 前端 | React 19 + Vite 6 + React Router 7 |
| IPC | `@tauri-apps/api` v2 + `#[tauri::command]` |
| 跨包 | `@lieshoucloud/{ui,types,api-client}: workspace:*` |

## Phase 2+ 路线

- Tauri command 扩：fs / dialog / shell / notification / clipboard
- 系统托盘（Tray icon）
- 多窗口（multi-window）
- 自动更新（tauri-plugin-updater）
- 应用菜单
- 国际化（i18n）
- 离线缓存（tauri-plugin-store）
- 真实 Spring Boot 后端打通
- 跨平台打包：macOS .dmg / Windows .msi / Linux .deb .AppImage

## 已知限制

- Phase 1 不 build（CI 无 Rust toolchain）
- `apps/desktop/src-tauri/icons/` 缺失：dev 模式 OK，build 模式需补（`pnpm tauri icon`）
- Cargo workspace 与 pnpm workspace 不互通（Rust 端独立）
- Tauri 2 capabilities 默认权限收窄；新权限需在 `capabilities/default.json` 显式开启

## 关联文档

- `.ai/decisions/0015-desktop.md`
- `.ai/conversations/2026-08-22-desktop.md`
- ADR-0012（monorepo）/ 0013（mobile）/ 0014（mini-program）
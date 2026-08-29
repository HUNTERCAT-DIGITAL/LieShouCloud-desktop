# lieshou-app-desktop · 猎手云桌面端(开源)

> 猎手云(开源)的桌面客户端:Tauri 2 桌面壳 + React 19 渲染。**薄壳化**——端仓只含登录 / 启动页骨架;
> 行业能力与客户定制通过 **Edition 配置 + 客户仓注入**(`extraRoutes`)装配,不在本仓内。
> 浏览器等价物:同一前端可在 `/desktop/` 子路径浏览器访问(零 Tauri API 依赖)。
> **定位与职责详见 [docs/DESKTOP_POSITIONING.md](docs/DESKTOP_POSITIONING.md)**。

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-2-orange" alt="Tauri 2"/>
  <img src="https://img.shields.io/badge/React-19-61dafb" alt="React 19"/>
  <img src="https://img.shields.io/badge/Vite-6-646cff" alt="Vite 6"/>
  <img src="https://img.shields.io/badge/License-Apache--2.0-brightgreen" alt="Apache-2.0"/>
</p>

## 技术栈

- Tauri 2(Rust)+ React 19 + TypeScript(strict)+ Vite 6
- 共享层 `@lieshoucloud/{contract-api,contract-types,contract-config,ui,core-web}` 经 `open/` submodule 挂载 [lieshou-cloud-web](https://github.com/HUNTERCAT-DIGITAL/lieshou-cloud-web)

## 快速开始

```bash
git clone git@github.com:HUNTERCAT-DIGITAL/lieshou-app-desktop.git
cd lieshou-app-desktop
git submodule update --init --recursive   # 拉 open/(共享包 contract-api/types/config/ui/core-web)
pnpm install
pnpm tauri:dev                            # 开发(需 Rust toolchain)
```

## 脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm tauri:dev` | 桌面开发(需 Rust) |
| `pnpm tauri:build` | 生产构建(产物在 src-tauri/target/release/bundle/) |
| `pnpm typecheck` | tsc -b --noEmit |
| `pnpm test` | Vitest |
| `pnpm build` | vite build(前端部分) |

## 客户/行业装配

本仓只含**通用薄壳**(登录 + 启动页);行业能力与客户定制由客户仓注入:

- 客户 Edition 配置:delivery 仓 `deploy:prepare` 生成 `config/editions/<client>.extra.ts`
  (本仓仅 `generic` 预设;`index.ts` 用 `import.meta.glob` 自动收集 `*.extra.ts`)
- 客户包页面(`packages/<client>/`)经 `extraRoutes` 懒加载装配(`App.tsx` LazyRoute)
- 浏览器调试: `VITE_BASE=/desktop/ VITE_API_BASE='' pnpm dev --port 21306` → /desktop/

## 共享层升级流程

共享层（`open/` 下 submodule：contract-api / contract-types / contract-config / ui / core-web）由独立仓维护：

1. 改共享仓（如 `lieshou-core-web`）→ 提交 + push
2. 本端升级：`git -C open/core-web fetch origin main && git -C open/core-web checkout <commit>`
3. 本端提交 gitlink bump（`open/*` 指针变更）

> 纪律：共享仓提交后**立即** bump 各端 pin，避免 submodule 漂移。

## 关联仓库

- 共享层(开源):`HUNTERCAT-DIGITAL/lieshou-contract-{api,types,config}` · `lieshou-ui` · `lieshou-core-web`(open/ submodule)
- 后端底座(开源):`HUNTERCAT-DIGITAL/lieshou-cloud` · `lieshou-framework`
- 其他端(开源):`lieshou-app-admin-web` · `lieshou-app-mobile` · `lieshou-app-mobile-web` · `lieshou-app-mini-program`
- 客户聚合仓(闭源):`HUNTERCAT-DIGITAL/lieshou-delivery-{dwjk,haizan,legalmind,...}`

## License

Apache-2.0,见 [LICENSE](LICENSE)。

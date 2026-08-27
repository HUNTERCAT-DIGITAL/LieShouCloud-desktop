# lieshou-cloud-desktop · 猎手云桌面端(开源)

> 猎手云(开源)的桌面客户端:Tauri 2 桌面壳 + React 19 渲染,承载登录 / 工作台 / 客户 / 库存 / 财务 / 审批等通用业务。
> 行业能力与客户定制通过 **Edition 配置 + 客户仓注入**(`extraRoutes`)装配,不在本仓内。

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
git clone git@github.com:HUNTERCAT-DIGITAL/lieshou-desktop.git
git submodule update --init --recursive   # 拉 open/(lieshou-cloud-web 共享包)
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

本仓只含**通用部分**;行业能力与客户定制由客户仓注入:

- 客户 Edition 配置在客户仓 `config/editions/<client>.ts`(本仓仅 `generic` + `layer` 预设)
- 客户仓生成 `editions/<client>.extra.ts`(extraRoutes)→ 本仓装配
- `EditionGuard` / `isMenuHidden` 按 `edition.hiddenMenus` 裁剪;行业能力经 `edition.industries` 声明(industry 包为闭源商业模块)

## 共享层升级流程

共享层（`open/` 下 submodule：contract-api / contract-types / contract-config / ui / core-web）由独立仓维护：

1. 改共享仓（如 `lieshou-core-web`）→ 提交 + push
2. 本端升级：`git -C open/core-web fetch origin main && git -C open/core-web checkout <commit>`
3. 本端提交 gitlink bump（`open/*` 指针变更）

> 纪律：共享仓提交后**立即** bump 各端 pin，避免 submodule 漂移。

## 关联仓库

- 共享层(开源):`HUNTERCAT-DIGITAL/lieshou-cloud-web`
- 后端底座(开源):`HUNTERCAT-DIGITAL/lieshou-cloud`
- 其他端(开源):`lieshou-cloud-admin-web` · `lieshou-cloud-mobile` · `lieshou-cloud-mini-program`
- 商业主仓:`HUNTERCAT-DIGITAL/lieshou-cloud-pro`

## License

Apache-2.0,见 [LICENSE](LICENSE)。

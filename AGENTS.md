# 项目记忆

> 由 pi 的 project-memory 扩展自动创建,后续与人类维护者共同维护。
> 记录关键事实、决策与约定;避免流水账。详细定位/职责见 `docs/DESKTOP_POSITIONING.md`。

## 项目身份
- 名称:lieshou-app-desktop(猎手云桌面端 · 开源)
- 类型:Tauri 2 桌面客户端(薄壳)+ React 19 + Vite 6
- 仓库:https://github.com/HUNTERCAT-DIGITAL/lieshou-app-desktop
- 技术栈:Tauri 2 · React 19 · TypeScript strict · Vite 6 · antd ^5.22 · 共享层 @lieshoucloud/{contract-api,contract-types,contract-config,ui,core-web}(open/ submodule)

## 架构速览
薄壳骨架(9 个源文件):登录页 + 启动页 + 版别解析;客户业务页经 `config/editions/*.extra.ts`(delivery 仓 deploy:prepare 生成)注入,`App.tsx` 按 extraRoutes 懒加载装配。浏览器形态 = 同一前端(VITE_BASE=/desktop/),零 Tauri API 依赖。

## 关键约定
- 端仓只放通用壳;客户专属页面在 delivery 仓 packages/<client>,禁止 fork/硬编码
- BrowserRouter 必须 `basename={import.meta.env.BASE_URL}` + `useTransitions={false}`;LazyRoute 必须 useMemo 缓存 lazy(E13)
- vite proxy changeOrigin 必须 false(gateway 同源放行依赖 Origin==Host)
- 跨仓改动两段式:端仓提交推送 → 客户仓 bump submodule pin(commit message 标影响面)

## 当前阶段
- 薄壳骨架 + extraRoutes 装配完成;`/desktop/` 浏览器调试与 dev.dwjk 公网链路已通

## 待办
- [ ] iot-service 实现 /api/iot/tickets*(GridOpsBoard 数据出空)
- [ ] src-tauri/tauri.conf.json 品牌定制
- [ ] dev server(21306)常驻 systemd 化
- [ ] README.md 更新(仍为薄壳前描述)

## 关键决策
- 2026-08:薄壳化——清空业务代码,重建最小工程骨架(commit 019b0b2)
- 2026-08:端口段规划 dev 21302 / HMR 21303 / API→gateway 21000
- 2026-09:恢复 extraRoutes 装配 + VITE_BASE 子路径托管 + antd 依赖(56a51cd/361c561/409f89e/7a3ff1b)

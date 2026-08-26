# Tauri Icons

Tauri bundle 需要以下图标（参考 `tauri.conf.json` `bundle.icon`）。

## Phase 1 占位

此目录暂无真实图标。`tauri dev` 通常 OK（带 fallback）；`tauri build` 会因缺图标失败。

## 首次 build 前请补

```bash
# 进入 apps/desktop 后
pnpm tauri icon ./source-icon.png
# 一键生成 32x32.png / 128x128.png / 128x128@2x.png / icon.icns / icon.ico
```

source-icon.png 推荐 **1024×1024 PNG**（含透明通道）。

## 各平台

- `icon.icns` —— macOS（.app / .dmg）
- `icon.ico` —— Windows（.msi）
- `32x32.png` / `128x128.png` —— Linux（.deb / .AppImage）

参见 Tauri 官方文档：<https://tauri.app/v1/guides/distribution/publishing>
; 智法云枢 · NSIS 安装器 hooks（tauri bundle.windows.nsis.installerHooks 引用）
; 目的：安装后桌面/开始菜单快捷方式显示「智法云枢」（tauri 默认快捷方式名 = productName=legalmind 英文）。
; 本文件 UTF-8 带 BOM（NSIS 中文脚本需 Unicode 编译 + BOM 避免乱码）。
; ⚠️ 改品牌名/可执行名时同步：$INSTDIR 下主程序名（Cargo package name）与默认快捷方式路径。

!macro customInstall
  ; 替换默认英文快捷方式为中文品牌名（默认：$DESKTOP\legalmind.lnk + $SMPROGRAMS\legalmind.lnk）
  Delete "$DESKTOP\legalmind.lnk"
  Delete "$SMPROGRAMS\legalmind.lnk"
  CreateShortCut "$DESKTOP\智法云枢.lnk" "$INSTDIR\lieshoucloud-desktop.exe"
  CreateShortCut "$SMPROGRAMS\智法云枢.lnk" "$INSTDIR\lieshoucloud-desktop.exe"
!macroend

!macro customUnInstall
  ; 卸载时清理自定义中文快捷方式（默认英文快捷方式由 tauri 卸载器处理）
  Delete "$DESKTOP\智法云枢.lnk"
  Delete "$SMPROGRAMS\智法云枢.lnk"
!macroend

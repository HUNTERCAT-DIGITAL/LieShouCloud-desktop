//! Tauri commands (IPC bridge between Rust and React webview).
//!
//! 前端调用方式:
//!   `import { invoke } from '@tauri-apps/api/core'`
//!   `await invoke<{status: string, service: string}>('fetch_health')`
//!
//! @see .ai/decisions/0015-desktop.md

use serde::Serialize;

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    service: String,
}

/// 演示 Tauri command - 返回 Rust 桥接的健康状态.
/// 后续 Phase 2+ 可加 fs / dialog / shell / notification 等命令.
#[tauri::command]
fn fetch_health() -> HealthResponse {
    HealthResponse {
        status: "up".to_string(),
        service: "tauri-bridge".to_string(),
    }
}


/// 沉浸式无边框：按窗口 label 定位主窗口并移除 WS_CAPTION（前端 invoke 调用 · 多次重试）。
/// 跨客户通用（不依赖窗口标题——历史曾硬编码 dwjk 的“电网监控”，客户品牌不同会失效）。
/// 非 Windows 平台 window 参数未使用（cfg(windows) 块内才引用），标注忽略。
#[cfg_attr(not(target_os = "windows"), allow(unused_variables))]
#[tauri::command]
fn set_immersive(window: tauri::Window) -> bool {
    #[cfg(target_os = "windows")]
    {
        unsafe {
            use windows::Win32::Foundation::HWND;
            use windows::Win32::UI::WindowsAndMessaging::*;
            let hwnd: HWND = window.hwnd().unwrap_or_default();
            if !hwnd.is_invalid() {
                let style = GetWindowLongW(hwnd, GWL_STYLE);
                // 沉浸式：移除标题栏(CAPTION) + resize 边框(THICKFRAME——Win11 顶部绿色系统边框)
                SetWindowLongW(
                    hwnd,
                    GWL_STYLE,
                    style & !(WS_CAPTION.0 as i32) & !(WS_THICKFRAME.0 as i32),
                );
                SetWindowPos(
                    hwnd,
                    None,
                    0,
                    0,
                    0,
                    0,
                    SWP_FRAMECHANGED | SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER,
                );
                return true;
            }
        }
    }
    false
}

/// Tauri 入口.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // 在线升级插件（Windows nsis · 升级清单见 tauri.conf.json plugins.updater.endpoints）
        .plugin(tauri_plugin_updater::Builder::new().build())
        // 升级完成后 relaunch 重启
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        // 沉浸式无边框：Rust 侧直接强制（conf decorations:false + tauri set_decorations 均兜底；
        // Windows 再用 Win32 直接移除 WS_CAPTION——tauri 2 的 set_decorations 实测未完全生效）
        .setup(|app| {
            // 沉浸式无边框：Rust 侧 setup 直接强制（conf decorations:true + 前端 invoke set_immersive 均兜底）。
            // 按窗口 label 定位主窗口（不依赖标题；setup 时窗口未就绪则跳过，前端多次重试兜底）。
            #[cfg(target_os = "windows")]
            {
                use tauri::Manager;
                use windows::Win32::Foundation::HWND;
                use windows::Win32::UI::WindowsAndMessaging::*;
                if let Some(win) = app.get_webview_window("main") {
                    let hwnd: HWND = win.hwnd().unwrap_or_default();
                    if !hwnd.is_invalid() {
                        let style = GetWindowLongW(hwnd, GWL_STYLE);
                        SetWindowLongW(hwnd, GWL_STYLE, style & !(WS_CAPTION.0 as i32));
                        SetWindowPos(
                            hwnd,
                            None,
                            0,
                            0,
                            0,
                            0,
                            SWP_FRAMECHANGED | SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER,
                        );
                    }
                }
            }
            let _ = app;
            Ok(())
        })

        .invoke_handler(tauri::generate_handler![fetch_health, set_immersive])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
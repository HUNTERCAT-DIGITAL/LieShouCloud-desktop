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

/// Tauri 入口.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // 在线升级插件（Windows nsis · 升级清单见 tauri.conf.json plugins.updater.endpoints）
        .plugin(tauri_plugin_updater::Builder::new().build())
        // 升级完成后 relaunch 重启
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        // 沉浸式无边框：Rust 侧直接强制（绕过 JS IPC/capabilities；conf decorations:false 兜底）
        .setup(|app| {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.set_decorations(false);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![fetch_health])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
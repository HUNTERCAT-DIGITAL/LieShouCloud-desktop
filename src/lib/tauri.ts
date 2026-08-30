/**
 * Tauri 安全桥：浏览器/非 Tauri 环境下调用 Rust 命令时不抛错.
 *
 * @tauri-apps/api/core 的 invoke 在非 Tauri 浏览器中为 undefined
 * （模块顶层解构 window.__TAURI_INTERNALS__），直接 import 会导致
 * 「Cannot read properties of undefined (reading 'invoke')」→ React 渲染中断。
 * 这里直接读 Tauri 注入的全局（Win11 有 / 浏览器无），一步守卫。
 */
export function safeInvoke(cmd: string): void {
  try {
    const internals = (
      window as unknown as {
        __TAURI_INTERNALS__?: { invoke?: (c: string, a?: unknown) => Promise<unknown> };
      }
    ).__TAURI_INTERNALS__;
    internals?.invoke?.(cmd);
  } catch {
    // 非 Tauri 环境：忽略
  }
}

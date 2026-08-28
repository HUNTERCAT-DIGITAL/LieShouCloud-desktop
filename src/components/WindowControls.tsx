/**
 * 自定义窗口控制（沉浸式无边框标题栏 · 2026-09）.
 *
 * Tauri 2: decorations=false 后由前端接管 最小化/最大化/关闭；
 * 最大化状态用 onResized 同步（图标在 最大化/还原 间切换）。
 * 非 Tauri 环境（浏览器 dev / jsdom 测试）下静默降级为纯展示。
 */
import { BorderOutlined, CloseOutlined, MinusOutlined, SwitcherOutlined } from "@ant-design/icons";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";

/** Tauri 运行时探测（浏览器 dev / jsdom 无 __TAURI_INTERNALS__） */
const isTauriRuntime = (): boolean =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export default function WindowControls() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!isTauriRuntime()) return;
    const win = getCurrentWindow();
    let unlisten: (() => void) | undefined;
    void win
      .isMaximized()
      .then(setMaximized)
      .catch(() => undefined);
    void win
      .onResized(() => {
        void win.isMaximized().then(setMaximized).catch(() => undefined);
      })
      .then((fn) => {
        unlisten = fn;
      });
    return () => unlisten?.();
  }, []);

  const win = () => (isTauriRuntime() ? getCurrentWindow() : null);

  return (
    <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
      <button
        className="win-ctrl-btn"
        title="最小化"
        onClick={() => void win()?.minimize()}
      >
        <MinusOutlined />
      </button>
      <button
        className="win-ctrl-btn"
        title={maximized ? "还原" : "最大化"}
        onClick={() => void win()?.toggleMaximize()}
      >
        {maximized ? <SwitcherOutlined /> : <BorderOutlined />}
      </button>
      <button
        className="win-ctrl-btn win-ctrl-close"
        title="关闭"
        onClick={() => void win()?.close()}
      >
        <CloseOutlined />
      </button>
    </div>
  );
}

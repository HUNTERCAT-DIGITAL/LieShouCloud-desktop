/**
 * 智法云枢 · 自定义窗口控制（沉浸式无边框标题栏 · 2026-09）.
 *
 * Tauri 2: decorations=false 后由前端接管 最小化/最大化/关闭；
 * 最大化状态用 onResized 同步（图标在 最大化/还原 间切换）。
 */
import { BorderOutlined, CloseOutlined, MinusOutlined, SwitcherOutlined } from "@ant-design/icons";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";

export default function WindowControls() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
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

  return (
    <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
      <button
        className="win-ctrl-btn"
        title="最小化"
        onClick={() => void getCurrentWindow().minimize()}
      >
        <MinusOutlined />
      </button>
      <button
        className="win-ctrl-btn"
        title={maximized ? "还原" : "最大化"}
        onClick={() => void getCurrentWindow().toggleMaximize()}
      >
        {maximized ? <SwitcherOutlined /> : <BorderOutlined />}
      </button>
      <button
        className="win-ctrl-btn win-ctrl-close"
        title="关闭"
        onClick={() => void getCurrentWindow().close()}
      >
        <CloseOutlined />
      </button>
    </div>
  );
}

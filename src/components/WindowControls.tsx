/**
 * 桌面端 · 自定义窗口控制按钮（沉浸式无边框界面）.
 *
 * decorations:false 时替换系统标题栏按钮：最小化 / 最大化(还原) / 关闭。
 * 仅 Tauri 环境渲染（浏览器版守卫跳过）；样式见 global.css .window-controls。
 */
import { BorderOutlined, CloseOutlined, MinusOutlined } from '@ant-design/icons';
import { getCurrentWindow } from '@tauri-apps/api/window';

/**
 * 窗口控制按钮（沉浸式无边框）.
 * variant: 'light' = 浅色背景（深色按钮，门户/登录/欢迎标题栏）;
 *           'dark'  = 深色背景（浅色按钮，控制台深蓝顶栏）。
 */
export default function WindowControls({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  // 无条件渲染 + try/catch（不依赖 isTauri 检测；浏览器版按钮点击抛错忽略）
  let win: ReturnType<typeof getCurrentWindow> | null = null;
  try {
    win = getCurrentWindow();
  } catch {
    return null;
  }

  return (
    <div className={`window-controls ${variant === 'dark' ? 'wc-dark' : 'wc-light'}`}>
      <button
        className="window-control-btn"
        title="最小化"
        onClick={() => win && void win.minimize()}
      >
        <MinusOutlined />
      </button>
      <button
        className="window-control-btn"
        title="最大化 / 还原"
        onClick={() => win && void win.toggleMaximize()}
      >
        <BorderOutlined className="wc-max-icon" />
      </button>
      <button
        className="window-control-btn wc-close"
        title="关闭"
        onClick={() => win && void win.close()}
      >
        <CloseOutlined />
      </button>
    </div>
  );
}

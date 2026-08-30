/**
 * 统一顶部标题栏（接管原生标题栏 · VS Code 式整体顶栏）.
 *
 * 整条 = 品牌区(左) + 动作区(右) + 窗口控制按钮(最右)，整条可拖拽。
 * 深色/浅色主题由 CSS 变量统一管理（.titlebar-light / .titlebar-dark）：
 *   - variant='light'：浅底深字深钮（门户 / 欢迎页）
 *   - variant='dark' ：深底浅字浅钮（登录页 / 与控制台深蓝顶栏融合）
 * 窗口控制按钮颜色自动跟随同一套变量，保证顶部永远是一个整体。
 */
import type { ReactNode } from 'react';
import { getEdition } from '../config/editions';
import WindowControls from './WindowControls';

/** logo 完整路径（/desktop/ 子路径下需 BASE_URL 前缀） */
function logoUrl(logo?: string): string | undefined {
  if (!logo) return undefined;
  return `${import.meta.env.BASE_URL}${logo.replace(/^\//, '')}`;
}

interface TitleBarProps {
  variant?: 'light' | 'dark';
  /** 品牌区整块替换（默认 edition.logo + brandName） */
  brand?: ReactNode;
  /** 动作区（链接/按钮，渲染在窗口控制按钮左侧） */
  actions?: ReactNode;
  className?: string;
}

export default function TitleBar({ variant = 'light', brand, actions, className }: TitleBarProps) {
  const edition = getEdition();
  return (
    <header
      className={`titlebar ${variant === 'dark' ? 'titlebar-dark' : 'titlebar-light'} ${className ?? ''}`}
      data-tauri-drag-region
    >
      <div className="titlebar-brand" data-tauri-drag-region>
        {brand ?? (
          <>
            {edition.logo ? (
              <img className="titlebar-logo" src={logoUrl(edition.logo)} alt="" />
            ) : (
              <span className="titlebar-logo titlebar-logo-fallback">{edition.brandName?.slice(0, 1)}</span>
            )}
            <span className="titlebar-name">{edition.brandName}</span>
          </>
        )}
      </div>
      {actions && (
        <div className="titlebar-actions" data-tauri-drag-region>
          {actions}
        </div>
      )}
      <WindowControls variant={variant} />
    </header>
  );
}

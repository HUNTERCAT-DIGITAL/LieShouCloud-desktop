/**
 * 全局唯一顶部标题栏（完全接管系统原生标题栏 · 所有页面共用同一个）.
 *
 * 设计原则：
 * - 在 App 根层渲染（Routes 外），页面切换不重挂、永远同一根顶栏；
 * - 深浅主题由路由 + 登录态决定（一套 CSS 变量统一管理背景/文字/按钮/hover）：
 *     · /login                → dark（深蓝，与登录页背景融为一体）
 *     · 门户/欢迎（未登录/游客）→ light（白底深字深钮）
 *     · 控制台（登录后业务区）  → dark（深蓝，与 ProLayout 侧栏一体）
 * - 动作区动态：门户态=登录入口；控制台态=检查更新/关于/用户菜单+退出；登录页=仅窗口按钮。
 * - 整条 data-tauri-drag-region 可拖拽；系统原生按钮永不出现（set_immersive 移除 CAPTION/THICKFRAME）。
 */
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DownOutlined,
  InfoCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Dropdown, Space } from 'antd';
import { getEdition } from '../config/editions';
import { useAuthStore } from '@lieshoucloud/core-web';
import { checkForUpdates, isTauri } from '../lib/updater';
import WindowControls from '../components/WindowControls';

/** logo 完整路径（/desktop/ 子路径下需 BASE_URL 前缀） */
function logoUrl(logo?: string): string | undefined {
  if (!logo) return undefined;
  return `${import.meta.env.BASE_URL}${logo.replace(/^\//, '')}`;
}

type Theme = 'light' | 'dark';

/** 路由 + 登录态 → 顶栏主题 */
function resolveTheme(path: string, authed: boolean): Theme {
  if (path === '/login') return 'dark';
  if (!authed) return 'light'; // 未登录门户（游客）
  // 登录后的门户/欢迎/首页：浅色欢迎态
  if (path === '/portal' || path === '/welcome' || path === '/' || path === '/home') return 'light';
  return 'dark'; // 控制台（登录后业务区）
}

export default function AppTopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const edition = getEdition();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(resolveTheme(location.pathname, isAuthenticated));
  }, [location.pathname, isAuthenticated]);

  const dark = theme === 'dark';
  const isLogin = location.pathname === '/login';
  const isConsole = isAuthenticated && !isLogin && !['/portal', '/welcome'].includes(location.pathname);

  return (
    <header
      className={`app-topbar ${dark ? 'app-topbar-dark' : 'app-topbar-light'}`}
      data-tauri-drag-region
    >
      {/* 品牌区（左侧） */}
      <div className="app-topbar-brand" data-tauri-drag-region>
        {edition.logo ? (
          <img className="app-topbar-logo" src={logoUrl(edition.logo)} alt="" />
        ) : (
          <span className="app-topbar-logo app-topbar-logo-fallback">{edition.brandName?.slice(0, 1)}</span>
        )}
        <span className="app-topbar-name">{edition.brandName}</span>
      </div>

      {/* 动作区（右侧 · 窗口按钮前；登录页留空最沉浸） */}
      <div className="app-topbar-actions" data-tauri-drag-region>
        {!isLogin && (
          <>
            {!isAuthenticated && (
              <Button
                size="small"
                type="primary"
                className="app-topbar-btn"
                icon={<LoginOutlined />}
                onClick={() => navigate('/login')}
              >
                登录
              </Button>
            )}
            {isTauri() && (
              <Button
                size="small"
                type="text"
                className="app-topbar-btn"
                onClick={() => void checkForUpdates(false)}
              >
                检查更新
              </Button>
            )}
            {isConsole && (
              <Dropdown
                menu={{
                  items: [
                    { key: 'about', icon: <InfoCircleOutlined />, label: '关于', onClick: () => navigate('/about') },
                    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: () => logout() },
                  ],
                }}
              >
                <Space size={6} className="app-topbar-user">
                  <Avatar size={22} style={{ background: dark ? 'rgba(255,255,255,0.2)' : '#02429b' }}>
                    {user?.username?.slice(0, 1)?.toUpperCase() ?? <UserOutlined />}
                  </Avatar>
                  <span>{user?.username ?? '用户'}</span>
                  <DownOutlined style={{ fontSize: 10, opacity: 0.6 }} />
                </Space>
              </Dropdown>
            )}
          </>
        )}
      </div>

      {/* 窗口控制（最右 · 自己的按钮，系统原生永不出现） */}
      <WindowControls variant={dark ? 'dark' : 'light'} />
    </header>
  );
}

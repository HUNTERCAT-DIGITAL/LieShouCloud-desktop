/**
 * 桌面端 · 路由装配（端自身骨架 · 登录态来自 core-web useAuthStore）
 * /login 登录页；/、/home 启动页（登录守卫）；客户 extraRoutes 懒加载注入。
 */
import { Suspense, lazy, useMemo, type ComponentType } from 'react';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom';
import { useAuthStore } from '@lieshoucloud/core-web';

import { getEdition } from './config/editions';
import ConsoleLayout, { shouldUseConsole } from './layout/ConsoleLayout';
import AboutPage from './pages/AboutPage';
import { checkForUpdates, isTauri } from './lib/updater';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import PortalPage from './pages/PortalPage';
import WelcomePage from './pages/WelcomePage';

/** 客户注入路由的懒加载出口 */
function LazyRoute({ load }: { load: () => Promise<{ default: ComponentType }> }) {
  // useMemo 缓存 lazy 组件：避免每次渲染重建组件身份（否则叠加 v7 BrowserRouter
  // 默认 startTransition 导航，懒加载页面内 navigate/Link 会挂起并卡在旧 UI · E13）
  const Lazy = useMemo(() => lazy(load), [load]);
  return (
    <Suspense
      fallback={
        <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>加载中…</div>
      }
    >
      <Lazy />
    </Suspense>
  );
}

/** 登录守卫：required=false（游客直达）时放行；未登录 → 门户页 */
function RequireAuth() {
  const edition = getEdition();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const required = edition.login?.required !== false;
  if (required && !isAuthenticated) return <Navigate to="/portal" replace />;
  return <Outlet />;
}

export default function App() {
  const edition = getEdition();
  const extraRoutes = edition.extraRoutes ?? [];
  const useConsole = shouldUseConsole(edition);

  // 桌面端启动静默检查更新（Tauri 环境；浏览器版跳过）
  void (isTauri() ? checkForUpdates(true) : Promise.resolve());
  // 登录后落地页：客户 edition.homePath 优先（客户主页/工作台），缺省上游启动页
  const fallbackPath = edition.homePath ?? '/home';
  // 工作台/首页：客户可注入 path='/' 或 '/home' 覆盖骨架 HomePage（对齐 admin-web）
  const homeRoute = extraRoutes.find((r) => r.path === '/' || r.path === '/home');
  const homeElement = homeRoute ? <LazyRoute load={homeRoute.load} /> : <HomePage />;
  const layoutRoutes = extraRoutes.filter(
    (r) => !r.standalone && r.path !== '/' && r.path !== '/home',
  );
  const standaloneRoutes = extraRoutes.filter((r) => r.standalone);

  const layoutChildren = (
    <>
      <Route path="/" element={homeElement} />
      <Route path="/home" element={homeElement} />
      <Route path="about" element={<AboutPage />} />
      {layoutRoutes.map((r) => (
        <Route
          key={r.path}
          path={r.path.replace(/^\//, '')}
          element={<LazyRoute load={r.load} />}
        />
      ))}
    </>
  );

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL} useTransitions={false}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* 门户页（公开 · 未登录落地） */}
        <Route path="/portal" element={<PortalPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/welcome" element={<WelcomePage />} />
          {useConsole ? <Route element={<ConsoleLayout />}>{layoutChildren}</Route> : layoutChildren}
        </Route>
        {standaloneRoutes.map((r) => (
          <Route
            key={r.path}
            path={r.path.replace(/^\//, '')}
            element={<LazyRoute load={r.load} />}
          />
        ))}
        <Route path="*" element={<Navigate to={fallbackPath} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

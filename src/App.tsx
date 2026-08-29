/**
 * 桌面端 · 路由装配（端自身骨架）
 * /login 登录页；/、/home 启动页（登录守卫）。
 */
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom';

import { getEdition } from './config/editions';
import { isLoggedIn } from './lib/auth';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

/** 登录守卫：required=false（游客直达）时放行 */
function RequireAuth() {
  const edition = getEdition();
  const required = edition.login?.required !== false;
  if (required && !isLoggedIn()) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

/**
 * 桌面端 · 首页入口（端自身骨架）.
 *
 * edition.homePath 存在且非 /home 时重定向到客户业务首页；
 * 否则渲染关于页（底包信息预览，generic 版默认首页）。
 * 对齐 mobile-web HomePage（业务首页由客户包 extraRoutes 注入）。
 */
import { Navigate } from 'react-router-dom';

import { getEdition } from '../config/editions';
import AboutPage from './AboutPage';

export default function HomePage() {
  const edition = getEdition();
  const homePath = edition.homePath ?? '/home';
  if (homePath !== '/home') return <Navigate to={homePath} replace />;
  return <AboutPage />;
}

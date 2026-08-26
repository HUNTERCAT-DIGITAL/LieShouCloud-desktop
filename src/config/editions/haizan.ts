/**
 * 版别配置 · haizan（海赞集团投资管理门户）.
 * 纯门户版别：行业能力为空，业务菜单裁剪，仅保留集团专属路由（extraRoutes 注入）。
 */
import type { DesktopEdition } from './types';

export const haizanEdition: DesktopEdition = {
  id: 'haizan',
  brandName: '海赞集团 · 投资管理',
  industries: [],
  hiddenMenus: [
    '/customers', '/legal', '/inventory', '/finance', '/approval',
    '/edu', '/iot', '/welcome',
  ],
};

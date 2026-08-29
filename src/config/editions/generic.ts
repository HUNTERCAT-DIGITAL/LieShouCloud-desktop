/**
 * 版别配置 · generic.
 * 客户层声明（industries: 启用的行业能力）+ 品牌 + 菜单裁剪。
 */
import type { DesktopEdition } from './types';

export const genericEdition: DesktopEdition = {
  id: 'generic',
  brandName: 'LieShou Cloud Desktop',
  // 上游薄壳化(2026-08-29): generic 登录后落地引用包介绍页
  homePath: '/about',
  login: { required: true, mode: 'password' },
  // 中性品牌默认值（客户仓 *.extra.ts / tauri.<client>.conf.json 覆盖）
  branding: {
    slogan: '一站式企业数字化工作台',
    footerText: 'LieShou Cloud Desktop',
  },
  industries: [],
  // 上游薄壳化: generic 清理业务导航(案件/法律/库存/客户/财务/审批等); 客户版按需启用
  hiddenMenus: ['/cases', '/legal', '/inventory', '/customers', '/customer', '/finance', '/approval', '/knowledge', '/schedule', '/ai', '/admin'],
};

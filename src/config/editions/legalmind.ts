/**
 * 版别配置 · legalmind.
 * 客户层声明（industries: 启用的行业能力）+ 品牌 + 菜单裁剪。
 */
import type { DesktopEdition } from './types';

export const legalmindEdition: DesktopEdition = {
  id: 'legalmind',
  brandName: 'LegalMind · 智法云枢',
  industries: ['legal'],
  hiddenMenus: ['/customers', '/inventory', '/finance', '/approval', '/welcome'],
};

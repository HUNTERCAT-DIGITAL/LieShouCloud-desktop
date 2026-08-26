/**
 * 版别配置 · dwjk.
 * 客户层声明（industries: 启用的行业能力）+ 品牌 + 菜单裁剪。
 */
import type { DesktopEdition } from './types';

export const dwjkEdition: DesktopEdition = {
  id: 'dwjk',
  brandName: '物联网云平台',
  industries: ['iot'],
  hiddenMenus: ['/customers', '/legal', '/inventory', '/finance', '/approval', '/welcome'],
};

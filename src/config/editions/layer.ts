/**
 * 版别配置 · layer.
 * 客户层声明（industries: 启用的行业能力）+ 品牌 + 菜单裁剪。
 */
import type { DesktopEdition } from './types';

export const layerEdition: DesktopEdition = {
  id: 'layer',
  brandName: 'LieShouCloud · 法律版',
  industries: ['legal'],
  hiddenMenus: ['/customers', '/inventory', '/finance', '/approval'],
};

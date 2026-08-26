/**
 * 版别配置 · jmzz.
 * 客户层声明（industries: 启用的行业能力）+ 品牌 + 菜单裁剪。
 */
import type { DesktopEdition } from './types';

export const jmzzEdition: DesktopEdition = {
  id: 'jmzz',
  brandName: '猎手云 Pro · 制造版',
  industries: [],
  hiddenMenus: ['/customers', '/legal', '/approval'],
};

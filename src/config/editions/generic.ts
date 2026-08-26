/**
 * 版别配置 · generic.
 * 客户层声明（industries: 启用的行业能力）+ 品牌 + 菜单裁剪。
 */
import type { DesktopEdition } from './types';

export const genericEdition: DesktopEdition = {
  id: 'generic',
  brandName: '猎手云 Pro',
  industries: [],
  hiddenMenus: ['/legal', '/inventory'],
};

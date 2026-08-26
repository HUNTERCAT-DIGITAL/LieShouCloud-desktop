/**
 * 版别配置 · zhiye.
 * 客户层声明（industries: 启用的行业能力）+ 品牌 + 菜单裁剪。
 */
import type { DesktopEdition } from './types';

export const zhiyeEdition: DesktopEdition = {
  id: 'zhiye',
  brandName: '智野教育 · 青少年科技教育',
  industries: ['edu'],
  hiddenMenus: ['/customers', '/inventory', '/finance', '/approval'],
};

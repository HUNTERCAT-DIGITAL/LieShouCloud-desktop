/**
 * 版别配置 · generic.
 * 客户层声明（industries: 启用的行业能力）+ 品牌 + 菜单裁剪。
 */
import type { DesktopEdition } from './types';

export const genericEdition: DesktopEdition = {
  id: 'generic',
  brandName: 'LieShou Cloud Desktop',
  // 中性品牌默认值（客户仓 *.extra.ts / tauri.<client>.conf.json 覆盖）
  branding: {
    slogan: '一站式企业数字化工作台',
    footerText: 'LieShou Cloud Desktop',
  },
  industries: [],
  // /cases 为 legalmind 案件业务（上游中性版隐藏；客户版按需覆盖）
  hiddenMenus: ['/cases', '/legal', '/inventory'],
};

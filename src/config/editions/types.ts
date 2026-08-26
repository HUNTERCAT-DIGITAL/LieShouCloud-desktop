/**
 * Desktop 版别（Edition）类型 · 客户层（与行业层解耦，2026-09）.
 * 精简版：端侧只关心品牌 / 启用的行业能力 / 菜单裁剪；
 * 门户营销字段（hero/faq/cta）由 admin-web 承载，此处不复制。
 */
import type { IndustryId } from '@lieshoucloud/types';

export type DesktopEditionId = 'generic' | 'layer' | 'zhiye' | 'jmzz' | 'legalmind' | 'dwjk';

export interface DesktopEdition {
  id: DesktopEditionId;
  /** 品牌名（窗口标题/侧边栏等） */
  brandName: string;
  /** 启用的行业能力（行业菜单显隐由此派生） */
  industries: IndustryId[];
  /** 隐藏菜单路径前缀（客户级裁剪，如 '/customers' 隐藏 CRM） */
  hiddenMenus?: string[];
}

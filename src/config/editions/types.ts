/**
 * Desktop 版别（Edition）类型 · 客户层（与行业层解耦，2026-09）.
 * 精简版：端侧只关心品牌 / 启用的行业能力 / 菜单裁剪；
 * 门户营销字段（hero/faq/cta）由 admin-web 承载，此处不复制。
 */
import type { ComponentType } from 'react';
import type { IndustryId } from '@lieshoucloud/contract-types';

export type DesktopEditionId = 'generic' | 'layer';

/**
 * 品牌（branding）配置 · 2026-09 客户品牌可配置化.
 *
 * 上游仓库只保留中性默认值；客户/行业版由客户仓 `*.extra.ts`（运行时 UI 层）
 * 与构建期 `tauri.<client>.conf.json`（原生层：安装包名/描述/CSP/升级端点）注入。
 */
export interface DesktopBranding {
  /** 品牌 Logo（public/ 下路径或客户包 import 的资产 URL；缺省 /brand-logo.png） */
  logo?: string;
  /** 登录页副标语 */
  slogan?: string;
  /** 页脚版权行（版本号由运行时拼接，无需在此写死） */
  footerText?: string;
  /** 原生窗口标题（运行时 setTitle 覆盖 tauri.conf.json；缺省 brandName） */
  windowTitle?: string;
  /** 品牌主色（antd token + 登录页渐变；缺省默认品牌蓝） */
  colorPrimary?: string;
  /** 默认租户编码（客户版登录缺省；缺省用 contract-config 默认值） */
  defaultTenant?: string;
}

export interface DesktopEdition {
  id: DesktopEditionId;
  /** 品牌名（窗口标题/侧边栏等） */
  brandName: string;
  /** 品牌增强（logo/标语/页脚/主色/默认租户 · 客户仓可覆盖） */
  branding?: DesktopBranding;
  /** 登录后首页（客户可注入专属作战台路径；缺省 /welcome） */
  homePath?: string;
  /** 启用的行业能力（行业菜单显隐由此派生） */
  industries: IndustryId[];
  /**
   * 启用的能力清单（模块级组合 · 2026-09，缺省 = industries 对应行业全量）。
   * 约定 CapabilityId = `${industry}/${module}`，如 'legal/cases'、'iot/devices'。
   */
  capabilities?: string[];
  /**
   * 客户专属路由（客户聚合仓模式 · 2026-09）。由客户仓 deploy 生成注入（*.extra.ts）。
   */
  extraRoutes?: { path: string; load: () => Promise<{ default: ComponentType }> }[];
  /** 隐藏菜单路径前缀（客户级裁剪，如 '/customers' 隐藏 CRM） */
  hiddenMenus?: string[];
}

/**
 * Desktop 版别（Edition）配置层 · 客户层 ↔ 行业层解耦（2026-09）.
 *
 * - 识别：VITE_EDITION 构建期注入 → 域名推断 → generic；
 *   登录后 tenantEdition（后端权威）兜底品牌展示。
 * - 装配：行业菜单显隐由 edition.industries 派生（industry 包工作台数据）；
 *   hiddenMenus 做客户级裁剪。
 */
import type { IndustryId } from '@lieshoucloud/contract-types';

import { genericEdition } from './generic';
import { layerEdition } from './layer';
import type { DesktopBranding, DesktopEdition, DesktopEditionId } from './types';

export type { DesktopEdition, DesktopEditionId } from './types';

const EDITION_ENV_KEY = 'VITE_EDITION';

export const EDITIONS: Record<DesktopEditionId, DesktopEdition> = {
  generic: genericEdition,
  layer: layerEdition,
};

function editionFromEnv(): DesktopEditionId | null {
  const v = import.meta.env?.[EDITION_ENV_KEY] as string | undefined;
  if (v && v in EDITIONS) return v as DesktopEditionId;
  return null;
}

function editionFromHostname(host: string): DesktopEditionId {
  if (host.startsWith('layer.')) return 'layer';
  return 'generic';
}

/** 解析当前部署版别（env 优先 → 域名推断 → generic） */
export function resolveEditionId(): DesktopEditionId {
  return (
    editionFromEnv() ??
    (typeof window === 'undefined' ? 'generic' : editionFromHostname(window.location.hostname))
  );
}

/** 当前部署版别配置（基础版 + 客户仓 extra 增强叠加） */
export function getEdition(): DesktopEdition {
  const base = EDITIONS[resolveEditionId()];
  return { ...base, ...getExtraEdition() };
}

/** 客户版别启用的行业能力（行业菜单显隐的派生入口） */
export function getEditionIndustries(edition: DesktopEdition): IndustryId[] {
  return edition.industries ?? [];
}

/**
 * 客户在某行业启用的能力清单（模块级组合 · 2026-09）。
 * - capabilities 已声明 → 精确匹配该行业子集；
 * - 未声明（null）→ 行业全量。
 */
export function getEnabledCapabilities(edition: DesktopEdition, industry: IndustryId): string[] | null {
  const caps = edition.capabilities ?? [];
  if (caps.length === 0) return null;
  return caps.filter((c) => c.startsWith(`${industry}/`));
}

/** 某能力是否被客户启用（缺省行业全量时返回 true） */
export function isCapabilityEnabled(
  edition: DesktopEdition,
  industry: IndustryId,
  capability: string,
): boolean {
  const caps = getEnabledCapabilities(edition, industry);
  return caps === null || caps.includes(capability);
}

/** 菜单过滤：path 是否被版别裁剪（hiddenMenus 前缀匹配） */
export function isMenuHidden(edition: DesktopEdition, path: string): boolean {
  return (edition.hiddenMenus ?? []).some((h) => path === h || path.startsWith(`${h}/`));
}

/** 品牌默认值（中性；客户版未覆盖时回落；generic 用内置 SVG，客户仓 prepare 生成 brand-logo.png 显式覆盖） */
const DEFAULT_BRANDING: Required<DesktopBranding> = {
  logo: '/logo-default.svg',
  slogan: '一站式企业数字化工作台',
  footerText: 'LieShou Cloud Desktop',
  windowTitle: 'LieShou Cloud Desktop',
  colorPrimary: '#02429B',
  defaultTenant: '',
};

/**
 * 品牌合并（纯函数 · 缺省字段补默认值）。
 * 版别配置 → 完整品牌对象；客户仓 *.extra.ts 的 branding 字段覆盖默认值。
 */
export function mergeBranding(edition: DesktopEdition): Required<DesktopBranding> {
  const b = edition.branding ?? {};
  return { ...DEFAULT_BRANDING, ...b };
}

/**
 * 当前版别品牌配置（缺省字段补默认值）。
 * UI 层统一从该函数取品牌（logo/标语/页脚/主色/默认租户），不再硬编码客户品牌。
 */
export function getBranding(): Required<DesktopBranding> {
  return mergeBranding(getEdition());
}

/** 后端租户版别 → 端配置（未知回退 generic） */
export function editionFromTenant(tenantEdition?: string | null): DesktopEdition {
  const id = (tenantEdition ?? '').toLowerCase();
  return id in EDITIONS ? EDITIONS[id as DesktopEditionId] : EDITIONS.generic;
}

/**
 * 客户仓注入的 Edition 增强（extraRoutes 等 · 2026-09 客户聚合仓模式）.
 * 独立仓库（无客户仓）glob 不匹配 → 空；客户仓 deploy:prepare 生成 `*.extra.ts` 后自动合并。
 */
const EXTRA_MODULES = import.meta.glob<{ default?: Partial<DesktopEdition> }>('./*.extra.ts', {
  eager: true,
});

export function getExtraEdition(): Partial<DesktopEdition> {
  return Object.values(EXTRA_MODULES)
    .map((m) => m.default ?? {})
    .reduce<Partial<DesktopEdition>>((acc, cur) => ({ ...acc, ...cur }), {});
}

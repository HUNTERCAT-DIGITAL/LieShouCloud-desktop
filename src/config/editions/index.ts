/**
 * Desktop 版别（Edition）配置层 · 客户层 ↔ 行业层解耦（2026-09）.
 *
 * - 识别：VITE_EDITION 构建期注入 → 域名推断 → generic；
 *   登录后 tenantEdition（后端权威）兜底品牌展示。
 * - 装配：行业菜单显隐由 edition.industries 派生（industry 包工作台数据）；
 *   hiddenMenus 做客户级裁剪。
 */
import type { IndustryId } from '@lieshoucloud/types';

import { dwjkEdition } from './dwjk';
import { genericEdition } from './generic';
import { jmzzEdition } from './jmzz';
import { layerEdition } from './layer';
import { legalmindEdition } from './legalmind';
import { zhiyeEdition } from './zhiye';
import type { DesktopEdition, DesktopEditionId } from './types';

export type { DesktopEdition, DesktopEditionId } from './types';

const EDITION_ENV_KEY = 'VITE_EDITION';

export const EDITIONS: Record<DesktopEditionId, DesktopEdition> = {
  generic: genericEdition,
  layer: layerEdition,
  zhiye: zhiyeEdition,
  jmzz: jmzzEdition,
  legalmind: legalmindEdition,
  dwjk: dwjkEdition,
};

function editionFromEnv(): DesktopEditionId | null {
  const v = import.meta.env?.[EDITION_ENV_KEY] as string | undefined;
  if (v && v in EDITIONS) return v as DesktopEditionId;
  return null;
}

function editionFromHostname(host: string): DesktopEditionId {
  if (host.startsWith('legalmind.')) return 'legalmind';
  if (host.startsWith('layer.')) return 'layer';
  if (host.startsWith('zhiye.')) return 'zhiye';
  if (host.startsWith('jmzz.') || host.includes('.jmzz.')) return 'jmzz';
  if (host.startsWith('dwjk.')) return 'dwjk';
  return 'generic';
}

/** 解析当前部署版别（env 优先 → 域名推断 → generic） */
export function resolveEditionId(): DesktopEditionId {
  return (
    editionFromEnv() ??
    (typeof window === 'undefined' ? 'generic' : editionFromHostname(window.location.hostname))
  );
}

/** 当前部署版别配置 */
export function getEdition(): DesktopEdition {
  return EDITIONS[resolveEditionId()];
}

/** 客户版别启用的行业能力（行业菜单显隐的派生入口） */
export function getEditionIndustries(edition: DesktopEdition): IndustryId[] {
  return edition.industries ?? [];
}

/** 菜单过滤：path 是否被版别裁剪（hiddenMenus 前缀匹配） */
export function isMenuHidden(edition: DesktopEdition, path: string): boolean {
  return (edition.hiddenMenus ?? []).some((h) => path === h || path.startsWith(`${h}/`));
}

/** 后端租户版别 → 端配置（未知回退 generic） */
export function editionFromTenant(tenantEdition?: string | null): DesktopEdition {
  const id = (tenantEdition ?? '').toLowerCase();
  return id in EDITIONS ? EDITIONS[id as DesktopEditionId] : EDITIONS.generic;
}

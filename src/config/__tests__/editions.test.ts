/**
 * Desktop 版别（Edition）装配逻辑单测 · 客户层与行业层解耦（2026-09）.
 */
import { describe, expect, it, vi } from 'vitest';

import type { DesktopEdition } from '../editions';
import {
  EDITIONS,
  editionFromTenant,
  getEditionIndustries,
  getEnabledCapabilities,
  isCapabilityEnabled,
  isMenuHidden,
  resolveEditionId,
} from '../editions';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('版别配置表', () => {
  it('全部版别都有品牌与行业声明', () => {
    for (const id of ['generic', 'layer', 'zhiye', 'jmzz', 'legalmind', 'dwjk'] as const) {
      const e = EDITIONS[id];
      expect(e.brandName).toBeTruthy();
      expect(Array.isArray(e.industries)).toBe(true);
    }
  });

  it('legalmind（凌科安时客户）声明启用 legal 行业能力', () => {
    expect(getEditionIndustries(EDITIONS.legalmind)).toContain('legal');
    expect(getEditionIndustries(EDITIONS.legalmind)).not.toContain('edu');
  });

  it('dwjk 声明启用 iot；zhiye 声明启用 edu；generic 不启用任何行业', () => {
    expect(getEditionIndustries(EDITIONS.dwjk)).toContain('iot');
    expect(getEditionIndustries(EDITIONS.zhiye)).toContain('edu');
    expect(getEditionIndustries(EDITIONS.generic)).toEqual([]);
  });
});

describe('菜单裁剪（hiddenMenus 前缀匹配）', () => {
  it('legalmind 裁剪 CRM/库存/财务/审批菜单', () => {
    const e = EDITIONS.legalmind;
    expect(isMenuHidden(e, '/customers')).toBe(true);
    expect(isMenuHidden(e, '/inventory')).toBe(true);
    expect(isMenuHidden(e, '/finance')).toBe(true);
    expect(isMenuHidden(e, '/legal/cases')).toBe(false);
    expect(isMenuHidden(e, '/welcome')).toBe(true);
  });

  it('generic 不裁剪基础菜单', () => {
    expect(isMenuHidden(EDITIONS.generic, '/customers')).toBe(false);
  });

  it('前缀匹配覆盖子路径', () => {
    expect(isMenuHidden(EDITIONS.legalmind, '/customers/detail/1')).toBe(true);
  });
});

describe('能力组合（capabilities 模块级 · 跨行业）', () => {
  it('未声明 capabilities → 行业全量（null）', () => {
    expect(getEnabledCapabilities(EDITIONS.legalmind, 'legal')).toBeNull();
    expect(isCapabilityEnabled(EDITIONS.legalmind, 'legal', 'legal/cases')).toBe(true);
  });

  it('客户声明能力子集 → 精确组合（跨行业：legal 案件/计时 + iot 设备）', () => {
    const custom: DesktopEdition = {
      id: 'legalmind',
      brandName: '测试客户',
      industries: ['legal', 'iot'],
      capabilities: ['legal/cases', 'legal/time', 'iot/devices'],
    };
    expect(getEnabledCapabilities(custom, 'legal')).toEqual(['legal/cases', 'legal/time']);
    expect(getEnabledCapabilities(custom, 'iot')).toEqual(['iot/devices']);
    expect(isCapabilityEnabled(custom, 'legal', 'legal/schedule')).toBe(false);
    expect(isCapabilityEnabled(custom, 'iot', 'iot/alerts')).toBe(false);
  });

  it('capabilities 空数组视为未声明', () => {
    const e: DesktopEdition = { id: 'generic', brandName: 'x', industries: ['legal'], capabilities: [] };
    expect(getEnabledCapabilities(e, 'legal')).toBeNull();
  });
});

describe('版别识别', () => {
  it('VITE_EDITION 注入优先', () => {
    vi.stubEnv('VITE_EDITION', 'legalmind');
    expect(resolveEditionId()).toBe('legalmind');
  });

  it('非法环境变量回退域名推断', () => {
    vi.stubEnv('VITE_EDITION', 'nope');
    vi.stubGlobal('window', { location: { hostname: 'layer.example.com' } });
    expect(resolveEditionId()).toBe('layer');
  });

  it('tenantEdition 兜底转换（未知回退 generic）', () => {
    expect(editionFromTenant('LEGALMIND').id).toBe('legalmind');
    expect(editionFromTenant('whatever').id).toBe('generic');
  });
});

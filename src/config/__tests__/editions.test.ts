/**
 * Desktop 版别（Edition）装配逻辑单测 · 客户层与行业层解耦（2026-09）.
 */
import { describe, expect, it, vi } from 'vitest';

import {
  EDITIONS,
  editionFromTenant,
  getEditionIndustries,
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

  it('legalmind（凌科数安客户）声明启用 legal 行业能力', () => {
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

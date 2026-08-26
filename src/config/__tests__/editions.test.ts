/**
 * 版别配置层单测（ADR-0035 · desktop 开源版 generic/layer）.
 *
 * 注：客户版别（dwjk/haizan/hekeren/huntercat/jmzz/legalmind/linkesecurity/zhiye）
 * 已在开源化时剥离（2026-08），相关测试随客户仓。
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DesktopEdition } from '../editions';
import {
  EDITIONS,
  getEditionIndustries,
  getEnabledCapabilities,
  isCapabilityEnabled,
  resolveEditionId,
} from '../editions';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('版别配置表（开源版）', () => {
  it('generic/layer 都有完整品牌配置', () => {
    for (const id of ['generic', 'layer'] as const) {
      const e = EDITIONS[id];
      expect(e.brandName).toBeTruthy();
      expect(Array.isArray(e.industries)).toBe(true);
    }
  });

  it('generic 不启用任何行业能力；layer 声明启用 legal', () => {
    expect(getEditionIndustries(EDITIONS.generic)).toEqual([]);
    expect(getEditionIndustries(EDITIONS.layer)).toContain('legal');
  });
});

describe('行业能力装配（industry 包机制 · 客户仓注入）', () => {
  it('layer 未声明 capabilities → 行业全量（不过滤）', () => {
    expect(getEnabledCapabilities(EDITIONS.layer, 'legal')).toBeNull();
    expect(isCapabilityEnabled(EDITIONS.layer, 'legal', '/legal/cases')).toBe(true);
  });

  it('自定义组合：capabilities 精确匹配', () => {
    const custom: DesktopEdition = {
      ...EDITIONS.layer,
      industries: ['legal', 'iot'],
      capabilities: ['legal/cases', 'iot/devices'],
    };
    expect(getEnabledCapabilities(custom, 'legal')).toEqual(['legal/cases']);
    expect(isCapabilityEnabled(custom, 'legal', 'legal/cases')).toBe(true);
    expect(isCapabilityEnabled(custom, 'legal', 'legal/time')).toBe(false);
    expect(isCapabilityEnabled(custom, 'iot', 'iot/devices')).toBe(true);
  });
});

describe('resolveEditionId（版别识别）', () => {
  it('VITE_EDITION 注入优先（layer）', () => {
    vi.stubEnv('VITE_EDITION', 'layer');
    expect(resolveEditionId()).toBe('layer');
  });

  it('未知域名 → generic 兜底', () => {
    vi.stubGlobal('window', { location: { hostname: 'localhost' } });
    expect(resolveEditionId()).toBe('generic');
  });
});

describe('功能裁剪（hiddenMenus）', () => {
  it('layer（法律版）隐藏通用业务模块', () => {
    expect(EDITIONS.layer.hiddenMenus).toEqual(
      expect.arrayContaining(['/customers', '/inventory', '/finance', '/approval']),
    );
  });

  it('generic 版裁剪行业残留（/legal /inventory 由客户仓覆盖）', () => {
    expect(EDITIONS.generic.hiddenMenus).toEqual(expect.arrayContaining(['/legal', '/inventory']));
  });
});

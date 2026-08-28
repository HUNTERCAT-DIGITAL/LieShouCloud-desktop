/**
 * 客户 service 单测（2026-10 上收 core-web 后改测 ApiPort 传输）.
 *
 * 上收后 services/customer.ts 为 core-web（crm 域）薄 re-export，实现走 requestApi →
 * 注入的 ApiPort。注入 portRequest spy，验证 URL path / query / body 透传（全路径带 /api 前缀）。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { configureCore } from '@lieshoucloud/core-web';

const { portRequest } = vi.hoisted(() => ({
  portRequest: vi.fn(),
}));

import { STATUS_META, countCustomers, getCustomer, listCustomers } from './customer';

beforeEach(() => {
  portRequest.mockReset();
  configureCore({
    storage: { get: () => null, set: () => {}, remove: () => {} },
    notifier: { success: () => {}, error: () => {} },
    navigation: { to: () => {}, replace: () => {} },
    api: { request: portRequest },
  });
});

describe('customer service（core-web 上收 · ApiPort 传输）', () => {
  it('listCustomers 无参数 → GET /api/customers', async () => {
    portRequest.mockResolvedValue([]);
    await listCustomers();
    expect(portRequest).toHaveBeenCalledWith('/api/customers', undefined);
  });

  it('listCustomers 带 keyword + status → query 编码', async () => {
    portRequest.mockResolvedValue([]);
    await listCustomers('张三 诊所', 'CONVERTED');
    expect(portRequest).toHaveBeenCalledWith(
      '/api/customers?keyword=%E5%BC%A0%E4%B8%89%20%E8%AF%8A%E6%89%80&status=CONVERTED',
      undefined,
    );
  });

  it('listCustomers 只带 status → 只有 status query', async () => {
    portRequest.mockResolvedValue([]);
    await listCustomers(undefined, 'LOST');
    expect(portRequest).toHaveBeenCalledWith('/api/customers?status=LOST', undefined);
  });

  it('countCustomers → GET /api/customers/count', async () => {
    portRequest.mockResolvedValue(5);
    await expect(countCustomers()).resolves.toBe(5);
    expect(portRequest).toHaveBeenCalledWith('/api/customers/count', undefined);
  });

  it('getCustomer 动态 id → GET /api/customers/{id}', async () => {
    portRequest.mockResolvedValue({ id: 42 });
    await getCustomer(42);
    expect(portRequest).toHaveBeenCalledWith('/api/customers/42', undefined);
  });

  it('STATUS_META 四种状态齐全且有中文文案（contract-types 共享源）', () => {
    expect(Object.keys(STATUS_META)).toEqual(['NEW', 'FOLLOWING', 'CONVERTED', 'LOST']);
    expect(STATUS_META.NEW.text).toBe('新客户');
    expect(STATUS_META.CONVERTED.text).toBe('已转化');
  });
});

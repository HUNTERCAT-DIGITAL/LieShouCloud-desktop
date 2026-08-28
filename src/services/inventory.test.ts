/**
 * 进销存 service 单测（2026-10 上收 core-web 后改测 ApiPort 传输）.
 *
 * 上收后 services/inventory.ts 为 core-web 薄 re-export（stockIn/stockOut 收 body 对象），
 * 实现走 requestApi → 注入的 ApiPort。注入 portRequest spy，验证 URL path / query / body 透传。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { configureCore } from '@lieshoucloud/core-web';

const { portRequest } = vi.hoisted(() => ({
  portRequest: vi.fn(),
}));

import {
  MOVEMENT_META,
  createProduct,
  listMovements,
  listProducts,
  stockIn,
  stockOut,
} from './inventory';

beforeEach(() => {
  portRequest.mockReset();
  configureCore({
    storage: { get: () => null, set: () => {}, remove: () => {} },
    notifier: { success: () => {}, error: () => {} },
    navigation: { to: () => {}, replace: () => {} },
    api: { request: portRequest },
  });
});

const JSON_HEADERS = { 'Content-Type': 'application/json' };

describe('inventory service（core-web 上收 · ApiPort 传输）', () => {
  it('listProducts 无 keyword → GET /api/products', async () => {
    portRequest.mockResolvedValue([]);
    await listProducts();
    expect(portRequest).toHaveBeenCalledWith('/api/products', undefined);
  });

  it('listProducts 带 keyword → query 编码', async () => {
    portRequest.mockResolvedValue([]);
    await listProducts('感冒灵');
    expect(portRequest).toHaveBeenCalledWith(
      '/api/products?keyword=%E6%84%9F%E5%86%92%E7%81%B5',
      undefined,
    );
  });

  it('createProduct → POST /api/products + body 透传', async () => {
    portRequest.mockResolvedValue({ id: 1 });
    const body = { name: '阿莫西林', unit: '盒', price: 18.5 };
    await createProduct(body);
    expect(portRequest).toHaveBeenCalledWith('/api/products', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
    });
  });

  it('stockIn → POST /api/products/{id}/stock-in + body（对象签名）', async () => {
    portRequest.mockResolvedValue({ id: 1, stockQuantity: 110 });
    await stockIn(1, { quantity: 10, remark: '补货' });
    expect(portRequest).toHaveBeenCalledWith('/api/products/1/stock-in', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ quantity: 10, remark: '补货' }),
    });
  });

  it('stockOut → POST /api/products/{id}/stock-out + body（对象签名）', async () => {
    portRequest.mockResolvedValue({ id: 1, stockQuantity: 90 });
    await stockOut(1, { quantity: 5 });
    expect(portRequest).toHaveBeenCalledWith('/api/products/1/stock-out', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: '{"quantity":5}',
    });
  });

  it('listMovements → GET /api/products/{id}/movements', async () => {
    portRequest.mockResolvedValue([]);
    await listMovements(7);
    expect(portRequest).toHaveBeenCalledWith('/api/products/7/movements', undefined);
  });

  it('MOVEMENT_META 出入库文案（contract-types 共享源）', () => {
    expect(MOVEMENT_META.IN.text).toBe('入库');
    expect(MOVEMENT_META.OUT.text).toBe('出库');
  });
});

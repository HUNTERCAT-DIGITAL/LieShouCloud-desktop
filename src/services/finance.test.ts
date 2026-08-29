/**
 * 财务记账 service 单测（2026-10 上收 core-web 后改测 ApiPort 传输）.
 *
 * 上收后 services/finance.ts 为 core-web 薄 re-export（getSummary → getLedgerSummary 别名），
 * 实现走 requestApi → 注入的 ApiPort。注入 portRequest spy，验证 URL path / query / body 透传。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { configureCore } from '@lieshoucloud/core-web';

const { portRequest } = vi.hoisted(() => ({
  portRequest: vi.fn(),
}));

import {
  LEDGER_CATEGORIES,
  LEDGER_TYPE_META,
  createLedger,
  deleteLedger,
  getSummary,
  listLedger,
} from './finance';

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

describe('finance service（core-web 上收 · ApiPort 传输）', () => {
  it('listLedger 无 type → GET /api/ledger', async () => {
    portRequest.mockResolvedValue([]);
    await listLedger();
    expect(portRequest).toHaveBeenCalledWith('/api/ledger', undefined);
  });

  it('listLedger 带 type → query（对象签名）', async () => {
    portRequest.mockResolvedValue([]);
    await listLedger({ type: 'EXPENSE' });
    expect(portRequest).toHaveBeenCalledWith('/api/ledger?type=EXPENSE', undefined);
  });

  it('getSummary（别名 → getLedgerSummary）→ GET /api/ledger/summary', async () => {
    portRequest.mockResolvedValue({ income: 100, expense: 40, balance: 60, count: 3 });
    const s = await getSummary();
    expect(s.balance).toBe(60);
    expect(portRequest).toHaveBeenCalledWith('/api/ledger/summary', undefined);
  });

  it('createLedger → POST /api/ledger + body 透传', async () => {
    portRequest.mockResolvedValue({ id: 9 });
    const body = { type: 'INCOME' as const, amount: 200, category: '销售收入', occurredAt: '2026-08-01' };
    await createLedger(body);
    expect(portRequest).toHaveBeenCalledWith('/api/ledger', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
    });
  });

  it('deleteLedger → DELETE /api/ledger/{id}', async () => {
    portRequest.mockResolvedValue(undefined);
    await deleteLedger(3);
    expect(portRequest).toHaveBeenCalledWith('/api/ledger/3', { method: 'DELETE' });
  });

  it('类型元数据与分类列表（contract-types 共享源）', () => {
    expect(LEDGER_TYPE_META.INCOME.text).toBe('收入');
    expect(LEDGER_TYPE_META.EXPENSE.text).toBe('支出');
    expect(LEDGER_CATEGORIES).toContain('销售收入');
  });
});

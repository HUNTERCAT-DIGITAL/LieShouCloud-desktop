/**
 * 案件 service 单测（智法云枢 · legal 域）.
 *
 * 2026-10 上收 core-web 后改测 ApiPort 传输：实现走 requestApi → 注入的 ApiPort，
 * 注入 portRequest spy，验证 URL path / query / body 透传（全路径带 /api 前缀）。
 * advanceStage 为纯函数（不走传输），测试原样保留。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { configureCore } from '@lieshoucloud/core-web';

const { portRequest } = vi.hoisted(() => ({
  portRequest: vi.fn(),
}));

import type { CaseStage } from '@lieshoucloud/contract-types/business/legal';
import {
  addCaseEvent,
  advanceStage,
  confirmTimeEntry,
  createCase,
  createDocument,
  deleteCase,
  deleteCaseEvent,
  deleteDocument,
  deleteExpense,
  deleteTimeEntry,
  getCase,
  listCases,
  listCaseEvents,
  updateCase,
  updateCaseEvent,
  updateDocument,
  updateExpense,
  updateTimeEntry,
} from './case';

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

describe('case service（core-web 上收 · ApiPort 传输）', () => {
  it('listCases 缺省 → GET /api/legal/cases?page=0&size=20', async () => {
    portRequest.mockResolvedValue({ items: [], total: 0, page: 0, size: 20 });
    await listCases();
    expect(portRequest).toHaveBeenCalledWith('/api/legal/cases?page=0&size=20', undefined);
  });

  it('listCases 带筛选 → query 拼接（keyword 编码）', async () => {
    portRequest.mockResolvedValue({ items: [], total: 0, page: 0, size: 20 });
    await listCases({ keyword: '合同', status: 'FILED', priority: 'HIGH', page: 2, size: 50 });
    expect(portRequest).toHaveBeenCalledWith(
      '/api/legal/cases?keyword=%E5%90%88%E5%90%8C&status=FILED&priority=HIGH&page=2&size=50',
      undefined,
    );
  });

  it('getCase → GET /api/legal/cases/{id}', async () => {
    portRequest.mockResolvedValue({ id: 1 });
    await getCase(7);
    expect(portRequest).toHaveBeenCalledWith('/api/legal/cases/7', undefined);
  });

  it('createCase → POST /api/legal/cases', async () => {
    portRequest.mockResolvedValue({ id: 1 });
    await createCase({ caseNo: '(2026)赣0102民初1号', title: '买卖合同纠纷' });
    expect(portRequest).toHaveBeenCalledWith('/api/legal/cases', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ caseNo: '(2026)赣0102民初1号', title: '买卖合同纠纷' }),
    });
  });

  it('updateCase → PUT /api/legal/cases/{id}', async () => {
    portRequest.mockResolvedValue({ id: 1 });
    await updateCase(1, { caseNo: 'A', title: '改名' });
    expect(portRequest).toHaveBeenCalledWith('/api/legal/cases/1', {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify({ caseNo: 'A', title: '改名' }),
    });
  });

  it('deleteCase → DELETE /api/legal/cases/{id}', async () => {
    portRequest.mockResolvedValue(undefined);
    await deleteCase(3);
    expect(portRequest).toHaveBeenCalledWith('/api/legal/cases/3', { method: 'DELETE' });
  });

  it('listCaseEvents → GET /api/legal/cases/{id}/events', async () => {
    portRequest.mockResolvedValue([]);
    await listCaseEvents(5);
    expect(portRequest).toHaveBeenCalledWith('/api/legal/cases/5/events', undefined);
  });

  it('addCaseEvent → POST /api/legal/cases/{id}/events', async () => {
    portRequest.mockResolvedValue({ id: 1 });
    await addCaseEvent(5, { eventType: 'HEARING', occurredAt: '2026-08-28T09:00:00Z', title: '第一次开庭' });
    expect(portRequest).toHaveBeenCalledWith('/api/legal/cases/5/events', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        eventType: 'HEARING',
        occurredAt: '2026-08-28T09:00:00Z',
        title: '第一次开庭',
      }),
    });
  });
});

describe('advanceStage（八阶段只前进 · 纯函数）', () => {
  it('progress<100 → 标记当前阶段完成(100)', () => {
    expect(advanceStage('CLIENT_MEETING', 40)).toEqual({ stage: 'CLIENT_MEETING', stageProgress: 100 });
  });

  it('progress=100 → 进入下一阶段,进度归 0', () => {
    expect(advanceStage('CLIENT_MEETING', 100)).toEqual({ stage: 'CASE_BRIEF', stageProgress: 0 });
    expect(advanceStage('LEGAL_RESEARCH', 100)).toEqual({ stage: 'STRATEGY_REPORT', stageProgress: 0 });
  });

  it('最后阶段且 100 → 返回 null(不可再推进)', () => {
    expect(advanceStage('FINAL_OUTCOME', 100)).toBeNull();
  });

  it('未知阶段 → null', () => {
    expect(advanceStage('UNKNOWN' as CaseStage, 100)).toBeNull();
  });
});

describe('计时确认流（TimeEntryController）', () => {
  it('confirmTimeEntry → PUT /api/legal/time-entries/{id}/confirm', async () => {
    portRequest.mockResolvedValue({ id: 7, status: 'CONFIRMED' });
    await confirmTimeEntry(7);
    expect(portRequest).toHaveBeenCalledWith('/api/legal/time-entries/7/confirm', {
      method: 'PUT',
    });
  });

  it('updateTimeEntry → PUT /api/legal/time-entries/{id} + body', async () => {
    portRequest.mockResolvedValue({ id: 7 });
    await updateTimeEntry(7, { lawyer: '王律师', workDate: '2026-08-01', hours: 3, rate: 800 });
    expect(portRequest).toHaveBeenCalledWith('/api/legal/time-entries/7', {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify({ lawyer: '王律师', workDate: '2026-08-01', hours: 3, rate: 800 }),
    });
  });

  it('deleteTimeEntry → DELETE /api/legal/time-entries/{id}', async () => {
    portRequest.mockResolvedValue(undefined);
    await deleteTimeEntry(9);
    expect(portRequest).toHaveBeenCalledWith('/api/legal/time-entries/9', { method: 'DELETE' });
  });
});

describe('费用编辑/删除（ExpenseController）', () => {
  it('updateExpense → PUT /api/legal/expenses/{id} + body', async () => {
    portRequest.mockResolvedValue({ id: 3 });
    await updateExpense(3, {
      expenseType: 'COURT_FEE',
      description: '诉讼费',
      amount: 5000,
      expenseDate: '2026-08-02',
    });
    expect(portRequest).toHaveBeenCalledWith('/api/legal/expenses/3', {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        expenseType: 'COURT_FEE',
        description: '诉讼费',
        amount: 5000,
        expenseDate: '2026-08-02',
      }),
    });
  });

  it('deleteExpense → DELETE /api/legal/expenses/{id}', async () => {
    portRequest.mockResolvedValue(undefined);
    await deleteExpense(5);
    expect(portRequest).toHaveBeenCalledWith('/api/legal/expenses/5', { method: 'DELETE' });
  });
});

describe('文书登记/编辑/删除（LegalDocumentController）', () => {
  it('createDocument → POST /api/legal/cases/{id}/documents + body', async () => {
    portRequest.mockResolvedValue({ id: 11 });
    await createDocument(1, { title: '民事起诉状', docType: 'PLEADING', content: '诉状全文' });
    expect(portRequest).toHaveBeenCalledWith('/api/legal/cases/1/documents', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ title: '民事起诉状', docType: 'PLEADING', content: '诉状全文' }),
    });
  });

  it('updateDocument → PUT /api/legal/documents/{id} + body', async () => {
    portRequest.mockResolvedValue({ id: 11 });
    await updateDocument(11, { title: '民事起诉状(修订)' });
    expect(portRequest).toHaveBeenCalledWith('/api/legal/documents/11', {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify({ title: '民事起诉状(修订)' }),
    });
  });

  it('deleteDocument → DELETE /api/legal/documents/{id}', async () => {
    portRequest.mockResolvedValue(undefined);
    await deleteDocument(8);
    expect(portRequest).toHaveBeenCalledWith('/api/legal/documents/8', { method: 'DELETE' });
  });
});

describe('事件编辑/删除（后端新增 PUT/DELETE events）', () => {
  it('updateCaseEvent → PUT /api/legal/cases/{caseId}/events/{eventId} + body', async () => {
    portRequest.mockResolvedValue({ id: 4 });
    await updateCaseEvent(1, 4, {
      eventType: 'HEARING',
      title: '第一次开庭(改期)',
      occurredAt: '2026-08-30',
    });
    expect(portRequest).toHaveBeenCalledWith('/api/legal/cases/1/events/4', {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        eventType: 'HEARING',
        title: '第一次开庭(改期)',
        occurredAt: '2026-08-30',
      }),
    });
  });

  it('deleteCaseEvent → DELETE /api/legal/cases/{caseId}/events/{eventId}', async () => {
    portRequest.mockResolvedValue(undefined);
    await deleteCaseEvent(1, 6);
    expect(portRequest).toHaveBeenCalledWith('/api/legal/cases/1/events/6', { method: 'DELETE' });
  });
});

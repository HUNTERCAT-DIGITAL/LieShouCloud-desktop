/**
 * 业务/个人模块 service 单测（lead/contact/contract/member/quality/notification）.
 *
 * 2026-10 上收 core-web 后改测 ApiPort 传输：实现走 requestApi → 注入的 ApiPort，
 * 注入 portRequest spy，验证 URL path / query / body 透传（全路径带 /api 前缀）。
 * 注意：contact/member 参数序与 core-web 契约对齐（customerId 在前），测试按 core-web 签名调用。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { configureCore } from '@lieshoucloud/core-web';

const { portRequest } = vi.hoisted(() => ({
  portRequest: vi.fn(),
}));

import { createLead, deleteLead, listLeads } from './lead';
import { createContact, listContacts } from './contact';
import { createContract, listContracts, updateContract } from './contract';
import { createMember, listMembers } from './member';
import { createBatch, createInspection, listBatches, listInspections } from './quality';
import { listNotifications, markAllNotificationsRead, unreadNotificationCount } from './notification';

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

describe('lead service（core-web 上收 · ApiPort 传输）', () => {
  it('listLeads 带 keyword+status → query', async () => {
    portRequest.mockResolvedValue([]);
    await listLeads('张三', 'NEW');
    expect(portRequest).toHaveBeenCalledWith(
      '/api/leads?keyword=%E5%BC%A0%E4%B8%89&status=NEW',
      undefined,
    );
  });

  it('createLead → POST /api/leads', async () => {
    portRequest.mockResolvedValue({ id: 1 });
    await createLead({ name: '线索A' });
    expect(portRequest).toHaveBeenCalledWith('/api/leads', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ name: '线索A' }),
    });
  });

  it('deleteLead → DELETE /api/leads/{id}', async () => {
    portRequest.mockResolvedValue({ deleted: true });
    await deleteLead(5);
    expect(portRequest).toHaveBeenCalledWith('/api/leads/5', { method: 'DELETE' });
  });
});

describe('contact service（core-web 上收 · ApiPort 传输）', () => {
  it('listContacts 带 customerId → query（core-web 签名 customerId 在前）', async () => {
    portRequest.mockResolvedValue([]);
    await listContacts(3);
    expect(portRequest).toHaveBeenCalledWith('/api/contacts?customerId=3', undefined);
  });

  it('createContact → POST /api/contacts', async () => {
    portRequest.mockResolvedValue({ id: 1 });
    await createContact({ customerId: 3, name: '张三' });
    expect(portRequest).toHaveBeenCalledWith('/api/contacts', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ customerId: 3, name: '张三' }),
    });
  });
});

describe('contract service（core-web 上收 · ApiPort 传输）', () => {
  it('listContracts 带 status → query', async () => {
    portRequest.mockResolvedValue([]);
    await listContracts(undefined, 'ACTIVE');
    expect(portRequest).toHaveBeenCalledWith('/api/contracts?status=ACTIVE', undefined);
  });

  it('updateContract → PUT /api/contracts/{id}', async () => {
    portRequest.mockResolvedValue({ id: 1 });
    await updateContract(1, { status: 'TERMINATED' });
    expect(portRequest).toHaveBeenCalledWith('/api/contracts/1', {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify({ status: 'TERMINATED' }),
    });
  });

  it('createContract → POST /api/contracts', async () => {
    portRequest.mockResolvedValue({ id: 1 });
    await createContract({ customerId: 3, contractNo: 'HT-001', title: '服务合同' });
    expect(portRequest).toHaveBeenCalledWith('/api/contracts', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ customerId: 3, contractNo: 'HT-001', title: '服务合同' }),
    });
  });
});

describe('member service（core-web 上收 · ApiPort 传输）', () => {
  it('listMembers 带 status → query（core-web 签名 status 在第 3 位）', async () => {
    portRequest.mockResolvedValue([]);
    await listMembers(undefined, undefined, 'ACTIVE');
    expect(portRequest).toHaveBeenCalledWith('/api/members?status=ACTIVE', undefined);
  });

  it('createMember → POST /api/members', async () => {
    portRequest.mockResolvedValue({ id: 1 });
    await createMember({ customerId: 3, memberNo: 'M001', level: 'GOLD' });
    expect(portRequest).toHaveBeenCalledWith('/api/members', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ customerId: 3, memberNo: 'M001', level: 'GOLD' }),
    });
  });
});

describe('quality service（core-web 上收 · ApiPort 传输）', () => {
  it('listBatches → GET /api/batches', async () => {
    portRequest.mockResolvedValue([]);
    await listBatches();
    expect(portRequest).toHaveBeenCalledWith('/api/batches', undefined);
  });

  it('createBatch → POST /api/batches', async () => {
    portRequest.mockResolvedValue({ id: 1 });
    await createBatch({ productId: 1, batchNo: 'B001', quantity: 100 });
    expect(portRequest).toHaveBeenCalledWith('/api/batches', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ productId: 1, batchNo: 'B001', quantity: 100 }),
    });
  });

  it('listInspections 带 type+result → query', async () => {
    portRequest.mockResolvedValue([]);
    await listInspections({ type: 'IQC', result: 'FAIL' });
    expect(portRequest).toHaveBeenCalledWith(
      '/api/inspections?type=IQC&result=FAIL',
      undefined,
    );
  });

  it('createInspection → POST /api/inspections', async () => {
    portRequest.mockResolvedValue({ id: 1 });
    await createInspection({ productId: 1, batchId: 2, type: 'FQC', result: 'PASS', quantity: 50 });
    expect(portRequest).toHaveBeenCalledWith('/api/inspections', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ productId: 1, batchId: 2, type: 'FQC', result: 'PASS', quantity: 50 }),
    });
  });
});

describe('notification service（core-web 上收 · ApiPort 传输）', () => {
  it('listNotifications → GET /api/notifications?page=0&size=20（core-web 缺省 size=20）', async () => {
    portRequest.mockResolvedValue([]);
    await listNotifications();
    expect(portRequest).toHaveBeenCalledWith('/api/notifications?page=0&size=20', undefined);
  });

  it('unreadNotificationCount → GET /api/notifications/unread-count', async () => {
    portRequest.mockResolvedValue({ unread: 3 });
    await expect(unreadNotificationCount()).resolves.toBe(3);
    expect(portRequest).toHaveBeenCalledWith('/api/notifications/unread-count', undefined);
  });

  it('markAllNotificationsRead → POST /api/notifications/read-all', async () => {
    portRequest.mockResolvedValue({ updated: 2 });
    await expect(markAllNotificationsRead()).resolves.toBe(2);
    expect(portRequest).toHaveBeenCalledWith('/api/notifications/read-all', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({}),
    });
  });
});

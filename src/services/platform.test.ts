/**
 * 平台管理 service 单测（user/role/tenant/audit）.
 *
 * 2026-10 上收 core-web 后改测 ApiPort 传输：实现走 requestApi → 注入的 ApiPort，
 * 注入 portRequest spy，验证 URL path / query / body 透传（全路径带 /api 前缀）。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { configureCore } from '@lieshoucloud/core-web';

const { portRequest } = vi.hoisted(() => ({
  portRequest: vi.fn(),
}));

import { changeMyPassword, createUser, deleteUser, listUsers, updateUser } from './user';
import { createRole, deleteRole, listRoles, updateRole } from './role';
import { createTenant, deleteTenant, listTenants, updateTenant } from './tenant';
import { countAuditLogs, listAuditLogs } from './audit';

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

describe('user service（core-web 上收 · ApiPort 传输）', () => {
  it('listUsers → GET /api/users', async () => {
    portRequest.mockResolvedValue([]);
    await listUsers();
    expect(portRequest).toHaveBeenCalledWith('/api/users', undefined);
  });

  it('createUser → POST /api/users + body', async () => {
    portRequest.mockResolvedValue({ id: 1 });
    await createUser({ username: 'u1', displayName: '用户一', password: 'pw123456' });
    expect(portRequest).toHaveBeenCalledWith('/api/users', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ username: 'u1', displayName: '用户一', password: 'pw123456' }),
    });
  });

  it('updateUser → PUT /api/users/{id}', async () => {
    portRequest.mockResolvedValue({ id: 1 });
    await updateUser(1, { displayName: '改名', status: 'ACTIVE', roles: ['USER'] });
    expect(portRequest).toHaveBeenCalledWith('/api/users/1', {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify({ displayName: '改名', status: 'ACTIVE', roles: ['USER'] }),
    });
  });

  it('deleteUser → DELETE /api/users/{id}', async () => {
    portRequest.mockResolvedValue(undefined);
    await deleteUser(9);
    expect(portRequest).toHaveBeenCalledWith('/api/users/9', { method: 'DELETE' });
  });

  it('changeMyPassword → PUT /api/users/me/password + body', async () => {
    portRequest.mockResolvedValue(undefined);
    await changeMyPassword('old123', 'newpass123');
    expect(portRequest).toHaveBeenCalledWith('/api/users/me/password', {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify({ oldPassword: 'old123', newPassword: 'newpass123' }),
    });
  });
});

describe('role service（core-web 上收 · ApiPort 传输）', () => {
  it('listRoles → GET /api/roles', async () => {
    portRequest.mockResolvedValue([]);
    await listRoles();
    expect(portRequest).toHaveBeenCalledWith('/api/roles', undefined);
  });

  it('createRole → POST /api/roles', async () => {
    portRequest.mockResolvedValue({ id: 1 });
    await createRole({ code: 'BUSINESS', name: '业务专员', scope: 'TENANT' });
    expect(portRequest).toHaveBeenCalledWith('/api/roles', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ code: 'BUSINESS', name: '业务专员', scope: 'TENANT' }),
    });
  });

  it('updateRole → PUT /api/roles/{id}', async () => {
    portRequest.mockResolvedValue({ id: 1 });
    await updateRole(1, { name: '高级专员' });
    expect(portRequest).toHaveBeenCalledWith('/api/roles/1', {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify({ name: '高级专员' }),
    });
  });

  it('deleteRole → DELETE /api/roles/{id}', async () => {
    portRequest.mockResolvedValue(undefined);
    await deleteRole(3);
    expect(portRequest).toHaveBeenCalledWith('/api/roles/3', { method: 'DELETE' });
  });
});

describe('tenant service（core-web 上收 · ApiPort 传输）', () => {
  it('listTenants → GET /api/tenants', async () => {
    portRequest.mockResolvedValue([]);
    await listTenants();
    expect(portRequest).toHaveBeenCalledWith('/api/tenants', undefined);
  });

  it('createTenant → POST /api/tenants', async () => {
    portRequest.mockResolvedValue({ id: 1 });
    await createTenant({ name: '测试租户', code: 'test01' });
    expect(portRequest).toHaveBeenCalledWith('/api/tenants', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ name: '测试租户', code: 'test01' }),
    });
  });

  it('updateTenant → PUT /api/tenants/{id}', async () => {
    portRequest.mockResolvedValue({ id: 1 });
    await updateTenant(1, { status: 'DISABLED' });
    expect(portRequest).toHaveBeenCalledWith('/api/tenants/1', {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify({ status: 'DISABLED' }),
    });
  });

  it('deleteTenant → DELETE /api/tenants/{id}', async () => {
    portRequest.mockResolvedValue(undefined);
    await deleteTenant(2);
    expect(portRequest).toHaveBeenCalledWith('/api/tenants/2', { method: 'DELETE' });
  });
});

describe('audit service（core-web 上收 · ApiPort 传输）', () => {
  it('listAuditLogs 无参数 → GET /api/audit-logs', async () => {
    portRequest.mockResolvedValue([]);
    await listAuditLogs();
    expect(portRequest).toHaveBeenCalledWith('/api/audit-logs', undefined);
  });

  it('listAuditLogs 带 action/limit → query', async () => {
    portRequest.mockResolvedValue([]);
    await listAuditLogs({ action: 'DELETE', limit: 50 });
    expect(portRequest).toHaveBeenCalledWith(
      '/api/audit-logs?action=DELETE&limit=50',
      undefined,
    );
  });

  it('countAuditLogs → GET /api/audit-logs/count', async () => {
    portRequest.mockResolvedValue(3);
    await countAuditLogs();
    expect(portRequest).toHaveBeenCalledWith('/api/audit-logs/count', undefined);
  });
});

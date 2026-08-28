/**
 * Desktop 平台管理 service 单测（user/role/tenant/audit）.
 * contract-api request 被 mock,验证 method/path/body 拼接。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }));

vi.mock("@lieshoucloud/contract-api", () => ({ request: mockRequest }));

import { changeMyPassword, createUser, deleteUser, listUsers, updateUser } from "./user";
import { createRole, deleteRole, listRoles, updateRole } from "./role";
import { createTenant, deleteTenant, listTenants, updateTenant } from "./tenant";
import { countAuditLogs, listAuditLogs } from "./audit";

beforeEach(() => {
  mockRequest.mockReset();
});

describe("desktop user service", () => {
  it("listUsers → GET /users", async () => {
    mockRequest.mockResolvedValue([]);
    await listUsers();
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/api/users" });
  });

  it("createUser → POST /users + body", async () => {
    mockRequest.mockResolvedValue({ id: 1 });
    await createUser({ username: "u1", displayName: "用户一", password: "pw123456" });
    expect(mockRequest).toHaveBeenCalledWith({
      method: "POST",
      path: "/api/users",
      body: { username: "u1", displayName: "用户一", password: "pw123456" },
    });
  });

  it("updateUser → PUT /users/{id}", async () => {
    mockRequest.mockResolvedValue({ id: 1 });
    await updateUser(1, { displayName: "改名", status: "ACTIVE", roles: ["USER"] });
    expect(mockRequest).toHaveBeenCalledWith({
      method: "PUT",
      path: "/api/users/1",
      body: { displayName: "改名", status: "ACTIVE", roles: ["USER"] },
    });
  });

  it("deleteUser → DELETE /users/{id}", async () => {
    mockRequest.mockResolvedValue(undefined);
    await deleteUser(9);
    expect(mockRequest).toHaveBeenCalledWith({ method: "DELETE", path: "/api/users/9" });
  });

  it("changeMyPassword → PUT /users/me/password + body", async () => {
    mockRequest.mockResolvedValue(undefined);
    await changeMyPassword("old123", "newpass123");
    expect(mockRequest).toHaveBeenCalledWith({
      method: "PUT",
      path: "/api/users/me/password",
      body: { oldPassword: "old123", newPassword: "newpass123" },
    });
  });
});

describe("desktop role service", () => {
  it("listRoles → GET /roles", async () => {
    mockRequest.mockResolvedValue([]);
    await listRoles();
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/api/roles" });
  });

  it("createRole → POST /roles", async () => {
    mockRequest.mockResolvedValue({ id: 1 });
    await createRole({ code: "BUSINESS", name: "业务专员", scope: "TENANT" });
    expect(mockRequest).toHaveBeenCalledWith({
      method: "POST",
      path: "/api/roles",
      body: { code: "BUSINESS", name: "业务专员", scope: "TENANT" },
    });
  });

  it("updateRole → PUT /roles/{id}", async () => {
    mockRequest.mockResolvedValue({ id: 1 });
    await updateRole(1, { name: "高级专员" });
    expect(mockRequest).toHaveBeenCalledWith({
      method: "PUT",
      path: "/api/roles/1",
      body: { name: "高级专员" },
    });
  });

  it("deleteRole → DELETE /roles/{id}", async () => {
    mockRequest.mockResolvedValue(undefined);
    await deleteRole(3);
    expect(mockRequest).toHaveBeenCalledWith({ method: "DELETE", path: "/api/roles/3" });
  });
});

describe("desktop tenant service", () => {
  it("listTenants → GET /tenants", async () => {
    mockRequest.mockResolvedValue([]);
    await listTenants();
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/api/tenants" });
  });

  it("createTenant → POST /tenants", async () => {
    mockRequest.mockResolvedValue({ id: 1 });
    await createTenant({ name: "测试租户", code: "test01" });
    expect(mockRequest).toHaveBeenCalledWith({
      method: "POST",
      path: "/api/tenants",
      body: { name: "测试租户", code: "test01" },
    });
  });

  it("updateTenant → PUT /tenants/{id}", async () => {
    mockRequest.mockResolvedValue({ id: 1 });
    await updateTenant(1, { status: "DISABLED" });
    expect(mockRequest).toHaveBeenCalledWith({
      method: "PUT",
      path: "/api/tenants/1",
      body: { status: "DISABLED" },
    });
  });
  it("deleteTenant → DELETE /tenants/{id}", async () => {
    mockRequest.mockResolvedValue(undefined);
    await deleteTenant(2);
    expect(mockRequest).toHaveBeenCalledWith({ method: "DELETE", path: "/api/tenants/2" });
  });
});

describe("desktop audit service", () => {
  it("listAuditLogs 无参数 → GET /audit-logs", async () => {
    mockRequest.mockResolvedValue([]);
    await listAuditLogs();
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/api/audit-logs" });
  });

  it("listAuditLogs 带 action/limit → query", async () => {
    mockRequest.mockResolvedValue([]);
    await listAuditLogs({ action: "DELETE", limit: 50 });
    expect(mockRequest).toHaveBeenCalledWith({
      method: "GET",
      path: "/api/audit-logs?action=DELETE&limit=50",
    });
  });

  it("countAuditLogs → GET /audit-logs/count", async () => {
    mockRequest.mockResolvedValue(3);
    await countAuditLogs();
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/api/audit-logs/count" });
  });
});

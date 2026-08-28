/**
 * Desktop role service（平台管理 · 角色 RBAC · ADR-0024）.
 */
import { request } from "@lieshoucloud/contract-api";
import type { CreateRoleRequest, Role, UpdateRoleRequest } from "@lieshoucloud/contract-types/business/role";

/** GET /roles — 角色列表 */
export async function listRoles(): Promise<Role[]> {
  return request<Role[]>({ method: "GET", path: "/api/roles" });
}

/** POST /roles — 创建自定义角色 */
export async function createRole(body: CreateRoleRequest): Promise<Role> {
  return request<Role>({ method: "POST", path: "/api/roles", body });
}

/** PUT /roles/{id} — 更新（系统角色只读） */
export async function updateRole(id: number, body: UpdateRoleRequest): Promise<Role> {
  return request<Role>({ method: "PUT", path: `/api/roles/${id}`, body });
}

/** DELETE /roles/{id} — 删除（系统角色不可删） */
export async function deleteRole(id: number): Promise<void> {
  return request<void>({ method: "DELETE", path: `/api/roles/${id}` });
}

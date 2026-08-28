/**
 * Desktop tenant service（平台管理 · 租户 CRUD）.
 */
import { request } from "@lieshoucloud/contract-api";
import type {
  CreateTenantRequest,
  Tenant,
  UpdateTenantRequest,
} from "@lieshoucloud/contract-types/business/tenant";

/** GET /tenants — 租户列表 */
export async function listTenants(): Promise<Tenant[]> {
  return request<Tenant[]>({ method: "GET", path: "/api/tenants" });
}

/** POST /tenants — 开通租户 */
export async function createTenant(body: CreateTenantRequest): Promise<Tenant> {
  return request<Tenant>({ method: "POST", path: "/api/tenants", body });
}

/** PUT /tenants/{id} — 更新租户 */
export async function updateTenant(id: number, body: UpdateTenantRequest): Promise<Tenant> {
  return request<Tenant>({ method: "PUT", path: `/api/tenants/${id}`, body });
}

/** DELETE /tenants/{id} — 删除租户 */
export async function deleteTenant(id: number): Promise<void> {
  return request<void>({ method: "DELETE", path: `/api/tenants/${id}` });
}

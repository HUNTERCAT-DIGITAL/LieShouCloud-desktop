/**
 * Desktop lead service（业务模块 · 线索）.
 */
import { request } from "@lieshoucloud/contract-api";
import type { Lead, LeadRequest, LeadStatus } from "@lieshoucloud/contract-types/business/lead";

/** GET /leads — 线索列表（支持关键字/状态/认领人筛选） */
export async function listLeads(keyword?: string, status?: LeadStatus): Promise<Lead[]> {
  const params: string[] = [];
  if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);
  if (status) params.push(`status=${status}`);
  const qs = params.length > 0 ? `?${params.join("&")}` : "";
  return request<Lead[]>({ method: "GET", path: `/api/leads${qs}` });
}

/** POST /leads — 新建线索 */
export async function createLead(body: LeadRequest): Promise<Lead> {
  return request<Lead>({ method: "POST", path: "/api/leads", body });
}

/** PUT /leads/{id} — 更新线索 */
export async function updateLead(id: number, body: LeadRequest): Promise<Lead> {
  return request<Lead>({ method: "PUT", path: `/api/leads/${id}`, body });
}

/** DELETE /leads/{id} — 删除线索 */
export async function deleteLead(id: number): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>({ method: "DELETE", path: `/api/leads/${id}` });
}

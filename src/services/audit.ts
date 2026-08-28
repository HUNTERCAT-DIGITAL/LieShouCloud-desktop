/**
 * Desktop audit service（平台管理 · 审计日志只读 · ADR-0030）.
 */
import { request } from "@lieshoucloud/contract-api";
import type { AuditAction, AuditLog } from "@lieshoucloud/contract-types/business/audit";

export interface AuditQuery {
  action?: AuditAction;
  resourceType?: string;
  limit?: number;
}

/** GET /audit-logs — 审计列表（新→旧） */
export async function listAuditLogs(query: AuditQuery = {}): Promise<AuditLog[]> {
  const params = new URLSearchParams();
  if (query.action) params.set("action", query.action);
  if (query.resourceType) params.set("resourceType", query.resourceType);
  if (query.limit) params.set("limit", String(query.limit));
  const qs = params.toString();
  return request<AuditLog[]>({ method: "GET", path: `/audit-logs${qs ? `?${qs}` : ""}` });
}

/** GET /audit-logs/count */
export async function countAuditLogs(): Promise<number> {
  return request<number>({ method: "GET", path: "/audit-logs/count" });
}

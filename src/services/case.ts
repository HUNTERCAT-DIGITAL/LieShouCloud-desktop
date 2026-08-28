/**
 * Desktop legal case service（智法云枢 · 案件管理 · 2026-09）.
 *
 * 走共享 request()（baseUrl 已在 main.tsx setBaseUrl 注入），
 * path 带完整 /api/legal/** 前缀（coreRequest 原样拼接 baseUrl + path）。
 */
import { request } from "@lieshoucloud/contract-api";
import type { CaseEvent, LegalCase } from "@lieshoucloud/contract-types/business/legal";

/** 案件分页响应（后端 /api/legal/cases 返回 { items, total, page, size }） */
export interface CasePage {
  items: LegalCase[];
  total: number;
  page: number;
  size: number;
}

export interface CaseQuery {
  keyword?: string;
  stage?: string;
  status?: string;
  priority?: string;
  page?: number;
  size?: number;
}

/** 案件列表（分页 + 筛选） */
export async function listCases(q: CaseQuery = {}): Promise<CasePage> {
  return request<CasePage>({
    method: "GET",
    path: "/api/legal/cases",
    query: {
      keyword: q.keyword,
      stage: q.stage,
      status: q.status,
      priority: q.priority,
      page: q.page ?? 0,
      size: q.size ?? 20,
    },
  });
}

/** 案件详情 */
export async function getCase(id: number): Promise<LegalCase> {
  return request<LegalCase>({ method: "GET", path: `/api/legal/cases/${id}` });
}

/** 案件时间线事件 */
export async function listCaseEvents(caseId: number): Promise<CaseEvent[]> {
  return request<CaseEvent[]>({ method: "GET", path: `/api/legal/cases/${caseId}/events` });
}

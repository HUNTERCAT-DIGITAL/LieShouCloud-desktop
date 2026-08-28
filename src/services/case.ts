/**
 * Desktop legal case service（智法云枢 · 案件管理）.
 *
 * 走共享 request()（baseUrl 已在 main.tsx setBaseUrl 注入,含 /api）,
 * path 只写业务路径(/legal/**),避免 baseUrl(/api) 叠加造成 /api/api 双写。
 */
import { request } from "@lieshoucloud/contract-api";
import type {
  CaseEvent,
  CaseEventRequest,
  CreateCaseRequest,
  LegalCase,
  UpdateCaseRequest,
} from "@lieshoucloud/contract-types/business/legal";

/** 案件分页响应（后端返回 { items, total, page, size }） */
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
    path: "/legal/cases",
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
  return request<LegalCase>({ method: "GET", path: `/legal/cases/${id}` });
}

/** 新建案件 */
export async function createCase(body: CreateCaseRequest): Promise<LegalCase> {
  return request<LegalCase>({ method: "POST", path: "/legal/cases", body });
}

/** 编辑案件（status/stage 仅允许前进） */
export async function updateCase(id: number, body: UpdateCaseRequest): Promise<LegalCase> {
  return request<LegalCase>({ method: "PUT", path: `/legal/cases/${id}`, body });
}

/** 删除案件 */
export async function deleteCase(id: number): Promise<void> {
  return request<void>({ method: "DELETE", path: `/legal/cases/${id}` });
}

/** 案件时间线事件 */
export async function listCaseEvents(caseId: number): Promise<CaseEvent[]> {
  return request<CaseEvent[]>({ method: "GET", path: `/legal/cases/${caseId}/events` });
}

/** 新增时间线事件 */
export async function addCaseEvent(caseId: number, body: CaseEventRequest): Promise<CaseEvent> {
  return request<CaseEvent>({ method: "POST", path: `/legal/cases/${caseId}/events`, body });
}

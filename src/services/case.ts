/**
 * Desktop legal case service（智法云枢 · 案件管理）.
 *
 * 走共享 request()（baseUrl 已在 main.tsx setBaseUrl 注入,含 /api）,
 * path 只写业务路径(/legal/**),避免 baseUrl(/api) 叠加造成 /api/api 双写。
 */
import { request } from "@lieshoucloud/contract-api";
import {
  CASE_STAGE_FLOW,
  stageIndex,
  type CaseStage,
  type CaseEvent,
  type CaseEventRequest,
  type CreateCaseRequest,
  type Expense,
  type ExpenseRequest,
  type ExpenseSummary,
  type LegalCase,
  type LegalDocument,
  type LegalPage,
  type TimeEntry,
  type TimeEntryRequest,
  type TimeEntrySummary,
  type UpdateCaseRequest,
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

/**
 * 八阶段只前进 · 计算推进后的 stage/stageProgress（纯函数，可单测）。
 * 规则：
 *  - progress < 100 → 标记当前阶段完成（stageProgress = 100）
 *  - progress = 100 且非最后阶段 → 进入下一阶段（stage 前进，进度归 0）
 *  - 已是最后阶段且 100 → 返回 null（不可再推进）
 */
export function advanceStage(
  stage: CaseStage,
  progress: number,
): { stage: CaseStage; stageProgress: number } | null {
  const idx = stageIndex(stage);
  if (idx < 0) return null;
  if (progress < 100) return { stage, stageProgress: 100 };
  const next = CASE_STAGE_FLOW[idx + 1];
  if (!next) return null;
  return { stage: next.key, stageProgress: 0 };
}

/** 案件时间线事件 */
export async function listCaseEvents(caseId: number): Promise<CaseEvent[]> {
  return request<CaseEvent[]>({ method: "GET", path: `/legal/cases/${caseId}/events` });
}

/** 新增时间线事件 */
export async function addCaseEvent(caseId: number, body: CaseEventRequest): Promise<CaseEvent> {
  return request<CaseEvent>({ method: "POST", path: `/legal/cases/${caseId}/events`, body });
}

// ============================================================
// 律所特色:计时 / 费用 / 文书
// ============================================================

/** 案件计时列表 */
export async function listTimeEntries(caseId: number): Promise<LegalPage<TimeEntry>> {
  return request<LegalPage<TimeEntry>>({ method: "GET", path: `/legal/cases/${caseId}/time-entries` });
}

/** 案件计时汇总(小时/金额/待确认) */
export async function getTimeSummary(caseId: number): Promise<TimeEntrySummary> {
  return request<TimeEntrySummary>({ method: "GET", path: `/legal/cases/${caseId}/time-entries/summary` });
}

/** 登记计时 */
export async function createTimeEntry(caseId: number, body: TimeEntryRequest): Promise<TimeEntry> {
  return request<TimeEntry>({ method: "POST", path: `/legal/cases/${caseId}/time-entries`, body });
}

/** 确认计时(PENDING → CONFIRMED,幂等;记录确认人/时间) */
export async function confirmTimeEntry(id: number): Promise<TimeEntry> {
  return request<TimeEntry>({ method: "PUT", path: `/legal/time-entries/${id}/confirm` });
}

/** 编辑计时(工时/费率/律师/日期,金额服务端重算) */
export async function updateTimeEntry(id: number, body: TimeEntryRequest): Promise<TimeEntry> {
  return request<TimeEntry>({ method: "PUT", path: `/legal/time-entries/${id}`, body });
}

/** 删除计时(软删) */
export async function deleteTimeEntry(id: number): Promise<void> {
  return request<void>({ method: "DELETE", path: `/legal/time-entries/${id}` });
}

/** 案件费用列表 */
export async function listExpenses(caseId: number): Promise<LegalPage<Expense>> {
  return request<LegalPage<Expense>>({ method: "GET", path: `/legal/cases/${caseId}/expenses` });
}

/** 案件费用汇总 */
export async function getExpenseSummary(caseId: number): Promise<ExpenseSummary> {
  return request<ExpenseSummary>({ method: "GET", path: `/legal/cases/${caseId}/expenses/summary` });
}

/** 登记费用 */
export async function createExpense(caseId: number, body: ExpenseRequest): Promise<Expense> {
  return request<Expense>({ method: "POST", path: `/legal/cases/${caseId}/expenses`, body });
}

/** 编辑费用(类型/说明/金额/日期) */
export async function updateExpense(id: number, body: ExpenseRequest): Promise<Expense> {
  return request<Expense>({ method: "PUT", path: `/legal/expenses/${id}`, body });
}

/** 删除费用(软删) */
export async function deleteExpense(id: number): Promise<void> {
  return request<void>({ method: "DELETE", path: `/legal/expenses/${id}` });
}

/** 案件卷宗文书列表 */
export async function listDocuments(caseId: number): Promise<LegalPage<LegalDocument>> {
  return request<LegalPage<LegalDocument>>({ method: "GET", path: `/legal/cases/${caseId}/documents` });
}

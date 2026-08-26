/**
 * Desktop legal service（ADR-0036/0045 · 案件管理 + 办案时间线）.
 *
 * 类型与 admin 的 types/legal.ts 对齐；分页结构 {items,total,page,size} 与后端统一。
 * 走 @lieshoucloud/api-client request()（自动带 JWT；RN/桌面端 baseUrl 由应用启动时设置）。
 */
import { request } from "@lieshoucloud/api-client";

export type CaseType = "CIVIL" | "CRIMINAL" | "ADMIN" | "COMMERCIAL" | "IP" | "OTHER";
export type CaseStatus = "INTAKE" | "FILED" | "IN_TRIAL" | "CLOSED" | "ARCHIVED";
export type EventType =
  | "INTAKE"
  | "FILING"
  | "HEARING"
  | "EVIDENCE"
  | "MEDIATION"
  | "JUDGMENT"
  | "ARCHIVE"
  | "OTHER";

export interface LegalCase {
  id: number;
  tenantId: number;
  caseNo: string;
  title: string;
  caseType: CaseType;
  party?: string | null;
  oppositeParty?: string | null;
  court?: string | null;
  status: CaseStatus;
  responsibleLawyer?: string | null;
  coLawyer?: string | null;
  amount?: number | null;
  filedAt?: string | null;
  closedAt?: string | null;
  remark?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CaseEvent {
  id: number;
  tenantId: number;
  caseId: number;
  eventType: EventType;
  occurredAt: string;
  title: string;
  detail?: string | null;
}

export interface LegalPage<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

/** GET /api/legal/cases — 案件分页列表 */
export async function listCases(params?: {
  keyword?: string;
  status?: CaseStatus;
  caseType?: CaseType;
  lawyer?: string;
}, page = 1, size = 20): Promise<LegalPage<LegalCase>> {
  return request<LegalPage<LegalCase>>({
    method: "GET",
    path: `/legal/cases`,
    query: {
      ...(params?.keyword ? { keyword: params.keyword } : {}),
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.caseType ? { caseType: params.caseType } : {}),
      ...(params?.lawyer ? { lawyer: params.lawyer } : {}),
      page,
      size,
    },
  });
}

/** GET /api/legal/cases/{id} — 案件详情 */
export async function getCase(id: number): Promise<LegalCase> {
  return request<LegalCase>({ method: "GET", path: `/legal/cases/${id}` });
}

/** GET /api/legal/cases/{id}/events — 办案时间线（升序） */
export async function listCaseEvents(caseId: number): Promise<CaseEvent[]> {
  return request<CaseEvent[]>({ method: "GET", path: `/legal/cases/${caseId}/events` });
}

export const CASE_STATUS_META: Record<CaseStatus, { text: string; color: string }> = {
  INTAKE: { text: "待立案", color: "default" },
  FILED: { text: "已立案", color: "processing" },
  IN_TRIAL: { text: "审理中", color: "warning" },
  CLOSED: { text: "已结案", color: "success" },
  ARCHIVED: { text: "已归档", color: "default" },
};

export const CASE_TYPE_META: Record<CaseType, string> = {
  CIVIL: "民事",
  CRIMINAL: "刑事",
  ADMIN: "行政",
  COMMERCIAL: "商事仲裁",
  IP: "知识产权",
  OTHER: "其他",
};

export const EVENT_TYPE_META: Record<EventType, { text: string; color: string }> = {
  INTAKE: { text: "委托收案", color: "blue" },
  FILING: { text: "立案", color: "cyan" },
  HEARING: { text: "开庭", color: "gold" },
  EVIDENCE: { text: "举证", color: "geekblue" },
  MEDIATION: { text: "调解", color: "purple" },
  JUDGMENT: { text: "判决", color: "green" },
  ARCHIVE: { text: "归档", color: "default" },
  OTHER: { text: "其他", color: "default" },
};

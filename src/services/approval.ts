/**
 * Desktop approval service（ADR-0032 · 审批流，多端接入）.
 * 注意：api-client 的 request() 自动拼 /api 前缀，path 只写业务路径。
 */
import { request } from "@lieshoucloud/api-client";

export type ApprovalType = "EXPENSE" | "PURCHASE" | "SALE" | "OTHER";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface ApprovalRequest {
  id: number;
  type: ApprovalType;
  title: string;
  amount?: number | null;
  detail?: string | null;
  requesterId: number;
  approverId: number;
  status: ApprovalStatus;
  comment?: string | null;
  decidedBy?: number | null;
  decidedAt?: string | null;
  createdAt: string;
}

export interface ApprovalCounts {
  inbox: number;
  mine: number;
}

/** 租户内列表（role: mine=我发起的 / inbox=待我审批 / all=全部） */
export async function listApprovals(params?: {
  role?: "mine" | "inbox" | "all";
  status?: ApprovalStatus;
  type?: ApprovalType;
}): Promise<ApprovalRequest[]> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.role) query.role = params.role;
  if (params?.status) query.status = params.status;
  if (params?.type) query.type = params.type;
  return request<ApprovalRequest[]>({ method: "GET", path: "/approvals", query });
}

/** 待办计数（inbox=待我审批 / mine=我发起待处理） */
export async function getApprovalCounts(): Promise<ApprovalCounts> {
  return request<ApprovalCounts>({ method: "GET", path: "/approvals/counts" });
}

/** 发起审批 */
export async function createApproval(body: {
  type: ApprovalType;
  title: string;
  amount?: number;
  detail?: string;
  approverId: number;
}): Promise<ApprovalRequest> {
  return request<ApprovalRequest>({ method: "POST", path: "/approvals", body });
}

/** 通过（仅审批人） */
export async function approveApproval(id: number, comment?: string): Promise<ApprovalRequest> {
  return request<ApprovalRequest>({
    method: "POST",
    path: `/approvals/${id}/approve`,
    body: comment ? { comment } : {},
  });
}

/** 驳回（仅审批人，comment 必填） */
export async function rejectApproval(id: number, comment: string): Promise<ApprovalRequest> {
  return request<ApprovalRequest>({ method: "POST", path: `/approvals/${id}/reject`, body: { comment } });
}

/** 撤销（仅发起人） */
export async function cancelApproval(id: number): Promise<ApprovalRequest> {
  return request<ApprovalRequest>({ method: "POST", path: `/approvals/${id}/cancel`, body: {} });
}

/** 类型 → 中文/颜色 */
export const APPROVAL_TYPE_META: Record<ApprovalType, { text: string; color: string }> = {
  EXPENSE: { text: "支出报销", color: "volcano" },
  PURCHASE: { text: "采购", color: "blue" },
  SALE: { text: "销售出库", color: "green" },
  OTHER: { text: "其他", color: "default" },
};

/** 状态 → 中文/颜色 */
export const APPROVAL_STATUS_META: Record<ApprovalStatus, { text: string; color: string }> = {
  PENDING: { text: "待审批", color: "processing" },
  APPROVED: { text: "已通过", color: "success" },
  REJECTED: { text: "已驳回", color: "error" },
  CANCELLED: { text: "已撤销", color: "default" },
};

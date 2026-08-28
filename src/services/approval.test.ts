/**
 * Desktop approval service 单测（ADR-0032 · 多端接入）.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }));

vi.mock("@lieshoucloud/contract-api", () => ({ request: mockRequest }));

import {
  APPROVAL_STATUS_META,
  APPROVAL_TYPE_META,
  approveApproval,
  cancelApproval,
  createApproval,
  getApprovalCounts,
  listApprovals,
  rejectApproval,
} from "./approval";

beforeEach(() => {
  mockRequest.mockReset();
});

describe("desktop approval service", () => {
  it("listApprovals 无参数 → GET /approvals", async () => {
    mockRequest.mockResolvedValue([]);
    await listApprovals();
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/api/approvals", query: {} });
  });

  it("listApprovals 带 role/status/type → query", async () => {
    mockRequest.mockResolvedValue([]);
    await listApprovals({ role: "inbox", status: "PENDING", type: "EXPENSE" });
    expect(mockRequest).toHaveBeenCalledWith({
      method: "GET",
      path: "/api/approvals",
      query: { role: "inbox", status: "PENDING", type: "EXPENSE" },
    });
  });

  it("getApprovalCounts → GET /approvals/counts", async () => {
    mockRequest.mockResolvedValue({ inbox: 3, mine: 1 });
    await expect(getApprovalCounts()).resolves.toEqual({ inbox: 3, mine: 1 });
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/api/approvals/counts" });
  });

  it("createApproval body 透传", async () => {
    mockRequest.mockResolvedValue({ id: 1 });
    await createApproval({ type: "PURCHASE", title: "采购原料", approverId: 10 });
    expect(mockRequest).toHaveBeenCalledWith({
      method: "POST",
      path: "/api/approvals",
      body: { type: "PURCHASE", title: "采购原料", approverId: 10 },
    });
  });

  it("approveApproval 无意见 → 空 body", async () => {
    mockRequest.mockResolvedValue({ id: 1, status: "APPROVED" });
    await approveApproval(1);
    expect(mockRequest).toHaveBeenCalledWith({
      method: "POST",
      path: "/api/approvals/1/approve",
      body: {},
    });
  });

  it("approveApproval 带意见", async () => {
    mockRequest.mockResolvedValue({ id: 1 });
    await approveApproval(1, "同意");
    expect(mockRequest).toHaveBeenCalledWith({
      method: "POST",
      path: "/api/approvals/1/approve",
      body: { comment: "同意" },
    });
  });

  it("rejectApproval → POST /approvals/{id}/reject（comment 必填）", async () => {
    mockRequest.mockResolvedValue({ id: 1 });
    await rejectApproval(1, "金额超预算");
    expect(mockRequest).toHaveBeenCalledWith({
      method: "POST",
      path: "/api/approvals/1/reject",
      body: { comment: "金额超预算" },
    });
  });

  it("cancelApproval → POST /approvals/{id}/cancel", async () => {
    mockRequest.mockResolvedValue({ id: 1 });
    await cancelApproval(1);
    expect(mockRequest).toHaveBeenCalledWith({
      method: "POST",
      path: "/api/approvals/1/cancel",
      body: {},
    });
  });

  it("类型/状态元数据", () => {
    expect(APPROVAL_TYPE_META.EXPENSE.text).toBe("支出报销");
    expect(APPROVAL_STATUS_META.PENDING.text).toBe("待审批");
  });
});

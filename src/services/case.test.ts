/**
 * Desktop legal case service 单测.
 * 关键:path 不带 /api 前缀(baseUrl 已含 /api),防止 /api/api 双写。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }));

vi.mock("@lieshoucloud/contract-api", () => ({ request: mockRequest }));

import type { CaseStage } from "@lieshoucloud/contract-types/business/legal";
import {
  addCaseEvent,
  advanceStage,
  confirmTimeEntry,
  createCase,
  createDocument,
  deleteCase,
  deleteDocument,
  deleteExpense,
  deleteTimeEntry,
  getCase,
  listCases,
  listCaseEvents,
  updateCase,
  updateDocument,
  updateExpense,
  updateTimeEntry,
} from "./case";

beforeEach(() => {
  mockRequest.mockReset();
});

describe("desktop case service", () => {
  it("listCases → GET /legal/cases(不带 /api,避免双写)", async () => {
    mockRequest.mockResolvedValue({ items: [], total: 0, page: 0, size: 20 });
    await listCases();
    const call = mockRequest.mock.calls[0][0];
    expect(call.method).toBe("GET");
    expect(call.path).toBe("/legal/cases");
    expect(call.path.startsWith("/api/")).toBe(false);
  });

  it("listCases 带筛选 → query 透传", async () => {
    mockRequest.mockResolvedValue({ items: [], total: 0, page: 0, size: 20 });
    await listCases({ keyword: "合同", status: "FILED", priority: "HIGH", page: 2, size: 50 });
    expect(mockRequest).toHaveBeenCalledWith({
      method: "GET",
      path: "/legal/cases",
      query: {
        keyword: "合同",
        stage: undefined,
        status: "FILED",
        priority: "HIGH",
        page: 2,
        size: 50,
      },
    });
  });

  it("getCase → GET /legal/cases/{id}", async () => {
    mockRequest.mockResolvedValue({ id: 1 });
    await getCase(7);
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/legal/cases/7" });
  });

  it("createCase → POST /legal/cases", async () => {
    mockRequest.mockResolvedValue({ id: 1 });
    await createCase({ caseNo: "(2026)赣0102民初1号", title: "买卖合同纠纷" });
    expect(mockRequest).toHaveBeenCalledWith({
      method: "POST",
      path: "/legal/cases",
      body: { caseNo: "(2026)赣0102民初1号", title: "买卖合同纠纷" },
    });
  });

  it("updateCase → PUT /legal/cases/{id}", async () => {
    mockRequest.mockResolvedValue({ id: 1 });
    await updateCase(1, { caseNo: "A", title: "改名" });
    expect(mockRequest).toHaveBeenCalledWith({
      method: "PUT",
      path: "/legal/cases/1",
      body: { caseNo: "A", title: "改名" },
    });
  });

  it("deleteCase → DELETE /legal/cases/{id}", async () => {
    mockRequest.mockResolvedValue(undefined);
    await deleteCase(3);
    expect(mockRequest).toHaveBeenCalledWith({ method: "DELETE", path: "/legal/cases/3" });
  });

  it("listCaseEvents → GET /legal/cases/{id}/events", async () => {
    mockRequest.mockResolvedValue([]);
    await listCaseEvents(5);
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/legal/cases/5/events" });
  });

  it("addCaseEvent → POST /legal/cases/{id}/events", async () => {
    mockRequest.mockResolvedValue({ id: 1 });
    await addCaseEvent(5, { eventType: "HEARING", occurredAt: "2026-08-28T09:00:00Z", title: "第一次开庭" });
    expect(mockRequest).toHaveBeenCalledWith({
      method: "POST",
      path: "/legal/cases/5/events",
      body: { eventType: "HEARING", occurredAt: "2026-08-28T09:00:00Z", title: "第一次开庭" },
    });
  });

  describe("advanceStage(八阶段只前进)", () => {
    it("progress<100 → 标记当前阶段完成(100)", () => {
      expect(advanceStage("CLIENT_MEETING", 40)).toEqual({ stage: "CLIENT_MEETING", stageProgress: 100 });
    });

    it("progress=100 → 进入下一阶段,进度归 0", () => {
      expect(advanceStage("CLIENT_MEETING", 100)).toEqual({ stage: "CASE_BRIEF", stageProgress: 0 });
      expect(advanceStage("LEGAL_RESEARCH", 100)).toEqual({ stage: "STRATEGY_REPORT", stageProgress: 0 });
    });

    it("最后阶段且 100 → 返回 null(不可再推进)", () => {
      expect(advanceStage("FINAL_OUTCOME", 100)).toBeNull();
    });

    it("未知阶段 → null", () => {
      expect(advanceStage("UNKNOWN" as CaseStage, 100)).toBeNull();
    });
  });

  describe("计时确认流(后端 TimeEntryController)", () => {
    it("confirmTimeEntry → PUT /legal/time-entries/{id}/confirm", async () => {
      mockRequest.mockResolvedValue({ id: 7, status: "CONFIRMED" });
      await confirmTimeEntry(7);
      expect(mockRequest).toHaveBeenCalledWith({
        method: "PUT",
        path: "/legal/time-entries/7/confirm",
      });
    });

    it("updateTimeEntry → PUT /legal/time-entries/{id} + body", async () => {
      mockRequest.mockResolvedValue({ id: 7 });
      await updateTimeEntry(7, { lawyer: "王律师", workDate: "2026-08-01", hours: 3, rate: 800 });
      expect(mockRequest).toHaveBeenCalledWith({
        method: "PUT",
        path: "/legal/time-entries/7",
        body: { lawyer: "王律师", workDate: "2026-08-01", hours: 3, rate: 800 },
      });
    });

    it("deleteTimeEntry → DELETE /legal/time-entries/{id}", async () => {
      mockRequest.mockResolvedValue(undefined);
      await deleteTimeEntry(9);
      expect(mockRequest).toHaveBeenCalledWith({ method: "DELETE", path: "/legal/time-entries/9" });
    });
  });

  describe("费用编辑/删除(后端 ExpenseController)", () => {
    it("updateExpense → PUT /legal/expenses/{id} + body", async () => {
      mockRequest.mockResolvedValue({ id: 3 });
      await updateExpense(3, { expenseType: "COURT_FEE", description: "诉讼费", amount: 5000, expenseDate: "2026-08-02" });
      expect(mockRequest).toHaveBeenCalledWith({
        method: "PUT",
        path: "/legal/expenses/3",
        body: { expenseType: "COURT_FEE", description: "诉讼费", amount: 5000, expenseDate: "2026-08-02" },
      });
    });

    it("deleteExpense → DELETE /legal/expenses/{id}", async () => {
      mockRequest.mockResolvedValue(undefined);
      await deleteExpense(5);
      expect(mockRequest).toHaveBeenCalledWith({ method: "DELETE", path: "/legal/expenses/5" });
    });
  });

  describe("文书登记/编辑/删除(后端 LegalDocumentController)", () => {
    it("createDocument → POST /legal/cases/{id}/documents + body", async () => {
      mockRequest.mockResolvedValue({ id: 11 });
      await createDocument(1, { title: "民事起诉状", docType: "PLEADING", content: "诉状全文" });
      expect(mockRequest).toHaveBeenCalledWith({
        method: "POST",
        path: "/legal/cases/1/documents",
        body: { title: "民事起诉状", docType: "PLEADING", content: "诉状全文" },
      });
    });

    it("updateDocument → PUT /legal/documents/{id} + body", async () => {
      mockRequest.mockResolvedValue({ id: 11 });
      await updateDocument(11, { title: "民事起诉状(修订)" });
      expect(mockRequest).toHaveBeenCalledWith({
        method: "PUT",
        path: "/legal/documents/11",
        body: { title: "民事起诉状(修订)" },
      });
    });

    it("deleteDocument → DELETE /legal/documents/{id}", async () => {
      mockRequest.mockResolvedValue(undefined);
      await deleteDocument(8);
      expect(mockRequest).toHaveBeenCalledWith({ method: "DELETE", path: "/legal/documents/8" });
    });
  });
});

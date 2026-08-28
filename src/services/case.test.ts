/**
 * Desktop legal case service 单测.
 * 关键:path 不带 /api 前缀(baseUrl 已含 /api),防止 /api/api 双写。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }));

vi.mock("@lieshoucloud/contract-api", () => ({ request: mockRequest }));

import { addCaseEvent, createCase, deleteCase, getCase, listCases, listCaseEvents, updateCase } from "./case";

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
    await listCases({ keyword: "合同", status: "FILED", page: 2, size: 50 });
    expect(mockRequest).toHaveBeenCalledWith({
      method: "GET",
      path: "/legal/cases",
      query: {
        keyword: "合同",
        stage: undefined,
        status: "FILED",
        priority: undefined,
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
});

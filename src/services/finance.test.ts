/**
 * Desktop finance service 单测（P0 · 三端补测试）.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }));

vi.mock("@lieshoucloud/contract-api", () => ({ request: mockRequest }));

import { LEDGER_CATEGORIES, LEDGER_TYPE_META, createLedger, deleteLedger, getSummary, listLedger } from "./finance";

beforeEach(() => {
  mockRequest.mockReset();
});

describe("desktop finance service", () => {
  it("listLedger 无 type → GET /ledger", async () => {
    mockRequest.mockResolvedValue([]);
    await listLedger();
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/ledger" });
  });

  it("listLedger 带 type → query", async () => {
    mockRequest.mockResolvedValue([]);
    await listLedger("EXPENSE");
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/ledger?type=EXPENSE" });
  });

  it("getSummary → GET /ledger/summary", async () => {
    mockRequest.mockResolvedValue({ income: 100, expense: 40, balance: 60, count: 3 });
    const s = await getSummary();
    expect(s.balance).toBe(60);
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/ledger/summary" });
  });

  it("createLedger → POST /ledger + body 透传", async () => {
    mockRequest.mockResolvedValue({ id: 9 });
    const body = { type: "INCOME" as const, amount: 200, category: "销售收入", occurredAt: "2026-08-01" };
    await createLedger(body);
    expect(mockRequest).toHaveBeenCalledWith({ method: "POST", path: "/ledger", body });
  });

  it("deleteLedger → DELETE /ledger/{id}", async () => {
    mockRequest.mockResolvedValue(undefined);
    await deleteLedger(3);
    expect(mockRequest).toHaveBeenCalledWith({ method: "DELETE", path: "/ledger/3" });
  });

  it("类型元数据与分类列表", () => {
    expect(LEDGER_TYPE_META.INCOME.text).toBe("收入");
    expect(LEDGER_TYPE_META.EXPENSE.text).toBe("支出");
    expect(LEDGER_CATEGORIES).toContain("销售收入");
  });
});

/**
 * Desktop legal service 单测（ADR-0036/0045）.
 *
 * 验证 URL path / query 透传（api-client request 被 mock，只测 wrapper 拼接逻辑）。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }));

vi.mock("@lieshoucloud/api-client", () => ({ request: mockRequest }));

import { getCase, listCaseEvents, listCases } from "./legal";

beforeEach(() => {
  mockRequest.mockReset();
});

describe("desktop legal service", () => {
  it("listCases 无参数 → GET /legal/cases 默认分页 page=1 size=20", async () => {
    mockRequest.mockResolvedValue({ items: [], total: 0, page: 1, size: 20 });
    await listCases();
    expect(mockRequest).toHaveBeenCalledWith({
      method: "GET",
      path: "/legal/cases",
      query: { page: 1, size: 20 },
    });
  });

  it("listCases 带过滤 → query 只含非空项", async () => {
    mockRequest.mockResolvedValue({ items: [], total: 0, page: 1, size: 20 });
    await listCases({ keyword: "赵某", status: "IN_TRIAL" });
    expect(mockRequest).toHaveBeenCalledWith({
      method: "GET",
      path: "/legal/cases",
      query: { keyword: "赵某", status: "IN_TRIAL", page: 1, size: 20 },
    });
  });

  it("getCase / listCaseEvents → GET 对应 path", async () => {
    mockRequest.mockResolvedValue({ id: 1 });
    await getCase(1);
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/legal/cases/1" });

    mockRequest.mockResolvedValue([]);
    await listCaseEvents(1);
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/legal/cases/1/events" });
  });
});

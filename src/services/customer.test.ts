/**
 * Desktop customer service 单测（P0 · 三端补测试）.
 *
 * 验证 URL path / query string / body 透传（api-client request 被 mock，
 * 只测 wrapper 的拼接逻辑，与 admin services.test.ts 同一模式）。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }));

vi.mock("@lieshoucloud/contract-api", () => ({ request: mockRequest }));

import { STATUS_META, countCustomers, getCustomer, listCustomers } from "./customer";

beforeEach(() => {
  mockRequest.mockReset();
});

describe("desktop customer service", () => {
  it("listCustomers 无参数 → GET /customers（无 query）", async () => {
    mockRequest.mockResolvedValue([]);
    await listCustomers();
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/api/customers" });
  });

  it("listCustomers 带 keyword + status → query 编码", async () => {
    mockRequest.mockResolvedValue([]);
    await listCustomers("张三 诊所", "CONVERTED");
    expect(mockRequest).toHaveBeenCalledWith({
      method: "GET",
      path: "/api/customers?keyword=%E5%BC%A0%E4%B8%89%20%E8%AF%8A%E6%89%80&status=CONVERTED",
    });
  });

  it("listCustomers 只带 status → 只有 status query", async () => {
    mockRequest.mockResolvedValue([]);
    await listCustomers(undefined, "LOST");
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/api/customers?status=LOST" });
  });

  it("countCustomers → GET /customers/count", async () => {
    mockRequest.mockResolvedValue(5);
    await expect(countCustomers()).resolves.toBe(5);
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/api/customers/count" });
  });

  it("getCustomer 动态 id → GET /customers/{id}", async () => {
    mockRequest.mockResolvedValue({ id: 42 });
    await getCustomer(42);
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/api/customers/42" });
  });

  it("STATUS_META 四种状态齐全且有中文文案", () => {
    expect(Object.keys(STATUS_META)).toEqual(["NEW", "FOLLOWING", "CONVERTED", "LOST"]);
    expect(STATUS_META.NEW.text).toBe("新客户");
    expect(STATUS_META.CONVERTED.text).toBe("已转化");
  });
});

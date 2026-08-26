/**
 * Desktop inventory service 单测（P0 · 三端补测试）.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }));

vi.mock("@lieshoucloud/api-client", () => ({ request: mockRequest }));

import { MOVEMENT_META, createProduct, listMovements, listProducts, stockIn, stockOut } from "./inventory";

beforeEach(() => {
  mockRequest.mockReset();
});

describe("desktop inventory service", () => {
  it("listProducts 无 keyword → GET /products", async () => {
    mockRequest.mockResolvedValue([]);
    await listProducts();
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/products" });
  });

  it("listProducts 带 keyword → query 编码", async () => {
    mockRequest.mockResolvedValue([]);
    await listProducts("感冒灵");
    expect(mockRequest).toHaveBeenCalledWith({
      method: "GET",
      path: "/products?keyword=%E6%84%9F%E5%86%92%E7%81%B5",
    });
  });

  it("createProduct → POST /products + body 透传", async () => {
    mockRequest.mockResolvedValue({ id: 1 });
    const body = { name: "阿莫西林", unit: "盒", price: 18.5 };
    await createProduct(body);
    expect(mockRequest).toHaveBeenCalledWith({ method: "POST", path: "/products", body });
  });

  it("stockIn → POST /products/{id}/stock-in + body", async () => {
    mockRequest.mockResolvedValue({ id: 1, stockQuantity: 110 });
    await stockIn(1, 10, "补货");
    expect(mockRequest).toHaveBeenCalledWith({
      method: "POST",
      path: "/products/1/stock-in",
      body: { quantity: 10, remark: "补货" },
    });
  });

  it("stockOut → POST /products/{id}/stock-out + body", async () => {
    mockRequest.mockResolvedValue({ id: 1, stockQuantity: 90 });
    await stockOut(1, 5);
    expect(mockRequest).toHaveBeenCalledWith({
      method: "POST",
      path: "/products/1/stock-out",
      body: { quantity: 5, remark: undefined },
    });
  });

  it("listMovements → GET /products/{id}/movements", async () => {
    mockRequest.mockResolvedValue([]);
    await listMovements(7);
    expect(mockRequest).toHaveBeenCalledWith({ method: "GET", path: "/products/7/movements" });
  });

  it("MOVEMENT_META 出入库文案", () => {
    expect(MOVEMENT_META.IN.text).toBe("入库");
    expect(MOVEMENT_META.OUT.text).toBe("出库");
  });
});

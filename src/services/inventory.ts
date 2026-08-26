/**
 * Desktop inventory service（Phase 9 · 多端接入）.
 * 注意：api-client 的 request() 自动拼 /api 前缀，path 只写业务路径。
 */
import { request } from "@lieshoucloud/api-client";

export type StockMovementType = "IN" | "OUT";

export interface Product {
  id: number;
  tenantId: number;
  name: string;
  code?: string | null;
  unit?: string | null;
  price?: number | null;
  stockQuantity: number;
  remark?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface StockMovement {
  id: number;
  tenantId: number;
  productId: number;
  type: StockMovementType;
  quantity: number;
  remark?: string | null;
  createdAt: string;
}

export async function listProducts(keyword?: string): Promise<Product[]> {
  const qs = keyword ? `?keyword=${encodeURIComponent(keyword)}` : "";
  return request<Product[]>({ method: "GET", path: `/products${qs}` });
}

export async function createProduct(body: {
  name: string;
  code?: string;
  unit?: string;
  price?: number;
  remark?: string;
}): Promise<Product> {
  return request<Product>({ method: "POST", path: `/products`, body });
}

export async function stockIn(id: number, quantity: number, remark?: string): Promise<Product> {
  return request<Product>({ method: "POST", path: `/products/${id}/stock-in`, body: { quantity, remark } });
}

export async function stockOut(id: number, quantity: number, remark?: string): Promise<Product> {
  return request<Product>({ method: "POST", path: `/products/${id}/stock-out`, body: { quantity, remark } });
}

export async function listMovements(id: number): Promise<StockMovement[]> {
  return request<StockMovement[]>({ method: "GET", path: `/products/${id}/movements` });
}

export const MOVEMENT_META: Record<StockMovementType, { text: string; color: string }> = {
  IN: { text: "入库", color: "green" },
  OUT: { text: "出库", color: "orange" },
};

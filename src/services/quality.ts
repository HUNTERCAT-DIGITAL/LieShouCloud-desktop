/**
 * Desktop quality service（业务模块 · 质量）.
 */
import { request } from "@lieshoucloud/contract-api";
import type {
  Batch,
  CreateBatchRequest,
  CreateInspectionRequest,
  InspectionResult,
  InspectionType,
  QualityInspection,
} from "@lieshoucloud/contract-types/business/quality";

/** GET /batches — 批次列表 */
export async function listBatches(productId?: number, keyword?: string): Promise<Batch[]> {
  const params: string[] = [];
  if (productId) params.push(`productId=${productId}`);
  if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);
  const qs = params.length > 0 ? `?${params.join("&")}` : "";
  return request<Batch[]>({ method: "GET", path: `/batches${qs}` });
}

/** POST /batches — 新建批次 */
export async function createBatch(body: CreateBatchRequest): Promise<Batch> {
  return request<Batch>({ method: "POST", path: "/batches", body });
}

/** GET /inspections — 质检记录列表 */
export async function listInspections(params?: {
  productId?: number;
  type?: InspectionType;
  result?: InspectionResult;
}): Promise<QualityInspection[]> {
  const search = new URLSearchParams();
  if (params?.productId) search.set("productId", String(params.productId));
  if (params?.type) search.set("type", params.type);
  if (params?.result) search.set("result", params.result);
  const qs = search.toString();
  return request<QualityInspection[]>({ method: "GET", path: `/inspections${qs ? `?${qs}` : ""}` });
}

/** POST /inspections — 新建质检记录 */
export async function createInspection(body: CreateInspectionRequest): Promise<QualityInspection> {
  return request<QualityInspection>({ method: "POST", path: "/inspections", body });
}

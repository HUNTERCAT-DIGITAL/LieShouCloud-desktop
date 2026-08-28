/**
 * Desktop contract service（业务模块 · 合同）.
 */
import { request } from "@lieshoucloud/contract-api";
import type {
  Contract,
  ContractStatus,
  CreateContractRequest,
  UpdateContractRequest,
} from "@lieshoucloud/contract-types/business/contract";

/** GET /contracts — 合同列表 */
export async function listContracts(
  customerId?: number,
  status?: ContractStatus,
  keyword?: string,
): Promise<Contract[]> {
  const params: string[] = [];
  if (customerId) params.push(`customerId=${customerId}`);
  if (status) params.push(`status=${status}`);
  if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);
  const qs = params.length > 0 ? `?${params.join("&")}` : "";
  return request<Contract[]>({ method: "GET", path: `/api/contracts${qs}` });
}

/** POST /contracts — 新建合同 */
export async function createContract(body: CreateContractRequest): Promise<Contract> {
  return request<Contract>({ method: "POST", path: "/api/contracts", body });
}

/** PUT /contracts/{id} — 更新合同 */
export async function updateContract(id: number, body: UpdateContractRequest): Promise<Contract> {
  return request<Contract>({ method: "PUT", path: `/api/contracts/${id}`, body });
}

/** DELETE /contracts/{id} — 删除合同 */
export async function deleteContract(id: number): Promise<void> {
  return request<void>({ method: "DELETE", path: `/api/contracts/${id}` });
}

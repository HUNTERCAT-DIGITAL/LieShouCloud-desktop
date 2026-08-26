/**
 * Desktop customer service（Phase 9 多端真实化）.
 *
 * 类型与 admin 的 services/crm.ts 对齐——下一阶段 types 包下沉后可彻底共享。
 * 现在先用 inline 类型，保持 desktop 独立可运行。
 */
import { request } from "@lieshoucloud/api-client";

export type CustomerStatus = "NEW" | "FOLLOWING" | "CONVERTED" | "LOST";

export interface Customer {
  id: number;
  tenantId: number;
  name: string;
  contactName?: string | null;
  contactPhone?: string | null;
  email?: string | null;
  address?: string | null;
  status: CustomerStatus;
  ownerId?: number | null;
  remark?: string | null;
  createdAt: string;
  updatedAt?: string;
}

// api-client request() 会自动拼 `/api` 前缀（vite proxy → gateway），此处只写 `/customers/**`。

export async function listCustomers(keyword?: string, status?: CustomerStatus): Promise<Customer[]> {
  const query: string[] = [];
  if (keyword) query.push(`keyword=${encodeURIComponent(keyword)}`);
  if (status) query.push(`status=${status}`);
  const qs = query.length > 0 ? `?${query.join("&")}` : "";
  return request<Customer[]>({ method: "GET", path: `/customers${qs}` });
}

export async function countCustomers(): Promise<number> {
  return request<number>({ method: "GET", path: `/customers/count` });
}

export async function getCustomer(id: number): Promise<Customer> {
  return request<Customer>({ method: "GET", path: `/customers/${id}` });
}

export const STATUS_META: Record<CustomerStatus, { text: string; color: string }> = {
  NEW: { text: "新客户", color: "blue" },
  FOLLOWING: { text: "跟进中", color: "gold" },
  CONVERTED: { text: "已转化", color: "green" },
  LOST: { text: "已流失", color: "red" },
};

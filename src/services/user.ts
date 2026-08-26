/**
 * Desktop user service（阶段 2 · 审批人下拉 · ADR-0032）.
 * 只取发起审批需要的字段（租户用户列表）。
 */
import { request } from "@lieshoucloud/api-client";

export interface UserOption {
  id: number;
  username: string;
  displayName?: string | null;
  status?: string;
}

export async function listUsers(): Promise<UserOption[]> {
  return request<UserOption[]>({ method: "GET", path: "/users" });
}

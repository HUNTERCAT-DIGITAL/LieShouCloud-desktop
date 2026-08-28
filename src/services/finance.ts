/**
 * Desktop finance service（Phase 9 · 多端接入）.
 */
import { request } from "@lieshoucloud/contract-api";

export type LedgerType = "INCOME" | "EXPENSE";

export interface LedgerEntry {
  id: number;
  tenantId: number;
  type: LedgerType;
  amount: number;
  category?: string | null;
  occurredAt: string;
  remark?: string | null;
  createdAt: string;
}

export interface LedgerSummary {
  income: number;
  expense: number;
  balance: number;
  count: number;
}

export async function listLedger(type?: LedgerType): Promise<LedgerEntry[]> {
  const qs = type ? `?type=${type}` : "";
  return request<LedgerEntry[]>({ method: "GET", path: `/api/ledger${qs}` });
}

export async function getSummary(): Promise<LedgerSummary> {
  return request<LedgerSummary>({ method: "GET", path: `/api/ledger/summary` });
}

export async function createLedger(body: {
  type: LedgerType;
  amount: number;
  category?: string;
  occurredAt: string;
  remark?: string;
}): Promise<LedgerEntry> {
  return request<LedgerEntry>({ method: "POST", path: `/api/ledger`, body });
}

export async function deleteLedger(id: number): Promise<void> {
  return request<void>({ method: "DELETE", path: `/api/ledger/${id}` });
}

export const LEDGER_TYPE_META: Record<LedgerType, { text: string; color: string }> = {
  INCOME: { text: "收入", color: "green" },
  EXPENSE: { text: "支出", color: "red" },
};

export const LEDGER_CATEGORIES = ["销售收入", "服务收入", "房租", "工资", "采购", "税费", "办公", "其他"];

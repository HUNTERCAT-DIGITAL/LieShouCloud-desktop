/**
 * 智法云枢 · 案件摘要生成（纯函数,可单测;打印/复制共用）.
 */
import {
  CASE_PRIORITY_META,
  CASE_STAGE_META,
  CASE_STATUS_META,
  CASE_TYPE_META,
  DOC_TYPE_META,
  EVENT_TYPE_META,
  EXPENSE_TYPE_META,
  TIME_ENTRY_STATUS_META,
  type CaseEvent,
  type Expense,
  type ExpenseSummary,
  type LegalCase,
  type LegalDocument,
  type TimeEntry,
  type TimeEntrySummary,
} from "@lieshoucloud/contract-types/business/legal";

export interface CaseSummaryData {
  detail: LegalCase;
  events: CaseEvent[];
  timeEntries: TimeEntry[];
  timeSummary: TimeEntrySummary;
  expenses: Expense[];
  expenseSummary: ExpenseSummary;
  documents: LegalDocument[];
}

const LINE = "────────────────────────────────────────";

function fmtDate(v?: string | null): string {
  return v ? new Date(v).toLocaleDateString("zh-CN") : "—";
}

function money(v?: number | null): string {
  return v != null ? `¥${v.toLocaleString()}` : "—";
}

/** 生成可打印/复制的案件摘要文本 */
export function buildCaseSummaryText(d: CaseSummaryData): string {
  const { detail: c } = d;
  const lines: string[] = [];

  lines.push("凌科安时律所 · 案件办理摘要");
  lines.push(LINE);
  lines.push(`案号:${c.caseNo}`);
  lines.push(`案件标题:${c.title}`);
  lines.push(
    `类型:${CASE_TYPE_META[c.caseType] ?? c.caseType}   阶段:${CASE_STAGE_META[c.stage]?.text ?? c.stage}   状态:${CASE_STATUS_META[c.status]?.text ?? c.status}   关注度:${CASE_PRIORITY_META[c.priority]?.text ?? c.priority}`,
  );
  lines.push(`承办律师:${c.responsibleLawyer ?? "—"}   协办律师:${c.coLawyer ?? "—"}`);
  lines.push(`对方当事人:${c.oppositeParty ?? "—"}   受理法院:${c.court ?? "—"}`);
  lines.push(`标的额:${money(c.amount)}   立案:${fmtDate(c.filedAt)}   结案:${fmtDate(c.closedAt)}`);
  if (c.remark) lines.push(`备注:${c.remark}`);

  lines.push("");
  lines.push(`—— 八阶段进度(当前:${CASE_STAGE_META[c.stage]?.text ?? c.stage} ${c.stageProgress}%) ——`);
  if (d.timeEntries.length > 0 || d.events.length > 0 || d.expenses.length > 0 || d.documents.length > 0) {
    // 明细见下
  }

  lines.push("");
  lines.push(`—— 办案时间线(${d.events.length} 条) ——`);
  if (d.events.length === 0) {
    lines.push("暂无");
  } else {
    for (const ev of d.events) {
      const t = EVENT_TYPE_META[ev.eventType]?.text ?? ev.eventType;
      lines.push(`${fmtDate(ev.occurredAt)} [${t}] ${ev.title}${ev.detail ? ` — ${ev.detail}` : ""}`);
    }
  }

  lines.push("");
  lines.push(
    `—— 计时明细(${d.timeEntries.length} 条 · 累计 ${d.timeSummary.hours} 小时 · ${money(d.timeSummary.amount)}) ——`,
  );
  if (d.timeEntries.length === 0) {
    lines.push("暂无");
  } else {
    for (const te of d.timeEntries) {
      const st = TIME_ENTRY_STATUS_META[te.status]?.text ?? te.status;
      lines.push(
        `${fmtDate(te.workDate)} [${st}] ${te.lawyer} ${te.hours}h × ¥${te.rate} = ${money(te.amount)}${te.description ? ` ${te.description}` : ""}`,
      );
    }
  }

  lines.push("");
  lines.push(`—— 费用明细(${d.expenses.length} 条 · 合计 ${money(d.expenseSummary.amount)}) ——`);
  if (d.expenses.length === 0) {
    lines.push("暂无");
  } else {
    for (const e of d.expenses) {
      lines.push(
        `${fmtDate(e.expenseDate)} [${EXPENSE_TYPE_META[e.expenseType]?.text ?? e.expenseType}] ${money(e.amount)}${e.description ? ` ${e.description}` : ""}`,
      );
    }
  }

  lines.push("");
  lines.push(`—— 卷宗文书(${d.documents.length} 份) ——`);
  if (d.documents.length === 0) {
    lines.push("暂无");
  } else {
    for (const doc of d.documents) {
      lines.push(`${fmtDate(doc.docDate)} [${DOC_TYPE_META[doc.docType]?.text ?? doc.docType}] ${doc.title}`);
    }
  }

  lines.push("");
  lines.push(`生成时间:${new Date().toLocaleString("zh-CN", { hour12: false })}`);
  return lines.join("\n");
}

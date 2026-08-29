/**
 * caseSummary 纯函数单测.
 */
import { describe, expect, it } from "vitest";

import { buildCaseSummaryText } from "./caseSummary";

const base = {
  detail: {
    id: 1,
    caseNo: "LA-2026-001",
    title: "张三诉李四合同纠纷",
    caseType: "CIVIL",
    stage: "TRIAL_PREP",
    stageProgress: 60,
    status: "IN_TRIAL",
    priority: "HIGH",
    responsibleLawyer: "王律师",
    oppositeParty: "李四",
    court: "海淀区人民法院",
    amount: 500000,
    filedAt: "2026-06-01T00:00:00Z",
    remark: "涉商业秘密,注意保密",
    createdAt: "2026-06-01T00:00:00Z",
  } as never,
  events: [
    { id: 1, eventType: "HEARING", title: "第一次开庭", occurredAt: "2026-08-28T09:00:00Z" },
  ] as never,
  timeEntries: [
    {
      id: 1,
      lawyer: "王律师",
      workDate: "2026-08-01",
      hours: 2,
      rate: 800,
      amount: 1600,
      status: "PENDING",
      description: "阅卷",
    },
  ] as never,
  timeSummary: { hours: 2, amount: 1600, count: 1, pendingCount: 1 } as never,
  expenses: [
    { id: 1, expenseType: "COURT_FEE", amount: 5000, expenseDate: "2026-08-02", description: "诉讼费" },
  ] as never,
  expenseSummary: { amount: 5000, count: 1 } as never,
  documents: [{ id: 1, docType: "PLEADING", title: "民事起诉状", docDate: "2026-08-03" }] as never,
};

describe("buildCaseSummaryText", () => {
  it("包含案件核心信息", () => {
    const text = buildCaseSummaryText(base as never);
    expect(text).toContain("LA-2026-001");
    expect(text).toContain("张三诉李四合同纠纷");
    expect(text).toContain("07 庭审/谈判提纲"); // TRIAL_PREP 阶段
    expect(text).toContain("审理中"); // IN_TRIAL
    expect(text).toContain("高关注"); // HIGH
    expect(text).toContain("海淀区人民法院");
    expect(text).toContain("¥500,000");
  });

  it("包含时间线/计时/费用/文书明细", () => {
    const text = buildCaseSummaryText(base as never);
    expect(text).toContain("[开庭] 第一次开庭");
    expect(text).toContain("王律师 2h × ¥800 = ¥1,600");
    expect(text).toContain("累计 2 小时");
    expect(text).toContain("合计 ¥5,000");
    expect(text).toContain("[诉状]"); // PLEADING
    expect(text).toContain("民事起诉状");
  });

  it("空明细 → 暂无占位", () => {
    const empty = {
      ...base,
      events: [],
      timeEntries: [],
      expenses: [],
      documents: [],
      timeSummary: { hours: 0, amount: 0, count: 0, pendingCount: 0 },
      expenseSummary: { amount: 0, count: 0 },
    };
    const text = buildCaseSummaryText(empty as never);
    expect(text).toContain("办案时间线(0 条)");
    expect(text).toContain("暂无");
    expect(text).toContain("卷宗文书(0 份)");
  });
});

/**
 * 智法云枢 · 案件详情（桌面端核心页 · 律所特色）.
 *
 * 八阶段进度 + 时间线 + 基本信息 + 计时(收费)/费用(支出)/卷宗文书 Tabs。
 */
import { ArrowLeftOutlined, CopyOutlined, PlusOutlined, PrinterOutlined } from "@ant-design/icons";
import { EmptyState, StatusTag } from "@lieshoucloud/ui";
import {
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Row,
  Select,
  Skeleton,
  Space,
  Steps,
  Table,
  Tabs,
  Tag,
  Timeline,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  CASE_PRIORITY_META,
  CASE_STAGE_FLOW,
  CASE_STAGE_META,
  CASE_STATUS_META,
  CASE_TYPE_META,
  DOC_TYPE_META,
  EVENT_TYPE_META,
  EXPENSE_TYPE_META,
  TIME_ENTRY_STATUS_META,
  stageIndex,
  type CaseEvent,
  type Expense,
  type ExpenseRequest,
  type LegalCase,
  type LegalDocument,
  type TimeEntry,
  type TimeEntryRequest,
} from "@lieshoucloud/contract-types/business/legal";
import {
  addCaseEvent,
  advanceStage,
  createExpense,
  createTimeEntry,
  getCase,
  getExpenseSummary,
  getTimeSummary,
  listCaseEvents,
  listDocuments,
  listExpenses,
  listTimeEntries,
  updateCase,
} from "../services/case";
import { buildCaseSummaryText } from "../utils/caseSummary";

const { Text, Title } = Typography;

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<LegalCase | null>(null);
  const [events, setEvents] = useState<CaseEvent[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [timeSummary, setTimeSummary] = useState({ hours: 0, amount: 0, count: 0, pendingCount: 0 });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseSummary, setExpenseSummary] = useState({ amount: 0, count: 0 });
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [docDetail, setDocDetail] = useState<LegalDocument | null>(null);
  const [eventOpen, setEventOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [eventForm] = Form.useForm();
  const [timeForm] = Form.useForm();
  const [expenseForm] = Form.useForm();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    void Promise.all([getCase(Number(id)), listCaseEvents(Number(id))])
      .then(([c, ev]) => {
        if (cancelled) return;
        setDetail(c);
        setEvents(ev);
        void loadTime();
        void loadExpenses();
        void loadDocuments();
      })
      .catch(() => {
        if (cancelled) return;
        setDetail(null);
        setEvents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} style={{ padding: 16 }} />;
  if (!detail) return <EmptyState description="案件不存在或无权查看" />;

  const cid = Number(id);

  const loadEvents = async () => {
    try {
      setEvents(await listCaseEvents(cid));
    } catch {
      setEvents([]);
    }
  };

  const loadTime = async () => {
    try {
      const [page, sum] = await Promise.all([listTimeEntries(cid), getTimeSummary(cid)]);
      setTimeEntries(page.items);
      setTimeSummary({ hours: sum.hours, amount: sum.amount, count: sum.count, pendingCount: sum.pendingCount });
    } catch {
      setTimeEntries([]);
    }
  };

  const loadExpenses = async () => {
    try {
      const [page, sum] = await Promise.all([listExpenses(cid), getExpenseSummary(cid)]);
      setExpenses(page.items);
      setExpenseSummary({ amount: sum.amount, count: sum.count });
    } catch {
      setExpenses([]);
    }
  };

  const loadDocuments = async () => {
    try {
      const page = await listDocuments(cid);
      setDocuments(page.items);
    } catch {
      setDocuments([]);
    }
  };

  const submitEvent = async (v: { eventType: string; occurredAt: string; title: string; detail?: string }) => {
    try {
      await addCaseEvent(cid, {
        eventType: v.eventType as CaseEvent["eventType"],
        occurredAt: v.occurredAt,
        title: v.title,
        detail: v.detail || undefined,
      });
      message.success("时间线已更新");
      setEventOpen(false);
      eventForm.resetFields();
      void loadEvents();
    } catch (e) {
      message.error(String(e));
    }
  };

  const submitTime = async (v: TimeEntryRequest) => {
    try {
      await createTimeEntry(cid, v);
      message.success("计时已登记");
      setTimeOpen(false);
      timeForm.resetFields();
      void loadTime();
    } catch (e) {
      message.error(String(e));
    }
  };

  const submitExpense = async (v: ExpenseRequest) => {
    try {
      await createExpense(cid, v);
      message.success("费用已登记");
      setExpenseOpen(false);
      expenseForm.resetFields();
      void loadExpenses();
    } catch (e) {
      message.error(String(e));
    }
  };

  /** 生成当前摘要文本 */
  const buildSummary = () =>
    buildCaseSummaryText({
      detail,
      events,
      timeEntries,
      timeSummary,
      expenses,
      expenseSummary,
      documents,
    });

  /** 复制摘要到剪贴板 */
  const copySummary = async () => {
    const text = buildSummary();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    message.success("摘要已复制");
  };

  /** 打印摘要(隐藏 iframe + 系统打印对话框) */
  const printSummary = () => {
    const text = buildSummary();
    const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>案件摘要 ${detail.caseNo}</title>
<style>
  body { font-family: "Microsoft YaHei", sans-serif; color: #222; margin: 32px; }
  pre { white-space: pre-wrap; word-break: break-all; font-family: inherit; line-height: 1.8; }
  @media print { body { margin: 0; } }
</style></head><body><pre>${safe}</pre></body></html>`;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }
    window.setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      window.setTimeout(() => iframe.remove(), 500);
    }, 300);
  };

  const stageIdx = stageIndex(detail.stage);
  const stageMeta = CASE_STAGE_META[detail.stage];
  const statusMeta = CASE_STATUS_META[detail.status];
  const priorityMeta = CASE_PRIORITY_META[detail.priority];

  /** 标记当前阶段完成(progress → 100) */
  const markStageComplete = async () => {
    try {
      const next = await updateCase(cid, {
        caseNo: detail.caseNo,
        title: detail.title,
        stage: detail.stage,
        stageProgress: 100,
      });
      setDetail(next);
      message.success("本阶段已标记完成");
      void addCaseEvent(cid, {
        eventType: "OTHER",
        occurredAt: new Date().toISOString().slice(0, 10),
        title: `阶段完成:${CASE_STAGE_FLOW[stageIdx]?.name ?? detail.stage}`,
      });
      void loadEvents();
    } catch (e) {
      message.error(String(e));
    }
  };

  /** 推进到下一阶段(progress=100 时触发) */
  const advanceToNextStage = async () => {
    const next = advanceStage(detail.stage, detail.stageProgress);
    if (!next) {
      message.info("已到最后阶段");
      return;
    }
    try {
      const updated = await updateCase(cid, {
        caseNo: detail.caseNo,
        title: detail.title,
        stage: next.stage,
        stageProgress: next.stageProgress,
      });
      setDetail(updated);
      message.success(`已进入「${CASE_STAGE_FLOW[stageIndex(next.stage)]?.name ?? next.stage}」阶段`);
      void addCaseEvent(cid, {
        eventType: "OTHER",
        occurredAt: new Date().toISOString().slice(0, 10),
        title: `进入阶段:${CASE_STAGE_FLOW[stageIndex(next.stage)]?.name ?? next.stage}`,
      });
      void loadEvents();
    } catch (e) {
      message.error(String(e));
    }
  };

  const timeColumns: ColumnsType<TimeEntry> = [
    { title: "律师", dataIndex: "lawyer", key: "lawyer", width: 100 },
    { title: "工作日期", dataIndex: "workDate", key: "workDate", width: 110 },
    { title: "工时(h)", dataIndex: "hours", key: "hours", width: 80 },
    { title: "费率(元/h)", dataIndex: "rate", key: "rate", width: 100 },
    { title: "金额(元)", dataIndex: "amount", key: "amount", width: 100, render: (v: number) => `¥${v.toLocaleString()}` },
    { title: "说明", dataIndex: "description", key: "description", ellipsis: true, render: (v?: string) => v ?? "—" },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 90,
      render: (s: TimeEntry["status"]) => <StatusTag meta={TIME_ENTRY_STATUS_META[s]} />,
    },
  ];

  const expenseColumns: ColumnsType<Expense> = [
    { title: "类型", dataIndex: "expenseType", key: "expenseType", width: 110, render: (t: Expense["expenseType"]) => EXPENSE_TYPE_META[t]?.text ?? t },
    { title: "说明", dataIndex: "description", key: "description", ellipsis: true },
    { title: "金额(元)", dataIndex: "amount", key: "amount", width: 110, render: (v: number) => `¥${v.toLocaleString()}` },
    { title: "日期", dataIndex: "expenseDate", key: "expenseDate", width: 110 },
  ];

  const docColumns: ColumnsType<LegalDocument> = [
    { title: "类型", dataIndex: "docType", key: "docType", width: 110, render: (t: LegalDocument["docType"]) => <Tag color={DOC_TYPE_META[t]?.color}>{DOC_TYPE_META[t]?.text ?? t}</Tag> },
    { title: "标题", dataIndex: "title", key: "title", ellipsis: true },
    { title: "日期", dataIndex: "docDate", key: "docDate", width: 110, render: (v?: string) => v ?? "—" },
  ];

  /** 打开附件/外链(tauri shell.open;web 回退 window.open) */
  const openAttachment = async (url: string) => {
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
      try {
        const { open } = await import("@tauri-apps/plugin-shell");
        await open(url);
        return;
      } catch {
        // fallthrough
      }
    }
    window.open(url, "_blank");
  };

  return (
    <div style={{ padding: 16 }}>
      <Space style={{ marginBottom: 12 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate("/cases")}>
          返回案件列表
        </Button>
        <Button icon={<PrinterOutlined />} onClick={printSummary}>
          打印摘要
        </Button>
        <Button icon={<CopyOutlined />} onClick={() => void copySummary()}>
          复制摘要
        </Button>
      </Space>

      <Card style={{ marginBottom: 12 }}>
        <Space direction="vertical" size={4} style={{ width: "100%" }}>
          <Title level={4} style={{ margin: 0 }}>
            {detail.title}
          </Title>
          <Space wrap>
            <Text type="secondary">{detail.caseNo}</Text>
            {detail.matterNo && <Tag>{detail.matterNo}</Tag>}
            <Tag>{CASE_TYPE_META[detail.caseType] ?? detail.caseType}</Tag>
            {stageMeta && <Tag color={stageMeta.color}>{stageMeta.text}</Tag>}
            {statusMeta && <StatusTag meta={statusMeta} />}
            {priorityMeta && <Tag color={priorityMeta.color}>{priorityMeta.text}</Tag>}
            {detail.dataClassification && <Tag color="purple">密级 {detail.dataClassification}</Tag>}
          </Space>
        </Space>
      </Card>

      <Card
        title="八阶段办理主线"
        style={{ marginBottom: 12 }}
        extra={
          <Space>
            {stageIdx < CASE_STAGE_FLOW.length - 1 && detail.stageProgress < 100 && (
              <Button size="small" type="primary" onClick={markStageComplete}>
                标记本阶段完成
              </Button>
            )}
            {stageIdx < CASE_STAGE_FLOW.length - 1 && detail.stageProgress >= 100 && (
              <Button size="small" type="primary" onClick={advanceToNextStage}>
                进入下一阶段
              </Button>
            )}
            {stageIdx >= CASE_STAGE_FLOW.length - 1 && detail.stageProgress >= 100 && (
              <Tag color="green">全部阶段已完成</Tag>
            )}
          </Space>
        }
      >
        <Steps current={stageIdx} size="small" items={CASE_STAGE_FLOW.map((f) => ({ title: f.name }))} />
        <div style={{ marginTop: 16 }}>
          <Space>
            <Text type="secondary">当前阶段进度</Text>
            <Progress
              percent={detail.stageProgress}
              style={{ width: 280 }}
              status={detail.stageProgress >= 100 ? "success" : undefined}
            />
            {stageIdx < CASE_STAGE_FLOW.length - 1 && detail.stageProgress >= 100 && (
              <Text type="secondary">已完成,可进入下一阶段</Text>
            )}
          </Space>
        </div>
        {CASE_STAGE_FLOW[stageIdx] && (
          <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
            本阶段产出：{CASE_STAGE_FLOW[stageIdx].outputs.join(" / ")}
          </Text>
        )}
      </Card>

      <Tabs
        defaultActiveKey="info"
        items={[
          {
            key: "info",
            label: "案件信息与时间线",
            children: (
              <Row gutter={12}>
                <Col span={14}>
                  <Card title="案件信息">
                    <Descriptions column={2} size="small" bordered>
                      <Descriptions.Item label="案件类型">
                        {CASE_TYPE_META[detail.caseType] ?? detail.caseType}
                      </Descriptions.Item>
                      <Descriptions.Item label="承办律师">
                        {detail.responsibleLawyer ?? "—"}
                      </Descriptions.Item>
                      <Descriptions.Item label="协办律师">
                        {detail.coLawyer ?? "—"}
                      </Descriptions.Item>
                      <Descriptions.Item label="对方当事人">
                        {detail.oppositeParty ?? "—"}
                      </Descriptions.Item>
                      <Descriptions.Item label="受理法院">
                        {detail.court ?? "—"}
                      </Descriptions.Item>
                      <Descriptions.Item label="标的额">
                        {detail.amount != null ? `¥${detail.amount.toLocaleString()}` : "—"}
                      </Descriptions.Item>
                      <Descriptions.Item label="立案日期">
                        {detail.filedAt ? new Date(detail.filedAt).toLocaleDateString("zh-CN") : "—"}
                      </Descriptions.Item>
                      <Descriptions.Item label="结案日期">
                        {detail.closedAt ? new Date(detail.closedAt).toLocaleDateString("zh-CN") : "—"}
                      </Descriptions.Item>
                      <Descriptions.Item label="备注" span={2}>
                        {detail.remark ?? "—"}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
                <Col span={10}>
                  <Card
                    title="办案时间线"
                    extra={
                      <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setEventOpen(true)}>
                        新增事件
                      </Button>
                    }
                  >
                    {events.length === 0 ? (
                      <EmptyState description="暂无办案记录" />
                    ) : (
                      <Timeline
                        items={events.map((ev) => {
                          const meta = EVENT_TYPE_META[ev.eventType];
                          return {
                            color: meta?.color,
                            children: (
                              <>
                                <Space size={6}>
                                  {meta && <Tag color={meta.color}>{meta.text}</Tag>}
                                  <Text strong>{ev.title}</Text>
                                </Space>
                                {ev.detail && (
                                  <div>
                                    <Text type="secondary">{ev.detail}</Text>
                                  </div>
                                )}
                                <div>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    {new Date(ev.occurredAt).toLocaleString("zh-CN", { hour12: false })}
                                  </Text>
                                </div>
                              </>
                            ),
                          };
                        })}
                      />
                    )}
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: "time",
            label: `计时 (${timeSummary.count})`,
            children: (
              <>
                <Row gutter={12} style={{ marginBottom: 12 }}>
                  <Col span={8}>
                    <Card>
                      <StatisticRow label="累计工时" value={`${timeSummary.hours} 小时`} />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card>
                      <StatisticRow label="计时金额" value={`¥${timeSummary.amount.toLocaleString()}`} />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card>
                      <StatisticRow label="待确认" value={`${timeSummary.pendingCount} 笔`} />
                    </Card>
                  </Col>
                </Row>
                <Card
                  title="计时明细"
                  extra={
                    <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setTimeOpen(true)}>
                      登记计时
                    </Button>
                  }
                >
                  <Table<TimeEntry>
                    rowKey="id"
                    columns={timeColumns}
                    dataSource={timeEntries}
                    pagination={false}
                    locale={{ emptyText: <EmptyState description="暂无计时记录" /> }}
                  />
                </Card>
              </>
            ),
          },
          {
            key: "expense",
            label: `费用 (${expenseSummary.count})`,
            children: (
              <>
                <Row gutter={12} style={{ marginBottom: 12 }}>
                  <Col span={12}>
                    <Card>
                      <StatisticRow label="费用合计" value={`¥${expenseSummary.amount.toLocaleString()}`} />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card>
                      <StatisticRow label="费用笔数" value={`${expenseSummary.count} 笔`} />
                    </Card>
                  </Col>
                </Row>
                <Card
                  title="费用明细"
                  extra={
                    <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setExpenseOpen(true)}>
                      登记费用
                    </Button>
                  }
                >
                  <Table<Expense>
                    rowKey="id"
                    columns={expenseColumns}
                    dataSource={expenses}
                    pagination={false}
                    locale={{ emptyText: <EmptyState description="暂无费用记录" /> }}
                  />
                </Card>
              </>
            ),
          },
          {
            key: "doc",
            label: `卷宗文书 (${documents.length})`,
            children: (
              <Card title="卷宗文书">
                <Table<LegalDocument>
                  rowKey="id"
                  columns={docColumns}
                  dataSource={documents}
                  pagination={false}
                  locale={{ emptyText: <EmptyState description="暂无文书" /> }}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* 新增事件 */}
      <Modal title="新增办案事件" open={eventOpen} onCancel={() => setEventOpen(false)} onOk={() => eventForm.submit()} destroyOnClose width={460}>
        <Form form={eventForm} layout="vertical" onFinish={submitEvent} requiredMark={false}>
          <Form.Item label="事件类型" name="eventType" rules={[{ required: true }]}>
            <Select options={Object.entries(EVENT_TYPE_META).map(([v, m]) => ({ value: v, label: m.text }))} />
          </Form.Item>
          <Form.Item label="发生时间" name="occurredAt" rules={[{ required: true }]}>
            <Input placeholder="YYYY-MM-DD 或 YYYY-MM-DD HH:mm" />
          </Form.Item>
          <Form.Item label="标题" name="title" rules={[{ required: true }]}>
            <Input placeholder="如:第一次开庭" />
          </Form.Item>
          <Form.Item label="详情" name="detail">
            <Input.TextArea rows={3} placeholder="事件描述(可选)" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 登记计时 */}
      <Modal title="登记计时" open={timeOpen} onCancel={() => setTimeOpen(false)} onOk={() => timeForm.submit()} destroyOnClose width={460}>
        <Form form={timeForm} layout="vertical" onFinish={submitTime} requiredMark={false}>
          <Form.Item label="律师" name="lawyer" rules={[{ required: true }]}>
            <Input placeholder="承办律师" />
          </Form.Item>
          <Form.Item label="工作日期" name="workDate" rules={[{ required: true }]}>
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Space size="middle" style={{ display: "flex" }}>
            <Form.Item label="工时(小时)" name="hours" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: "100%" }} min={0.1} step={0.5} placeholder="如:2" />
            </Form.Item>
            <Form.Item label="费率(元/小时)" name="rate" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: "100%" }} min={0} placeholder="如:800" />
            </Form.Item>
          </Space>
          <Form.Item label="说明" name="description">
            <Input.TextArea rows={2} placeholder="工作内容(可选)" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 登记费用 */}
      <Modal title="登记费用" open={expenseOpen} onCancel={() => setExpenseOpen(false)} onOk={() => expenseForm.submit()} destroyOnClose width={460}>
        <Form form={expenseForm} layout="vertical" onFinish={submitExpense} requiredMark={false}>
          <Form.Item label="费用类型" name="expenseType" rules={[{ required: true }]}>
            <Select options={Object.entries(EXPENSE_TYPE_META).map(([v, m]) => ({ value: v, label: m.text }))} />
          </Form.Item>
          <Form.Item label="说明" name="description" rules={[{ required: true }]}>
            <Input placeholder="如:诉讼费、差旅费" />
          </Form.Item>
          <Space size="middle" style={{ display: "flex" }}>
            <Form.Item label="金额(元)" name="amount" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: "100%" }} min={0} placeholder="0.00" />
            </Form.Item>
            <Form.Item label="日期" name="expenseDate" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      {/* 文书详情 */}
      <Modal
        title={docDetail ? `文书 · ${docDetail.title}` : "文书"}
        open={!!docDetail}
        onCancel={() => setDocDetail(null)}
        footer={(() => {
          const url = docDetail?.fileUrl ?? null;
          return url ? (
            <Button type="primary" onClick={() => void openAttachment(url)}>
              打开附件
            </Button>
          ) : (
            <Button onClick={() => setDocDetail(null)}>关闭</Button>
          );
        })()}
        width={620}
      >
        {docDetail && (
          <>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 12 }}>
              <Descriptions.Item label="文书类型">
                <Tag color={DOC_TYPE_META[docDetail.docType]?.color}>{DOC_TYPE_META[docDetail.docType]?.text ?? docDetail.docType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="日期">{docDetail.docDate ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="标题" span={2}>
                {docDetail.title}
              </Descriptions.Item>
              {docDetail.fileUrl && (
                <Descriptions.Item label="附件" span={2}>
                  <Text style={{ wordBreak: "break-all" }} copyable={{ text: docDetail.fileUrl }}>
                    {docDetail.fileUrl}
                  </Text>
                </Descriptions.Item>
              )}
            </Descriptions>
            <div style={{ maxHeight: 320, overflow: "auto", background: "#fafafa", borderRadius: 6, padding: 12 }}>
              {docDetail.content ? (
                <Text style={{ whiteSpace: "pre-wrap", display: "block" }}>{docDetail.content}</Text>
              ) : (
                <Text type="secondary">该文书暂无正文内容</Text>
              )}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

/** 简单统计行 */
function StatisticRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: "#8c8c8c", fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

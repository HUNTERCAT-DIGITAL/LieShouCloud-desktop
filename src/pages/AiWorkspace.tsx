/**
 * AI 助手页（智法云枢 · 办案会话:案件秘书/计时数字化/合规/检索 + 建议处理）.
 * 数据源:@lieshoucloud/core-web ai.api。
 */
import { PlusOutlined } from "@ant-design/icons";
import { EmptyState } from "@lieshoucloud/ui";
import { useCallback, useEffect, useState } from "react";
import {
  advanceAiSessionLayer,
  createAiSession,
  handleAiSuggestion,
  listAiSuggestions,
  listMyAiSessions,
} from "@lieshoucloud/core-web";
import type {
  AgentCode,
  AiLayer,
  AiSession,
  AiSessionRequest,
  AiSuggestion,
  SuggestionKind,
  SuggestionStatus,
} from "@lieshoucloud/contract-types/business/legal";
import { App, Button, Card, Drawer, Form, InputNumber, Modal, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";

const AGENT_META: Record<AgentCode, { text: string; color: string }> = {
  CASE_SECRETARY: { text: "案件秘书", color: "blue" },
  TIME_DIGITAL: { text: "计时数字化", color: "cyan" },
  COMPLIANCE: { text: "合规助手", color: "red" },
  RESEARCH: { text: "检索研究", color: "purple" },
};

const LAYER_META: Record<AiLayer, { text: string; color: string }> = {
  DRAFT: { text: "草稿", color: "default" },
  CASE: { text: "入卷", color: "blue" },
  PENDING_CONFIRM: { text: "待确认", color: "orange" },
  EXPERIENCE_CANDIDATE: { text: "经验候选", color: "purple" },
  REVIEW: { text: "评审中", color: "gold" },
};

const KIND_META: Record<SuggestionKind, { text: string; color: string }> = {
  TIME_ATTRIBUTION: { text: "计时归属", color: "blue" },
  CONFLICT_HINT: { text: "冲突提示", color: "red" },
  KNOWLEDGE_CARD: { text: "知识卡", color: "purple" },
  DOC_DRAFT: { text: "文书草稿", color: "cyan" },
  SUMMARY: { text: "摘要", color: "green" },
};

const SUGGESTION_STATUS_META: Record<SuggestionStatus, { text: string; color: string }> = {
  PENDING: { text: "待处理", color: "orange" },
  ACCEPTED: { text: "已采纳", color: "success" },
  MODIFIED: { text: "已修改", color: "processing" },
  REJECTED: { text: "已拒绝", color: "default" },
};

export default function AiWorkspace() {
  const { message } = App.useApp();
  const [sessions, setSessions] = useState<AiSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<AiSessionRequest>();
  const [current, setCurrent] = useState<AiSession | null>(null);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSessions(await listMyAiSessions());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    const values = await form.validateFields();
    await createAiSession(values);
    message.success("会话已创建");
    setOpen(false);
    form.resetFields();
    void load();
  };

  const openSession = async (s: AiSession) => {
    setCurrent(s);
    setSuggestions(await listAiSuggestions(s.id));
  };

  const advanceLayer = async () => {
    if (!current) return;
    const order: AiLayer[] = ["DRAFT", "CASE", "PENDING_CONFIRM", "REVIEW", "EXPERIENCE_CANDIDATE"];
    const next = order[Math.min(order.indexOf(current.layer) + 1, order.length - 1)];
    const updated = await advanceAiSessionLayer(current.id, { layer: next });
    setCurrent(updated);
    setSessions(await listMyAiSessions());
    message.success("会话已升级");
  };

  const handleSuggestion = async (id: number, status: "ACCEPTED" | "MODIFIED" | "REJECTED") => {
    await handleAiSuggestion(id, { status });
    message.success("已处理");
    if (current) setSuggestions(await listAiSuggestions(current.id));
  };

  const sessionColumns: ColumnsType<AiSession> = [
    { title: "助手", dataIndex: "agentCode", width: 110, render: (v: AgentCode) => <Tag color={AGENT_META[v]?.color}>{AGENT_META[v]?.text ?? v}</Tag> },
    { title: "案件 ID", dataIndex: "caseId", width: 80 },
    { title: "层级", dataIndex: "layer", width: 90, render: (v: AiLayer) => <Tag color={LAYER_META[v]?.color}>{LAYER_META[v]?.text ?? v}</Tag> },
    { title: "来源数", dataIndex: "sourceCount", width: 80 },
    { title: "操作", width: 160, render: (_, r) => (
        <Space size={4}>
          <Button size="small" onClick={() => void openSession(r)}>建议</Button>
          {r.layer !== "REVIEW" && r.layer !== "EXPERIENCE_CANDIDATE" && <Button size="small" onClick={() => void advanceLayer()}>升级</Button>}
        </Space>
      ) },
  ];

  const suggestionColumns: ColumnsType<AiSuggestion> = [
    { title: "类型", dataIndex: "kind", width: 100, render: (v: SuggestionKind) => <Tag color={KIND_META[v]?.color}>{KIND_META[v]?.text ?? v}</Tag> },
    { title: "建议内容", dataIndex: "payloadJson", ellipsis: true },
    { title: "状态", dataIndex: "status", width: 90, render: (v: SuggestionStatus) => <Tag color={SUGGESTION_STATUS_META[v]?.color}>{SUGGESTION_STATUS_META[v]?.text ?? v}</Tag> },
    { title: "操作", width: 180, render: (_, r) => r.status === "PENDING" ? (
        <Space size={4}>
          <Button size="small" type="primary" onClick={() => void handleSuggestion(r.id, "ACCEPTED")}>采纳</Button>
          <Button size="small" onClick={() => void handleSuggestion(r.id, "MODIFIED")}>修改</Button>
          <Button size="small" danger onClick={() => void handleSuggestion(r.id, "REJECTED")}>拒绝</Button>
        </Space>
      ) : null },
  ];

  return (
    <>
      <Card
        title="AI 办案助手"
        extra={<Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setOpen(true); }}>新建会话</Button>}
      >
        <Table<AiSession> rowKey="id" columns={sessionColumns} dataSource={sessions} loading={loading} pagination={false} locale={{ emptyText: <EmptyState description="暂无 AI 会话" /> }} />
      </Card>
      <Modal title="新建 AI 会话" open={open} onOk={() => void save()} onCancel={() => setOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical" initialValues={{ agentCode: "CASE_SECRETARY" }}>
          <Form.Item name="agentCode" label="助手" rules={[{ required: true }]}>
            <Select options={Object.entries(AGENT_META).map(([v, m]) => ({ value: v, label: m.text }))} />
          </Form.Item>
          <Form.Item name="caseId" label="案件 ID" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} min={1} />
          </Form.Item>
        </Form>
      </Modal>
      <Drawer title={`会话建议 · ${current ? AGENT_META[current.agentCode]?.text ?? current.agentCode : ""}`} open={!!current} onClose={() => setCurrent(null)} width={560}>
        <Table<AiSuggestion> rowKey="id" columns={suggestionColumns} dataSource={suggestions} pagination={false} size="small" locale={{ emptyText: <EmptyState description="暂无建议" /> }} />
      </Drawer>
    </>
  );
}

/**
 * 知识流 Tab（智法云枢 · 办案经验沉淀 → 知识卡:候选/评审/脱敏/复用）.
 * 数据源:@lieshoucloud/core-web knowledge.api。
 */
import { PlusOutlined } from "@ant-design/icons";
import { EmptyState } from "@lieshoucloud/ui";
import { useCallback, useEffect, useState } from "react";
import { advanceKnowledgeFlow, createKnowledgeFlow, listKnowledgeFlow } from "@lieshoucloud/core-web";
import type { FlowKind, FlowStatus, KnowledgeFlow, KnowledgeFlowRequest } from "@lieshoucloud/contract-types/business/legal";
import { App, Button, Card, Form, Input, Modal, Select, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";

const KIND_META: Record<FlowKind, { text: string }> = {
  STRATEGY_CARD: { text: "策略卡" },
  DOC_EXPR_CARD: { text: "文书表达卡" },
  EXPERIENCE_CARD: { text: "办案经验卡" },
};

const STATUS_META: Record<FlowStatus, { text: string; color: string }> = {
  CANDIDATE: { text: "候选", color: "orange" },
  REVIEWED: { text: "已评审", color: "blue" },
  ANONYMIZED: { text: "已脱敏", color: "purple" },
  REUSABLE: { text: "可复用", color: "success" },
};

const ADVANCE_FLOW: FlowStatus[] = ["CANDIDATE", "REVIEWED", "ANONYMIZED", "REUSABLE"];

export default function KnowledgeFlowTab({ caseId }: { caseId: number }) {
  const { message } = App.useApp();
  const [items, setItems] = useState<KnowledgeFlow[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<KnowledgeFlowRequest>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listKnowledgeFlow(caseId));
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    const values = await form.validateFields();
    await createKnowledgeFlow({ ...values, caseId });
    message.success("经验已沉淀");
    setOpen(false);
    form.resetFields();
    void load();
  };

  const advance = async (id: number, status: FlowStatus) => {
    await advanceKnowledgeFlow(id, { status });
    message.success("状态已流转");
    void load();
  };

  const columns: ColumnsType<KnowledgeFlow> = [
    { title: "类型", dataIndex: "kind", width: 100, render: (v: FlowKind) => <Tag>{KIND_META[v]?.text ?? v}</Tag> },
    { title: "标题", dataIndex: "title", ellipsis: true },
    { title: "状态", dataIndex: "status", width: 90, render: (v: FlowStatus) => <Tag color={STATUS_META[v]?.color}>{STATUS_META[v]?.text ?? v}</Tag> },
    { title: "操作", width: 120, render: (_, r) => {
        const idx = ADVANCE_FLOW.indexOf(r.status);
        const next = ADVANCE_FLOW[idx + 1];
        return next && <Button size="small" onClick={() => void advance(r.id, next)}>流转→{STATUS_META[next].text}</Button>;
      } },
  ];

  return (
    <>
      <Card
        title={`知识流 (${items.length})`}
        extra={<Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setOpen(true); }}>沉淀经验</Button>}
      >
        <Table<KnowledgeFlow> rowKey="id" columns={columns} dataSource={items} loading={loading} pagination={false} size="small" locale={{ emptyText: <EmptyState description="暂无知识沉淀" /> }} />
      </Card>
      <Modal title="沉淀办案经验" open={open} onOk={() => void save()} onCancel={() => setOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical" initialValues={{ kind: "STRATEGY_CARD" }}>
          <Form.Item name="kind" label="类型" rules={[{ required: true }]}>
            <Select options={Object.entries(KIND_META).map(([v, m]) => ({ value: v, label: m.text }))} />
          </Form.Item>
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input placeholder="经验要点标题" />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true }]}>
            <Input.TextArea rows={5} placeholder="办案心得/策略要点/表达范式" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

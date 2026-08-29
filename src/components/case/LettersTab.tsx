/**
 * 案件函件 Tab（智法云枢 · 函件收发/确认/归档）.
 * 数据源:@lieshoucloud/core-web listLegalLetters 等(业务逻辑唯一源)。
 */
import { PlusOutlined } from "@ant-design/icons";
import { EmptyState } from "@lieshoucloud/ui";
import { useCallback, useEffect, useState } from "react";
import {
  createLegalLetter,
  confirmLetter,
  deleteLegalLetter,
  getLegalLetterSummary,
  listLegalLetters,
} from "@lieshoucloud/core-web";
import type {
  ContactLetter,
  LetterDirection,
  LetterRequest,
  LetterStatus,
} from "@lieshoucloud/contract-types/business/legal";
import { App, Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";

const DIRECTION_META: Record<LetterDirection, { text: string; color: string }> = {
  OUTBOUND: { text: "发出", color: "blue" },
  INBOUND: { text: "收到", color: "green" },
};

const STATUS_META: Record<LetterStatus, { text: string; color: string }> = {
  PENDING: { text: "待确认", color: "orange" },
  CONFIRMED: { text: "已确认", color: "success" },
  ARCHIVED: { text: "已归档", color: "default" },
};

export default function LettersTab({ caseId }: { caseId: number }) {
  const { message } = App.useApp();
  const [letters, setLetters] = useState<ContactLetter[]>([]);
  const [summary, setSummary] = useState({ count: 0, pendingCount: 0 });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContactLetter | null>(null);
  const [form] = Form.useForm<LetterRequest>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLetters(await listLegalLetters(caseId));
      const s = await getLegalLetterSummary(caseId);
      setSummary(s);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    const values = await form.validateFields();
    if (editing) {
      await updateLegalLetterLocal(editing.id, values);
      message.success("函件已更新");
    } else {
      await createLegalLetter(caseId, values);
      message.success("函件已登记");
    }
    setOpen(false);
    setEditing(null);
    form.resetFields();
    void load();
  };

  const updateLegalLetterLocal = async (id: number, body: LetterRequest) => {
    // updateLegalLetter 由 core-web 提供
    const { updateLegalLetter } = await import("@lieshoucloud/core-web");
    await updateLegalLetter(id, body);
  };

  const doConfirm = async (id: number) => {
    await confirmLetter(id);
    message.success("已确认");
    void load();
  };

  const doDelete = async (id: number) => {
    await deleteLegalLetter(id);
    message.success("已删除");
    void load();
  };

  const columns: ColumnsType<ContactLetter> = [
    { title: "方向", dataIndex: "direction", width: 80, render: (v: LetterDirection) => <Tag color={DIRECTION_META[v]?.color}>{DIRECTION_META[v]?.text ?? v}</Tag> },
    { title: "对方", dataIndex: "counterparty", width: 140 },
    { title: "事由", dataIndex: "subject", ellipsis: true },
    { title: "状态", dataIndex: "status", width: 90, render: (v: LetterStatus) => <Tag color={STATUS_META[v]?.color}>{STATUS_META[v]?.text ?? v}</Tag> },
    { title: "操作", width: 150, render: (_, r) => (
        <Space size={4}>
          {r.status === "PENDING" && <Button size="small" onClick={() => void doConfirm(r.id)}>确认</Button>}
          <Button size="small" onClick={() => { setEditing(r); setOpen(true); }}>编辑</Button>
          <Popconfirm title="删除该函件?" onConfirm={() => void doDelete(r.id)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ) },
  ];

  return (
    <>
      <RowGap />
      <Card
        title={`函件 (${summary.count} · 待确认 ${summary.pendingCount})`}
        extra={
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>
            登记函件
          </Button>
        }
      >
        <Table<ContactLetter> rowKey="id" columns={columns} dataSource={letters} loading={loading} pagination={false} locale={{ emptyText: <EmptyState description="暂无函件" /> }} />
      </Card>
      <Modal title={editing ? "编辑函件" : "登记函件"} open={open} onOk={() => void save()} onCancel={() => setOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical" initialValues={editing ?? { direction: "OUTBOUND" }}>
          <Form.Item name="direction" label="方向" rules={[{ required: true }]}>
            <Select options={Object.entries(DIRECTION_META).map(([v, m]) => ({ value: v, label: m.text }))} />
          </Form.Item>
          <Form.Item name="counterparty" label="对方" rules={[{ required: true }]}>
            <Input placeholder="对方名称/机构" />
          </Form.Item>
          <Form.Item name="subject" label="事由" rules={[{ required: true }]}>
            <Input placeholder="函件事由" />
          </Form.Item>
          <Form.Item name="content" label="内容">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

function RowGap() {
  return <div style={{ marginBottom: 12 }} />;
}

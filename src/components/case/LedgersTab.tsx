/**
 * 案件台账 Tab（智法云枢 · 事实/证据/策略/任务 分型记录）.
 * 数据源:@lieshoucloud/core-web ledgers.api。
 */
import { PlusOutlined } from "@ant-design/icons";
import { EmptyState } from "@lieshoucloud/ui";
import { useCallback, useEffect, useState } from "react";
import {
  createLegalLedger,
  deleteLegalLedger,
  getLegalLedgerCoverage,
  listLegalLedgers,
} from "@lieshoucloud/core-web";
import type { LedgerEntry, LedgerRequest, LedgerStatus, LedgerType } from "@lieshoucloud/contract-types/business/legal";
import { App, Button, Card, Form, Input, Modal, Popconfirm, Segmented, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";

const TYPE_META: Record<LedgerType, { text: string; color: string }> = {
  FACT: { text: "事实", color: "blue" },
  EVIDENCE: { text: "证据", color: "green" },
  STRATEGY: { text: "策略", color: "purple" },
  TASK: { text: "任务", color: "orange" },
};

const STATUS_META: Record<LedgerStatus, { text: string; color: string }> = {
  CURRENT: { text: "当前", color: "default" },
  CONFIRMED: { text: "已确认", color: "success" },
  PARTIAL_DISPUTED: { text: "部分存疑", color: "warning" },
  PENDING_VERIFY: { text: "待核验", color: "orange" },
};

const TYPES: LedgerType[] = ["FACT", "EVIDENCE", "STRATEGY", "TASK"];

export default function LedgersTab({ caseId }: { caseId: number }) {
  const { message } = App.useApp();
  const [type, setType] = useState<LedgerType>("FACT");
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [coverage, setCoverage] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<LedgerRequest>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, cov] = await Promise.all([listLegalLedgers(caseId, type), getLegalLedgerCoverage(caseId)]);
      setEntries(list);
      setCoverage(cov.byType ?? {});
    } finally {
      setLoading(false);
    }
  }, [caseId, type]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    const values = await form.validateFields();
    await createLegalLedger(caseId, type, values);
    message.success("台账已记录");
    setOpen(false);
    form.resetFields();
    void load();
  };

  const doDelete = async (id: number) => {
    await deleteLegalLedger(id);
    message.success("已删除");
    void load();
  };

  const columns: ColumnsType<LedgerEntry> = [
    { title: "标题", dataIndex: "title", ellipsis: true },
    { title: "详情", dataIndex: "detail", ellipsis: true },
    { title: "状态", dataIndex: "status", width: 90, render: (v: LedgerStatus) => <Tag color={STATUS_META[v]?.color}>{STATUS_META[v]?.text ?? v}</Tag> },
    { title: "操作", width: 80, render: (_, r) => (
        <Popconfirm title="删除该记录?" onConfirm={() => void doDelete(r.id)}>
          <Button size="small" danger>删除</Button>
        </Popconfirm>
      ) },
  ];

  return (
    <>
      <Space direction="vertical" style={{ width: "100%" }} size={12}>
        <Segmented<LedgerType>
          value={type}
          onChange={(v) => setType(v)}
          options={TYPES.map((t) => ({ value: t, label: `${TYPE_META[t].text} (${coverage[t] ?? 0})` }))}
        />
        <Card
          extra={<Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setOpen(true); }}>记录{type === "FACT" ? "事实" : type === "EVIDENCE" ? "证据" : type === "STRATEGY" ? "策略" : "任务"}</Button>}
        >
          <Table<LedgerEntry> rowKey="id" columns={columns} dataSource={entries} loading={loading} pagination={false} size="small" locale={{ emptyText: <EmptyState description="暂无记录" /> }} />
        </Card>
      </Space>
      <Modal title={`记录${type}`} open={open} onOk={() => void save()} onCancel={() => setOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input placeholder="标题" />
          </Form.Item>
          <Form.Item name="detail" label="详情" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="内容" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

/**
 * Desktop 记账本页（Phase 9 · 多端接入）.
 * 收支汇总 + 流水列表 + 记一笔（复用 @lieshoucloud/ui EmptyState / StatusTag）。
 */
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { EmptyState, StatusTag } from "@lieshoucloud/ui";
import { App, Button, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Table, Typography } from "antd";
import { useEffect, useState } from "react";

import {
  createLedger,
  deleteLedger,
  getSummary,
  LEDGER_CATEGORIES,
  LEDGER_TYPE_META,
  listLedger,
  type LedgerEntry,
  type LedgerSummary,
  type LedgerType,
} from "../services/finance";

const { Text } = Typography;

export default function Finance() {
  const { message: messageApi } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [summary, setSummary] = useState<LedgerSummary>({ income: 0, expense: 0, balance: 0, count: 0 });
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([listLedger(), getSummary()]);
      setEntries(list);
      setSummary(s);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onCreate = async (values: {
    type: LedgerType;
    amount: number;
    category?: string;
    occurredAt: unknown;
    remark?: string;
  }) => {
    try {
      const date = values.occurredAt as unknown as { format?: (f: string) => string };
      await createLedger({
        type: values.type,
        amount: Number(values.amount),
        category: values.category || undefined,
        occurredAt: typeof date?.format === "function" ? date.format("YYYY-MM-DD") : String(date),
        remark: values.remark || undefined,
      });
      messageApi.success("已记一笔");
      setCreateOpen(false);
      form.resetFields();
      void load();
    } catch (e) {
      messageApi.error(String(e));
    }
  };

  const onDelete = async (id: number) => {
    try {
      await deleteLedger(id);
      messageApi.success("已删除");
      void load();
    } catch (e) {
      messageApi.error(String(e));
    }
  };

  return (
    <div style={{ padding: 8 }}>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ReloadOutlined />} onClick={() => void load()}>
          刷新
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          记一笔
        </Button>
      </Space>

      <Space size="large" style={{ marginBottom: 16 }}>
        <StatBlock label="总收入" value={summary.income} color="#52c41a" />
        <StatBlock label="总支出" value={summary.expense} color="#f5222d" />
        <StatBlock label="结余" value={summary.balance} color={summary.balance >= 0 ? "#1677ff" : "#f5222d"} />
        <StatBlock label="记录数" value={summary.count} color="#8c8c8c" />
      </Space>

      <Table<LedgerEntry>
        rowKey="id"
        dataSource={entries}
        loading={loading}
        locale={{ emptyText: <EmptyState description="暂无记账记录" /> }}
        pagination={{ pageSize: 20 }}
        columns={[
          { title: "ID", dataIndex: "id", width: 60 },
          {
            title: "类型",
            dataIndex: "type",
            width: 90,
            render: (v: LedgerType) => <StatusTag meta={LEDGER_TYPE_META[v]} />,
          },
          {
            title: "金额",
            dataIndex: "amount",
            width: 130,
            render: (v: number, row) => (
              <Text strong style={{ color: row.type === "INCOME" ? "#52c41a" : "#f5222d" }}>
                {row.type === "INCOME" ? "+" : "-"}¥ {Number(v).toFixed(2)}
              </Text>
            ),
          },
          { title: "分类", dataIndex: "category", width: 110, render: (v) => v ?? "—" },
          { title: "发生日期", dataIndex: "occurredAt", width: 120 },
          {
            title: "操作",
            width: 90,
            render: (_, row) => (
              <Button size="small" danger onClick={() => void onDelete(row.id)}>
                删除
              </Button>
            ),
          },
        ]}
      />

      <Modal open={createOpen} title="记一笔" onCancel={() => setCreateOpen(false)} footer={null} destroyOnClose>
        <Form
          form={form}
          layout="vertical"
          onFinish={onCreate}
          style={{ marginTop: 12 }}
          initialValues={{ type: "INCOME" }}
        >
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select
              options={(Object.keys(LEDGER_TYPE_META) as LedgerType[]).map((t) => ({
                label: LEDGER_TYPE_META[t].text,
                value: t,
              }))}
            />
          </Form.Item>
          <Form.Item name="amount" label="金额（元）" rules={[{ required: true, message: "请输入金额" }]}>
            <InputNumber style={{ width: "100%" }} min={0.01} step={0.01} />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Select
              allowClear
              placeholder="选择分类"
              options={LEDGER_CATEGORIES.map((c) => ({ label: c, value: c }))}
            />
          </Form.Item>
          <Form.Item name="occurredAt" label="发生日期" rules={[{ required: true, message: "请选择日期" }]}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            保存
          </Button>
        </Form>
      </Modal>
    </div>
  );
}

function StatBlock({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ textAlign: "center", minWidth: 110 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {label}
      </Text>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>¥ {Number(value).toFixed(2)}</div>
    </div>
  );
}

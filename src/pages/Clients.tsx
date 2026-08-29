/**
 * 客户价值页（智法云枢 · 客户经营:客户列表 + 价值记录 + 确认闭环）.
 * 数据源:@lieshoucloud/core-web clients.api。
 */
import { PlusOutlined } from "@ant-design/icons";
import { EmptyState } from "@lieshoucloud/ui";
import { useCallback, useEffect, useState } from "react";
import {
  addClientValue,
  confirmClientValue,
  createLegalClient,
  deleteLegalClient,
  getClientSummary,
  listClientValues,
  listLegalClients,
  updateLegalClient,
} from "@lieshoucloud/core-web";
import type {
  ClientRequest,
  ClientSuccessSummary,
  ClientValueRecord,
  ClientValueType,
  LegalClient,
} from "@lieshoucloud/contract-types/business/legal";
import { App, Button, Card, Col, Drawer, Form, Input, InputNumber, Modal, Popconfirm, Row, Select, Space, Statistic, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";

const VALUE_META: Record<ClientValueType, { text: string; color: string }> = {
  RISK_ALERT: { text: "风险预警", color: "red" },
  DECISION_SUPPORT: { text: "决策支持", color: "blue" },
  OUTCOME_ADOPTED: { text: "结果采纳", color: "green" },
};

export default function Clients() {
  const { message } = App.useApp();
  const [clients, setClients] = useState<LegalClient[]>([]);
  const [summary, setSummary] = useState<ClientSuccessSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LegalClient | null>(null);
  const [form] = Form.useForm<ClientRequest>();
  const [detail, setDetail] = useState<LegalClient | null>(null);
  const [values, setValues] = useState<ClientValueRecord[]>([]);
  const [valueOpen, setValueOpen] = useState(false);
  const [valueForm] = Form.useForm<{ valueType: ClientValueType; description: string }>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([listLegalClients(), getClientSummary()]);
      setClients(list);
      setSummary(s);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    const values = await form.validateFields();
    if (editing) {
      await updateLegalClient(editing.id, values);
      message.success("客户已更新");
    } else {
      await createLegalClient(values);
      message.success("客户已登记");
    }
    setOpen(false);
    setEditing(null);
    form.resetFields();
    void load();
  };

  const doDelete = async (id: number) => {
    await deleteLegalClient(id);
    message.success("已删除");
    void load();
  };

  const openValues = async (c: LegalClient) => {
    setDetail(c);
    setValues(await listClientValues(c.id));
    setValueOpen(true);
  };

  const addValue = async () => {
    if (!detail) return;
    const v = await valueForm.validateFields();
    await addClientValue(detail.id, v);
    message.success("价值已记录");
    valueForm.resetFields();
    setValues(await listClientValues(detail.id));
  };

  const confirmValue = async (id: number) => {
    await confirmClientValue(id);
    message.success("已确认");
    if (detail) setValues(await listClientValues(detail.id));
  };

  const columns: ColumnsType<LegalClient> = [
    { title: "客户名称", dataIndex: "name", ellipsis: true },
    { title: "当前服务", dataIndex: "currentService", width: 140, render: (v) => v ?? "—" },
    { title: "健康分", dataIndex: "healthScore", width: 80, render: (v: number) => <Tag color={v >= 80 ? "success" : v >= 60 ? "processing" : "red"}>{v}</Tag> },
    { title: "状态", dataIndex: "status", width: 100, render: (v) => <Tag>{v}</Tag> },
    { title: "操作", width: 200, render: (_, r) => (
        <Space size={4}>
          <Button size="small" onClick={() => void openValues(r)}>价值</Button>
          <Button size="small" onClick={() => { setEditing(r); setOpen(true); }}>编辑</Button>
          <Popconfirm title="删除该客户?" onConfirm={() => void doDelete(r.id)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ) },
  ];

  return (
    <>
      <Row gutter={12} style={{ marginBottom: 12 }}>
        <Col span={6}><Card><Statistic title="客户总数" value={summary?.clientTotal ?? clients.length} /></Card></Col>
        <Col span={6}><Card><Statistic title="高关注" value={summary?.highAttentionCount ?? 0} valueStyle={{ color: "#d4380d" }} /></Card></Col>
        <Col span={6}><Card><Statistic title="跟进中" value={summary?.followUpCount ?? 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="组合健康度" value={summary?.portfolioHealth ?? 0} valueStyle={{ color: "#52c41a" }} /></Card></Col>
      </Row>
      <Card
        title="客户经营"
        extra={<Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>登记客户</Button>}
      >
        <Table<LegalClient> rowKey="id" columns={columns} dataSource={clients} loading={loading} pagination={false} locale={{ emptyText: <EmptyState description="暂无客户" /> }} />
      </Card>

      <Modal title={editing ? "编辑客户" : "登记客户"} open={open} onOk={() => void save()} onCancel={() => setOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical" initialValues={editing ?? { lifecycleStage: "FOCUS" }}>
          <Form.Item name="name" label="客户名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="currentService" label="当前服务">
            <Input placeholder="如常年法律顾问" />
          </Form.Item>
          <Form.Item name="healthScore" label="健康分" initialValue={80}>
            <InputNumber min={0} max={100} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer title={`客户价值 · ${detail?.name ?? ""}`} open={valueOpen} onClose={() => setValueOpen(false)} width={520}>
        <Card
          title="价值记录"
          size="small"
          extra={<Button size="small" type="primary" onClick={() => void addValue()}>记录价值</Button>}
        >
          <Form form={valueForm} layout="vertical">
            <Form.Item name="valueType" label="价值类型" rules={[{ required: true }]}>
              <Select options={Object.entries(VALUE_META).map(([v, m]) => ({ value: v, label: m.text }))} />
            </Form.Item>
            <Form.Item name="description" label="描述" rules={[{ required: true }]}>
              <Input.TextArea rows={3} />
            </Form.Item>
          </Form>
        </Card>
        <Table<ClientValueRecord>
          rowKey="id"
          style={{ marginTop: 12 }}
          columns={[
            { title: "类型", dataIndex: "valueType", render: (v: ClientValueType) => <Tag color={VALUE_META[v]?.color}>{VALUE_META[v]?.text ?? v}</Tag> },
            { title: "描述", dataIndex: "description", ellipsis: true },
            { title: "状态", width: 90, render: (_, r) => r.confirmed ? <Tag color="success">已确认</Tag> : <Button size="small" onClick={() => void confirmValue(r.id)}>确认</Button> },
          ]}
          dataSource={values}
          pagination={false}
          size="small"
        />
      </Drawer>
    </>
  );
}

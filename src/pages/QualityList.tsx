/**
 * Desktop 质量管理（业务模块 · 简化版）.
 * 批次列表 + 新建批次 + 质检记录列表（只读）。
 */
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { EmptyState, StatusTag } from "@lieshoucloud/ui";
import { INSPECTION_RESULT_META, INSPECTION_TYPE_META } from "@lieshoucloud/contract-types/business/quality";
import type {
  Batch,
  CreateBatchRequest,
  InspectionResult,
  InspectionType,
  QualityInspection,
} from "@lieshoucloud/contract-types/business/quality";
import { App, Button, Card, Form, Input, InputNumber, Modal, Select, Space, Table, Tabs } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";

import { createBatch, listBatches, listInspections } from "../services/quality";


interface BatchFormValues {
  productId: number;
  batchNo: string;
  quantity: number;
  supplier?: string;
  remark?: string;
}

export default function QualityList() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [type, setType] = useState<InspectionType | undefined>(undefined);
  const [result, setResult] = useState<InspectionResult | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<BatchFormValues>();

  const load = async () => {
    setLoading(true);
    try {
      const [b, i] = await Promise.all([listBatches(), listInspections({ type, result })]);
      setBatches(b);
      setInspections(i);
    } catch {
      setBatches([]);
      setInspections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, result]);

  const submit = async (v: BatchFormValues) => {
    const body: CreateBatchRequest = {
      productId: v.productId,
      batchNo: v.batchNo,
      quantity: v.quantity,
      supplier: v.supplier || undefined,
      remark: v.remark || undefined,
    };
    try {
      await createBatch(body);
      message.success("批次已创建");
      setOpen(false);
      form.resetFields();
      void load();
    } catch (e) {
      message.error(String(e));
    }
  };

  const batchColumns: ColumnsType<Batch> = [
    { title: "批次号", dataIndex: "batchNo", key: "batchNo" },
    { title: "产品 ID", dataIndex: "productId", key: "productId", width: 90 },
    { title: "数量", dataIndex: "quantity", key: "quantity", width: 90 },
    { title: "供应商", dataIndex: "supplier", key: "supplier", render: (v?: string) => v ?? "—" },
    { title: "备注", dataIndex: "remark", key: "remark", ellipsis: true, render: (v?: string) => v ?? "—" },
    { title: "创建时间", dataIndex: "createdAt", key: "createdAt", width: 170 },
  ];

  const inspectionColumns: ColumnsType<QualityInspection> = [
    { title: "产品 ID", dataIndex: "productId", key: "productId", width: 90 },
    { title: "批次 ID", dataIndex: "batchId", key: "batchId", width: 90, render: (v?: number) => v ?? "—" },
    {
      title: "检验类型",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (t: InspectionType) => <StatusTag meta={INSPECTION_TYPE_META[t]} />,
    },
    {
      title: "结果",
      dataIndex: "result",
      key: "result",
      width: 90,
      render: (r: InspectionResult) => <StatusTag meta={INSPECTION_RESULT_META[r]} />,
    },
    { title: "数量", dataIndex: "quantity", key: "quantity", width: 80 },
    { title: "检验员", dataIndex: "inspector", key: "inspector", render: (v?: string) => v ?? "—" },
    { title: "时间", dataIndex: "inspectedAt", key: "inspectedAt", width: 170, render: (v?: string) => v ?? "—" },
  ];

  return (
    <Card
      title="质量管理"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => void load()}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            新建批次
          </Button>
        </Space>
      }
    >
      <Tabs
        defaultActiveKey="batches"
        items={[
          {
            key: "batches",
            label: `批次 (${batches.length})`,
            children: (
              <Table<Batch>
                rowKey="id"
                loading={loading}
                columns={batchColumns}
                dataSource={batches}
                pagination={false}
                locale={{ emptyText: <EmptyState description="暂无批次" /> }}
              />
            ),
          },
          {
            key: "inspections",
            label: `质检记录 (${inspections.length})`,
            children: (
              <Table<QualityInspection>
                rowKey="id"
                loading={loading}
                columns={inspectionColumns}
                dataSource={inspections}
                pagination={false}
                locale={{ emptyText: <EmptyState description="暂无质检记录" /> }}
              />
            ),
          },
        ]}
        tabBarExtraContent={
          <Space>
            <Select
              allowClear
              placeholder="检验类型"
              style={{ width: 110 }}
              value={type}
              onChange={(v) => setType(v)}
              options={Object.entries(INSPECTION_TYPE_META).map(([v, m]) => ({ value: v, label: m.text }))}
            />
            <Select
              allowClear
              placeholder="结果"
              style={{ width: 100 }}
              value={result}
              onChange={(v) => setResult(v)}
              options={Object.entries(INSPECTION_RESULT_META).map(([v, m]) => ({ value: v, label: m.text }))}
            />
          </Space>
        }
      />
      <Modal
        title="新建批次"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
        width={480}
      >
        <Form<BatchFormValues> form={form} layout="vertical" onFinish={submit} requiredMark={false}>
          <Form.Item label="产品 ID" name="productId" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} min={1} placeholder="产品 ID" />
          </Form.Item>
          <Form.Item label="批次号" name="batchNo" rules={[{ required: true }]}>
            <Input placeholder="如:B202608-001" />
          </Form.Item>
          <Form.Item label="数量" name="quantity" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} min={0} placeholder="数量" />
          </Form.Item>
          <Form.Item label="供应商" name="supplier">
            <Input placeholder="供应商(可选)" />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

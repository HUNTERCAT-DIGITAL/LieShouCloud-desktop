/**
 * Desktop 合同管理（业务模块 · 简化版）.
 */
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { EmptyState, StatusTag } from "@lieshoucloud/ui";
import { CONTRACT_STATUS_META } from "@lieshoucloud/contract-types/business/contract";
import type { Contract, ContractStatus, CreateContractRequest } from "@lieshoucloud/contract-types/business/contract";
import { App, Button, Card, Form, Input, InputNumber, Modal, Select, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";

import { createContract, deleteContract, listContracts, updateContract } from "../services/contract";
import { listCustomers } from "../services/customer";

interface ContractFormValues {
  customerId: number;
  contractNo: string;
  title: string;
  amount?: number;
  signedAt?: string;
  startDate?: string;
  endDate?: string;
  status: ContractStatus;
  remark?: string;
}

export default function ContractList() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([]);
  const [status, setStatus] = useState<ContractStatus | undefined>(undefined);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<ContractFormValues>();

  const load = async () => {
    setLoading(true);
    try {
      const [c, cust] = await Promise.all([listContracts(undefined, status), listCustomers()]);
      setContracts(c);
      setCustomers(cust.map((x) => ({ id: x.id, name: x.name })));
    } catch {
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [status]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: "DRAFT" });
    setOpen(true);
  };

  const openEdit = (c: Contract) => {
    setEditing(c);
    form.setFieldsValue({
      customerId: c.customerId,
      contractNo: c.contractNo,
      title: c.title,
      amount: c.amount ?? undefined,
      signedAt: c.signedAt ?? undefined,
      startDate: c.startDate ?? undefined,
      endDate: c.endDate ?? undefined,
      status: c.status,
      remark: c.remark ?? undefined,
    });
    setOpen(true);
  };

  const submit = async (v: ContractFormValues) => {
    const body: CreateContractRequest = {
      customerId: v.customerId,
      contractNo: v.contractNo,
      title: v.title,
      amount: v.amount,
      signedAt: v.signedAt || undefined,
      startDate: v.startDate || undefined,
      endDate: v.endDate || undefined,
      status: v.status,
      remark: v.remark || undefined,
    };
    try {
      if (editing) await updateContract(editing.id, body);
      else await createContract(body);
      message.success(editing ? "已保存" : "已创建");
      setOpen(false);
      void load();
    } catch (e) {
      message.error(String(e));
    }
  };

  const onDelete = (c: Contract) => {
    Modal.confirm({
      title: `删除合同 ${c.title}？`,
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteContract(c.id);
        message.success("已删除");
        void load();
      },
    });
  };

  const columns: ColumnsType<Contract> = [
    { title: "合同编号", dataIndex: "contractNo", key: "contractNo" },
    { title: "标题", dataIndex: "title", key: "title", ellipsis: true },
    { title: "客户 ID", dataIndex: "customerId", key: "customerId", width: 90 },
    {
      title: "金额(元)",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      render: (v?: number) => (v != null ? `¥${v.toLocaleString()}` : "—"),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (s: ContractStatus) => <StatusTag meta={CONTRACT_STATUS_META[s]} />,
    },
    { title: "签约日期", dataIndex: "signedAt", key: "signedAt", width: 120, render: (v?: string) => v ?? "—" },
    {
      title: "操作",
      key: "action",
      width: 140,
      render: (_, c) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(c)}>
            编辑
          </Button>
          <Button type="link" size="small" danger onClick={() => onDelete(c)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="合同管理"
      extra={
        <Space>
          <Select
            allowClear
            placeholder="状态"
            style={{ width: 110 }}
            value={status}
            onChange={(v) => setStatus(v)}
            options={Object.entries(CONTRACT_STATUS_META).map(([v, m]) => ({ value: v, label: m.text }))}
          />
          <Button icon={<ReloadOutlined />} onClick={() => void load()}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建合同
          </Button>
        </Space>
      }
    >
      <Table<Contract>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={contracts}
        pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
        locale={{ emptyText: <EmptyState description="暂无合同" /> }}
      />
      <Modal
        title={editing ? `编辑合同 ${editing.title}` : "新建合同"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
        width={540}
      >
        <Form<ContractFormValues> form={form} layout="vertical" onFinish={submit} requiredMark={false}>
          <Form.Item label="所属客户" name="customerId" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="选择客户"
              options={customers.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item label="合同编号" name="contractNo" rules={[{ required: true }]}>
            <Input placeholder="如:HT-2026-001" />
          </Form.Item>
          <Form.Item label="标题" name="title" rules={[{ required: true }]}>
            <Input placeholder="合同标题" />
          </Form.Item>
          <Form.Item label="金额(元)" name="amount">
            <InputNumber style={{ width: "100%" }} min={0} placeholder="0.00" />
          </Form.Item>
          <Form.Item label="签约日期" name="signedAt">
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Space size="middle" style={{ display: "flex" }}>
            <Form.Item label="生效日期" name="startDate" style={{ flex: 1 }}>
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item label="截止日期" name="endDate" style={{ flex: 1 }}>
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
          </Space>
          <Form.Item label="状态" name="status">
            <Select
              options={Object.entries(CONTRACT_STATUS_META).map(([v, m]) => ({ value: v, label: m.text }))}
            />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

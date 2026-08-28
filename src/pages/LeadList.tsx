/**
 * Desktop 线索管理（业务模块 · 简化版）.
 */
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { EmptyState, StatusTag } from "@lieshoucloud/ui";
import { LEAD_SOURCE_META, LEAD_STATUS_META } from "@lieshoucloud/contract-types/business/lead";
import type { Lead, LeadRequest, LeadStatus } from "@lieshoucloud/contract-types/business/lead";
import { App, Button, Card, Form, Input, Modal, Select, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";

import { createLead, deleteLead, listLeads, updateLead } from "../services/lead";


interface LeadFormValues {
  name: string;
  contactName?: string;
  contactPhone?: string;
  email?: string;
  source?: string;
  remark?: string;
}

export default function LeadList() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<LeadStatus | undefined>(undefined);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<LeadFormValues>();

  const load = async () => {
    setLoading(true);
    try {
      setLeads(await listLeads(keyword || undefined, status));
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ source: "MANUAL" });
    setOpen(true);
  };

  const openEdit = (l: Lead) => {
    setEditing(l);
    form.setFieldsValue({
      name: l.name,
      contactName: l.contactName ?? undefined,
      contactPhone: l.contactPhone ?? undefined,
      email: l.email ?? undefined,
      source: l.source,
      remark: l.remark ?? undefined,
    });
    setOpen(true);
  };

  const submit = async (v: LeadFormValues) => {
    const body: LeadRequest = {
      name: v.name,
      contactName: v.contactName || undefined,
      contactPhone: v.contactPhone || undefined,
      email: v.email || undefined,
      source: v.source as Lead["source"],
      remark: v.remark || undefined,
    };
    try {
      if (editing) {
        await updateLead(editing.id, body);
      } else {
        await createLead(body);
      }
      message.success(editing ? "已保存" : "已创建");
      setOpen(false);
      void load();
    } catch (e) {
      message.error(String(e));
    }
  };

  const onDelete = (l: Lead) => {
    Modal.confirm({
      title: `删除线索 ${l.name}？`,
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteLead(l.id);
        message.success("已删除");
        void load();
      },
    });
  };

  const columns: ColumnsType<Lead> = [
    { title: "线索名称", dataIndex: "name", key: "name" },
    { title: "联系人", dataIndex: "contactName", key: "contactName", render: (v?: string) => v ?? "—" },
    { title: "电话", dataIndex: "contactPhone", key: "contactPhone", render: (v?: string) => v ?? "—" },
    {
      title: "来源",
      dataIndex: "source",
      key: "source",
      width: 90,
      render: (s: Lead["source"]) => LEAD_SOURCE_META[s] ?? s,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (s: LeadStatus) => <StatusTag meta={LEAD_STATUS_META[s]} />,
    },
    { title: "创建时间", dataIndex: "createdAt", key: "createdAt", width: 170 },
    {
      title: "操作",
      key: "action",
      width: 140,
      render: (_, l) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(l)}>
            编辑
          </Button>
          <Button type="link" size="small" danger onClick={() => onDelete(l)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="线索管理"
      extra={
        <Space>
          <Input.Search
            placeholder="搜索名称/联系人"
            allowClear
            style={{ width: 200 }}
            onSearch={(k) => {
              setKeyword(k);
              void load();
            }}
          />
          <Select
            allowClear
            placeholder="状态"
            style={{ width: 110 }}
            value={status}
            onChange={(v) => setStatus(v)}
            options={Object.entries(LEAD_STATUS_META).map(([v, m]) => ({ value: v, label: m.text }))}
          />
          <Button icon={<ReloadOutlined />} onClick={() => void load()}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建线索
          </Button>
        </Space>
      }
    >
      <Table<Lead>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={leads}
        pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
        locale={{ emptyText: <EmptyState description="暂无线索" /> }}
      />
      <Modal
        title={editing ? `编辑线索 ${editing.name}` : "新建线索"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
        width={520}
      >
        <Form<LeadFormValues> form={form} layout="vertical" onFinish={submit} requiredMark={false}>
          <Form.Item label="线索名称" name="name" rules={[{ required: true }]}>
            <Input placeholder="公司/项目名" />
          </Form.Item>
          <Form.Item label="联系人" name="contactName">
            <Input placeholder="姓名" />
          </Form.Item>
          <Form.Item label="电话" name="contactPhone">
            <Input placeholder="13800000000" />
          </Form.Item>
          <Form.Item label="邮箱" name="email">
            <Input placeholder="user@example.com" />
          </Form.Item>
          <Form.Item label="来源" name="source">
            <Select
              options={Object.entries(LEAD_SOURCE_META).map(([v, t]) => ({ value: v, label: t }))}
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

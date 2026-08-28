/**
 * Desktop 租户管理（平台管理 · 简化版）.
 */
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { EmptyState, StatusTag } from "@lieshoucloud/ui";
import { TENANT_STATUS_META } from "@lieshoucloud/contract-types/business/tenant";
import type { Tenant, TenantStatus } from "@lieshoucloud/contract-types/business/tenant";
import { App, Button, Card, Form, Input, Modal, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";

import { createTenant, deleteTenant, listTenants, updateTenant } from "../services/tenant";


interface TenantFormValues {
  name: string;
  code?: string;
  status: TenantStatus;
}

export default function TenantList() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<TenantFormValues>();

  const load = async () => {
    setLoading(true);
    try {
      setTenants(await listTenants());
    } catch {
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: "ACTIVE" });
    setOpen(true);
  };

  const openEdit = (t: Tenant) => {
    setEditing(t);
    form.setFieldsValue({ name: t.name, status: t.status });
    setOpen(true);
  };

  const submit = async (v: TenantFormValues) => {
    try {
      if (editing) {
        await updateTenant(editing.id, { name: v.name, status: v.status });
      } else {
        await createTenant({ name: v.name, code: v.code! });
      }
      message.success(editing ? "已保存" : "已开通");
      setOpen(false);
      void load();
    } catch (e) {
      message.error(String(e));
    }
  };

  const onDelete = (t: Tenant) => {
    Modal.confirm({
      title: `删除租户 ${t.name}？`,
      content: "删除后不可恢复",
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteTenant(t.id);
        message.success("已删除");
        void load();
      },
    });
  };

  const columns: ColumnsType<Tenant> = [
    { title: "租户名", dataIndex: "name", key: "name" },
    { title: "编码", dataIndex: "code", key: "code" },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 90,
      render: (s: TenantStatus) => <StatusTag meta={TENANT_STATUS_META[s]} />,
    },
    {
      title: "版别",
      dataIndex: "edition",
      key: "edition",
      width: 110,
      render: (e?: string) => (e ? <Tag>{e}</Tag> : "—"),
    },
    { title: "创建时间", dataIndex: "createdAt", key: "createdAt", width: 180 },
    {
      title: "操作",
      key: "action",
      width: 140,
      render: (_, t) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(t)}>
            编辑
          </Button>
          <Button type="link" size="small" danger onClick={() => onDelete(t)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="租户管理"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => void load()}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            开通租户
          </Button>
        </Space>
      }
    >
      <Table<Tenant>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={tenants}
        pagination={false}
        locale={{ emptyText: <EmptyState description="暂无租户" /> }}
      />
      <Modal
        title={editing ? `编辑租户 ${editing.name}` : "开通租户"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
        width={460}
      >
        <Form<TenantFormValues> form={form} layout="vertical" onFinish={submit} requiredMark={false}>
          {!editing && (
            <Form.Item label="租户编码" name="code" rules={[{ required: true, message: "请输入编码" }]}>
              <Input placeholder="如:jxlkas" />
            </Form.Item>
          )}
          <Form.Item label="租户名称" name="name" rules={[{ required: true, message: "请输入名称" }]}>
            <Input placeholder="如:凌科安时律师事务所" />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select
              options={Object.entries(TENANT_STATUS_META).map(([v, m]) => ({ value: v, label: m.text }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

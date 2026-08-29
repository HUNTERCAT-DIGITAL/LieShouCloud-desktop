/**
 * Desktop 角色管理（平台管理 · 简化版）.
 * 系统角色只读；自定义角色可增删改。
 */
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { EmptyState, StatusTag } from "@lieshoucloud/ui";
import { ROLE_SCOPE_META } from "@lieshoucloud/contract-types/business/role";
import type { Role, RoleScope } from "@lieshoucloud/contract-types/business/role";
import { App, Button, Card, Form, Input, Modal, Select, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";

import { createRole, deleteRole, listRoles, updateRole } from "../services/role";

const { Text } = Typography;

interface RoleFormValues {
  code: string;
  name: string;
  scope: RoleScope;
  description?: string;
}

export default function RoleList() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [editing, setEditing] = useState<Role | null>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<RoleFormValues>();

  const load = async () => {
    setLoading(true);
    try {
      setRoles(await listRoles());
    } catch {
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ scope: "TENANT" });
    setOpen(true);
  };

  const openEdit = (r: Role) => {
    setEditing(r);
    form.setFieldsValue({ name: r.name, scope: r.scope, description: r.description ?? undefined });
    setOpen(true);
  };

  const submit = async (v: RoleFormValues) => {
    try {
      if (editing) {
        await updateRole(editing.id, { name: v.name, scope: v.scope, description: v.description });
      } else {
        await createRole({ code: v.code, name: v.name, scope: v.scope, description: v.description });
      }
      message.success(editing ? "已保存" : "已创建");
      setOpen(false);
      void load();
    } catch (e) {
      message.error(String(e));
    }
  };

  const onDelete = (r: Role) => {
    Modal.confirm({
      title: `删除角色 ${r.name}？`,
      content: "删除后不可恢复",
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteRole(r.id);
        message.success("已删除");
        void load();
      },
    });
  };

  const columns: ColumnsType<Role> = [
    { title: "角色名", dataIndex: "name", key: "name" },
    { title: "编码", dataIndex: "code", key: "code" },
    {
      title: "作用域",
      dataIndex: "scope",
      key: "scope",
      width: 90,
      render: (s: RoleScope) => <StatusTag meta={ROLE_SCOPE_META[s]} />,
    },
    {
      title: "类型",
      dataIndex: "system",
      key: "system",
      width: 80,
      render: (sys: boolean) => (sys ? <Tag color="orange">系统</Tag> : <Tag>自定义</Tag>),
    },
    { title: "描述", dataIndex: "description", key: "description", render: (v?: string) => v ?? "—" },
    {
      title: "操作",
      key: "action",
      width: 140,
      render: (_, r) =>
        r.system ? (
          <Text type="secondary">只读</Text>
        ) : (
          <Space>
            <Button type="link" size="small" onClick={() => openEdit(r)}>
              编辑
            </Button>
            <Button type="link" size="small" danger onClick={() => onDelete(r)}>
              删除
            </Button>
          </Space>
        ),
    },
  ];

  return (
    <Card
      title="角色管理"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => void load()}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建角色
          </Button>
        </Space>
      }
    >
      <Table<Role>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={roles}
        pagination={false}
        locale={{ emptyText: <EmptyState description="暂无角色" /> }}
      />
      <Modal
        title={editing ? `编辑角色 ${editing.name}` : "新建角色"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
        width={460}
      >
        <Form<RoleFormValues> form={form} layout="vertical" onFinish={submit} requiredMark={false}>
          {!editing && (
            <Form.Item label="编码" name="code" rules={[{ required: true, message: "请输入角色编码" }]}>
              <Input placeholder="如:CUSTOM_ROLE" />
            </Form.Item>
          )}
          <Form.Item label="角色名" name="name" rules={[{ required: true, message: "请输入角色名" }]}>
            <Input placeholder="如:业务专员" />
          </Form.Item>
          <Form.Item label="作用域" name="scope">
            <Select
              options={Object.entries(ROLE_SCOPE_META).map(([v, m]) => ({ value: v, label: m.text }))}
            />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={2} placeholder="可选" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

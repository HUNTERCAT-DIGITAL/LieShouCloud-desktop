/**
 * Desktop 用户管理（平台管理 · 简化版）.
 * 列表 + 新建/编辑 Modal + 删除确认。
 */
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { EmptyState, StatusTag } from "@lieshoucloud/ui";
import { STATUS_META } from "@lieshoucloud/contract-types/business/user";
import type { User } from "@lieshoucloud/contract-types/business/user";
import { App, Button, Card, Form, Input, Modal, Select, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";

import { createUser, deleteUser, listUsers, updateUser } from "../services/user";
import { listRoles } from "../services/role";
import type { Role } from "@lieshoucloud/contract-types/business/role";


interface UserFormValues {
  username?: string;
  displayName: string;
  password?: string;
  email?: string;
  phone?: string;
  status: string;
  roles: string[];
}

export default function UserList() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [editing, setEditing] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<UserFormValues>();

  const load = async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([listUsers(), listRoles()]);
      setUsers(u);
      setRoles(r);
    } catch {
      setUsers([]);
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
    form.setFieldsValue({ status: "ACTIVE", roles: [] });
    setOpen(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    form.setFieldsValue({
      displayName: u.displayName,
      email: u.email ?? undefined,
      phone: u.phone ?? undefined,
      status: u.status,
      roles: u.roles ?? [],
    });
    setOpen(true);
  };

  const submit = async (v: UserFormValues) => {
    try {
      if (editing) {
        await updateUser(editing.id, {
          displayName: v.displayName,
          email: v.email || undefined,
          phone: v.phone || undefined,
          status: v.status as User["status"],
          roles: v.roles,
          password: v.password || undefined,
        });
      } else {
        await createUser({
          username: v.username!,
          displayName: v.displayName,
          password: v.password!,
          email: v.email || undefined,
          phone: v.phone || undefined,
        });
      }
      message.success(editing ? "已保存" : "已创建");
      setOpen(false);
      void load();
    } catch (e) {
      message.error(String(e));
    }
  };

  const onDelete = (u: User) => {
    Modal.confirm({
      title: `删除用户 ${u.username}？`,
      content: "删除后不可恢复",
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteUser(u.id);
        message.success("已删除");
        void load();
      },
    });
  };

  const columns: ColumnsType<User> = [
    { title: "用户名", dataIndex: "username", key: "username" },
    { title: "显示名", dataIndex: "displayName", key: "displayName" },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 90,
      render: (s: User["status"]) => <StatusTag meta={STATUS_META[s]} />,
    },
    { title: "邮箱", dataIndex: "email", key: "email", render: (v?: string) => v ?? "—" },
    { title: "手机", dataIndex: "phone", key: "phone", render: (v?: string) => v ?? "—" },
    {
      title: "操作",
      key: "action",
      width: 140,
      render: (_, u) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(u)}>
            编辑
          </Button>
          <Button type="link" size="small" danger onClick={() => onDelete(u)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="用户管理"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => void load()}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建用户
          </Button>
        </Space>
      }
    >
      <Table<User>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={users}
        pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
        locale={{ emptyText: <EmptyState description="暂无用户" /> }}
      />
      <Modal
        title={editing ? `编辑用户 ${editing.username}` : "新建用户"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
        width={520}
      >
        <Form<UserFormValues> form={form} layout="vertical" onFinish={submit} requiredMark={false}>
          {!editing && (
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: "请输入用户名" }]}
            >
              <Input placeholder="登录名" />
            </Form.Item>
          )}
          <Form.Item label="显示名" name="displayName" rules={[{ required: true }]}>
            <Input placeholder="如:李四" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={editing ? [] : [{ required: true, message: "请输入初始密码" }]}
            extra={editing ? "留空则不修改密码" : undefined}
          >
            <Input.Password placeholder={editing ? "留空不修改" : "初始密码"} />
          </Form.Item>
          <Form.Item label="邮箱" name="email">
            <Input placeholder="user@example.com" />
          </Form.Item>
          <Form.Item label="手机" name="phone">
            <Input placeholder="13800000000" />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select
              options={Object.entries(STATUS_META).map(([v, m]) => ({ value: v, label: m.text }))}
            />
          </Form.Item>
          <Form.Item label="角色" name="roles">
            <Select
              mode="multiple"
              placeholder="选择角色"
              options={roles.map((r) => ({ value: r.code, label: r.name }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

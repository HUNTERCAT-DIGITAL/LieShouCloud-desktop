/**
 * Desktop 联系人管理（业务模块 · 简化版）.
 */
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { EmptyState } from "@lieshoucloud/ui";
import type { Contact, CreateContactRequest } from "@lieshoucloud/contract-types/business/contact";
import { App, Button, Card, Form, Input, Modal, Select, Space, Switch, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";

import { createContact, deleteContact, listContacts, updateContact } from "../services/contact";
import { listCustomers } from "../services/customer";

const { Text } = Typography;

interface ContactFormValues {
  customerId: number;
  name: string;
  phone?: string;
  email?: string;
  position?: string;
  primary?: boolean;
  remark?: string;
}

export default function ContactList() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([]);
  const [keyword, setKeyword] = useState("");
  const [editing, setEditing] = useState<Contact | null>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<ContactFormValues>();

  const load = async () => {
    setLoading(true);
    try {
      const [c, cust] = await Promise.all([listContacts(keyword || undefined), listCustomers()]);
      setContacts(c);
      setCustomers(cust.map((x) => ({ id: x.id, name: x.name })));
    } catch {
      setContacts([]);
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
    form.setFieldsValue({ primary: false });
    setOpen(true);
  };

  const openEdit = (c: Contact) => {
    setEditing(c);
    form.setFieldsValue({
      customerId: c.customerId,
      name: c.name,
      phone: c.phone ?? undefined,
      email: c.email ?? undefined,
      position: c.position ?? undefined,
      primary: c.primary,
      remark: c.remark ?? undefined,
    });
    setOpen(true);
  };

  const submit = async (v: ContactFormValues) => {
    const body: CreateContactRequest = {
      customerId: v.customerId,
      name: v.name,
      phone: v.phone || undefined,
      email: v.email || undefined,
      position: v.position || undefined,
      primary: v.primary,
      remark: v.remark || undefined,
    };
    try {
      if (editing) await updateContact(editing.id, body);
      else await createContact(body);
      message.success(editing ? "已保存" : "已创建");
      setOpen(false);
      void load();
    } catch (e) {
      message.error(String(e));
    }
  };

  const onDelete = (c: Contact) => {
    Modal.confirm({
      title: `删除联系人 ${c.name}？`,
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteContact(c.id);
        message.success("已删除");
        void load();
      },
    });
  };

  const columns: ColumnsType<Contact> = [
    { title: "姓名", dataIndex: "name", key: "name" },
    { title: "客户 ID", dataIndex: "customerId", key: "customerId", width: 90 },
    { title: "电话", dataIndex: "phone", key: "phone", render: (v?: string) => v ?? "—" },
    { title: "邮箱", dataIndex: "email", key: "email", render: (v?: string) => v ?? "—" },
    { title: "职位", dataIndex: "position", key: "position", render: (v?: string) => v ?? "—" },
    {
      title: "主联系人",
      dataIndex: "primary",
      key: "primary",
      width: 100,
      render: (p: boolean) => (p ? <Tag color="blue">主联系人</Tag> : <Text type="secondary">—</Text>),
    },
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
      title="联系人管理"
      extra={
        <Space>
          <Input.Search
            placeholder="搜索姓名/电话"
            allowClear
            style={{ width: 200 }}
            onSearch={(k) => {
              setKeyword(k);
              void load();
            }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => void load()}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建联系人
          </Button>
        </Space>
      }
    >
      <Table<Contact>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={contacts}
        pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
        locale={{ emptyText: <EmptyState description="暂无联系人" /> }}
      />
      <Modal
        title={editing ? `编辑联系人 ${editing.name}` : "新建联系人"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
        width={520}
      >
        <Form<ContactFormValues> form={form} layout="vertical" onFinish={submit} requiredMark={false}>
          <Form.Item label="所属客户" name="customerId" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="选择客户"
              options={customers.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item label="姓名" name="name" rules={[{ required: true }]}>
            <Input placeholder="姓名" />
          </Form.Item>
          <Form.Item label="电话" name="phone">
            <Input placeholder="13800000000" />
          </Form.Item>
          <Form.Item label="邮箱" name="email">
            <Input placeholder="user@example.com" />
          </Form.Item>
          <Form.Item label="职位" name="position">
            <Input placeholder="如:采购经理" />
          </Form.Item>
          <Form.Item label="主联系人" name="primary" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

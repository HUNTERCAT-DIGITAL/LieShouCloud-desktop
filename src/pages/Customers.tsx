/**
 * Desktop 客户列表（业务模块 · 客户 CRUD）.
 *
 * 复用 ui 包 StatusTag + EmptyState;简化版 antd Table。
 */
import { PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { StatusTag, EmptyState } from "@lieshoucloud/ui";
import { App, Button, Form, Input, Modal, Select, Space, Table, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  STATUS_META,
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
  type Customer,
  type CustomerStatus,
} from "../services/customer";

const { Text } = Typography;

const STATUS_OPTIONS = (Object.keys(STATUS_META) as CustomerStatus[]).map((s) => ({
  label: STATUS_META[s].text,
  value: s,
}));

interface CustomerFormValues {
  name: string;
  contactName?: string;
  contactPhone?: string;
  email?: string;
  address?: string;
  status: CustomerStatus;
  remark?: string;
}

export default function Customers() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Customer[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<CustomerStatus | undefined>(undefined);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<CustomerFormValues>();

  const load = async () => {
    setLoading(true);
    try {
      const list = await listCustomers(keyword || undefined, status);
      setData(list);
    } catch {
      setData([]);
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
    form.setFieldsValue({ status: "NEW" });
    setOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    form.setFieldsValue({
      name: c.name,
      contactName: c.contactName ?? undefined,
      contactPhone: c.contactPhone ?? undefined,
      email: c.email ?? undefined,
      address: c.address ?? undefined,
      status: c.status,
      remark: c.remark ?? undefined,
    });
    setOpen(true);
  };

  const submit = async (v: CustomerFormValues) => {
    const body = {
      name: v.name,
      contactName: v.contactName || undefined,
      contactPhone: v.contactPhone || undefined,
      email: v.email || undefined,
      address: v.address || undefined,
      status: v.status,
      remark: v.remark || undefined,
    };
    try {
      if (editing) await updateCustomer(editing.id, body);
      else await createCustomer(body);
      message.success(editing ? "已保存" : "已创建");
      setOpen(false);
      void load();
    } catch (e) {
      message.error(String(e));
    }
  };

  const onDelete = (c: Customer) => {
    Modal.confirm({
      title: `删除客户 ${c.name}？`,
      content: "删除后不可恢复",
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteCustomer(c.id);
        message.success("已删除");
        void load();
      },
    });
  };

  return (
    <div style={{ padding: 8 }}>
      <Space style={{ marginBottom: 12 }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="按关键字搜索"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={() => void load()}
          allowClear
          style={{ width: 240 }}
        />
        <Select
          placeholder="状态"
          value={status}
          onChange={setStatus}
          options={[{ value: undefined as unknown as CustomerStatus, label: "全部" }, ...STATUS_OPTIONS]}
          allowClear
          style={{ width: 160 }}
        />
        <Button icon={<ReloadOutlined />} onClick={() => void load()}>
          刷新
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新建客户
        </Button>
      </Space>
      <Table<Customer>
        rowKey="id"
        dataSource={data}
        loading={loading}
        locale={{
          emptyText: <EmptyState description="暂无客户" />,
        }}
        onRow={(row) => ({
          onClick: () => navigate(`/customers/${row.id}`),
          style: { cursor: "pointer" },
        })}
        pagination={{ pageSize: 20 }}
        columns={[
          { title: "ID", dataIndex: "id", width: 64 },
          { title: "客户名称", dataIndex: "name" },
          {
            title: "状态",
            dataIndex: "status",
            width: 100,
            render: (_, row) => <StatusTag meta={STATUS_META[row.status]} />,
          },
          { title: "联系人", dataIndex: "contactName", render: (v) => v ?? "—" },
          { title: "电话", dataIndex: "contactPhone", render: (v) => v ?? "—" },
          {
            title: "创建时间",
            dataIndex: "createdAt",
            width: 160,
            render: (v) => (
              <Text type="secondary" style={{ fontSize: 12 }}>
                <Tag>{v}</Tag>
              </Text>
            ),
          },
          {
            title: "操作",
            key: "action",
            width: 140,
            render: (_, row) => (
              <Space onClick={(e) => e.stopPropagation()}>
                <Button type="link" size="small" onClick={() => openEdit(row)}>
                  编辑
                </Button>
                <Button type="link" size="small" danger onClick={() => onDelete(row)}>
                  删除
                </Button>
              </Space>
            ),
          },
        ]}
      />
      <Modal
        title={editing ? `编辑客户 ${editing.name}` : "新建客户"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
        width={520}
      >
        <Form<CustomerFormValues> form={form} layout="vertical" onFinish={submit} requiredMark={false}>
          <Form.Item label="客户名称" name="name" rules={[{ required: true, message: "请输入客户名称" }]}>
            <Input placeholder="公司/机构名" />
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
          <Form.Item label="地址" name="address">
            <Input placeholder="地址(可选)" />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

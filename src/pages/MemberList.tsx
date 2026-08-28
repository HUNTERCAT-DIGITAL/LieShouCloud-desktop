/**
 * Desktop 会员管理（业务模块 · 简化版）.
 */
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { EmptyState, StatusTag } from "@lieshoucloud/ui";
import { MEMBER_LEVEL_META, MEMBER_STATUS_META } from "@lieshoucloud/contract-types/business/member";
import type { CreateMemberRequest, Member, MemberLevel } from "@lieshoucloud/contract-types/business/member";
import { App, Button, Card, Form, Input, InputNumber, Modal, Select, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";

import { createMember, deleteMember, listMembers, updateMember } from "../services/member";
import { listCustomers } from "../services/customer";

interface MemberFormValues {
  customerId: number;
  memberNo: string;
  level: MemberLevel;
  points?: number;
  balance?: number;
  expiresAt?: string;
  status: string;
  remark?: string;
}

export default function MemberList() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([]);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [editing, setEditing] = useState<Member | null>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<MemberFormValues>();

  const load = async () => {
    setLoading(true);
    try {
      const [m, cust] = await Promise.all([listMembers(status as Member["status"] | undefined), listCustomers()]);
      setMembers(m);
      setCustomers(cust.map((x) => ({ id: x.id, name: x.name })));
    } catch {
      setMembers([]);
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
    form.setFieldsValue({ level: "NORMAL", status: "ACTIVE", points: 0, balance: 0 });
    setOpen(true);
  };

  const openEdit = (m: Member) => {
    setEditing(m);
    form.setFieldsValue({
      customerId: m.customerId,
      memberNo: m.memberNo,
      level: m.level,
      points: m.points,
      balance: m.balance,
      expiresAt: m.expiresAt ?? undefined,
      status: m.status,
      remark: m.remark ?? undefined,
    });
    setOpen(true);
  };

  const submit = async (v: MemberFormValues) => {
    const body: CreateMemberRequest = {
      customerId: v.customerId,
      memberNo: v.memberNo,
      level: v.level,
      points: v.points,
      balance: v.balance,
      expiresAt: v.expiresAt || undefined,
      status: v.status as Member["status"],
      remark: v.remark || undefined,
    };
    try {
      if (editing) await updateMember(editing.id, body);
      else await createMember(body);
      message.success(editing ? "已保存" : "已创建");
      setOpen(false);
      void load();
    } catch (e) {
      message.error(String(e));
    }
  };

  const onDelete = (m: Member) => {
    Modal.confirm({
      title: `删除会员 ${m.memberNo}？`,
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteMember(m.id);
        message.success("已删除");
        void load();
      },
    });
  };

  const columns: ColumnsType<Member> = [
    { title: "会员号", dataIndex: "memberNo", key: "memberNo" },
    { title: "客户 ID", dataIndex: "customerId", key: "customerId", width: 90 },
    {
      title: "等级",
      dataIndex: "level",
      key: "level",
      width: 90,
      render: (l: MemberLevel) => <StatusTag meta={MEMBER_LEVEL_META[l]} />,
    },
    { title: "积分", dataIndex: "points", key: "points", width: 80 },
    {
      title: "余额(元)",
      dataIndex: "balance",
      key: "balance",
      width: 110,
      render: (v: number) => `¥${v.toLocaleString()}`,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 90,
      render: (s: Member["status"]) => <StatusTag meta={MEMBER_STATUS_META[s]} />,
    },
    { title: "有效期至", dataIndex: "expiresAt", key: "expiresAt", width: 120, render: (v?: string) => v ?? "长期" },
    {
      title: "操作",
      key: "action",
      width: 140,
      render: (_, m) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(m)}>
            编辑
          </Button>
          <Button type="link" size="small" danger onClick={() => onDelete(m)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="会员管理"
      extra={
        <Space>
          <Select
            allowClear
            placeholder="状态"
            style={{ width: 110 }}
            value={status}
            onChange={(v) => setStatus(v)}
            options={Object.entries(MEMBER_STATUS_META).map(([v, m]) => ({ value: v, label: m.text }))}
          />
          <Button icon={<ReloadOutlined />} onClick={() => void load()}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建会员
          </Button>
        </Space>
      }
    >
      <Table<Member>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={members}
        pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
        locale={{ emptyText: <EmptyState description="暂无会员" /> }}
      />
      <Modal
        title={editing ? `编辑会员 ${editing.memberNo}` : "新建会员"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
        width={520}
      >
        <Form<MemberFormValues> form={form} layout="vertical" onFinish={submit} requiredMark={false}>
          <Form.Item label="所属客户" name="customerId" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="选择客户"
              options={customers.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item label="会员号" name="memberNo" rules={[{ required: true }]}>
            <Input placeholder="如:M20260001" />
          </Form.Item>
          <Form.Item label="等级" name="level">
            <Select
              options={Object.entries(MEMBER_LEVEL_META).map(([v, m]) => ({ value: v, label: m.text }))}
            />
          </Form.Item>
          <Space size="middle" style={{ display: "flex" }}>
            <Form.Item label="积分" name="points" style={{ flex: 1 }}>
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
            <Form.Item label="余额(元)" name="balance" style={{ flex: 1 }}>
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Space>
          <Form.Item label="有效期至" name="expiresAt">
            <Input placeholder="YYYY-MM-DD(留空=长期)" />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select
              options={Object.entries(MEMBER_STATUS_META).map(([v, m]) => ({ value: v, label: m.text }))}
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

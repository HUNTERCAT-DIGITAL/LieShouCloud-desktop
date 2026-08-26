/**
 * Desktop 审批流页（ADR-0032 · 多端接入）.
 * 三个 Tab（待我审批/我发起的/全部）+ 发起审批 + 通过/驳回/撤销。
 */
import { CheckOutlined, CloseOutlined, PlusOutlined, ReloadOutlined, StopOutlined } from "@ant-design/icons";
import { EmptyState, StatusTag } from "@lieshoucloud/ui";
import { App, Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tabs, Typography } from "antd";
import { useEffect, useState } from "react";

import {
  APPROVAL_STATUS_META,
  APPROVAL_TYPE_META,
  approveApproval,
  cancelApproval,
  createApproval,
  getApprovalCounts,
  listApprovals,
  rejectApproval,
  type ApprovalRequest,
  type ApprovalType,
} from "../services/approval";
import { listUsers, type UserOption } from "../services/user";
import { useAuthStore } from "../stores/auth";

const { Text } = Typography;

type TabKey = "inbox" | "mine" | "all";

export default function Approval() {
  const { message: messageApi, modal: modalApi } = App.useApp();
  const currentUser = useAuthStore((s) => s.user);
  const userId = currentUser?.userId;

  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<TabKey>("inbox");
  const [rows, setRows] = useState<ApprovalRequest[]>([]);
  const [counts, setCounts] = useState({ inbox: 0, mine: 0 });
  const [createOpen, setCreateOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<ApprovalRequest | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [approvers, setApprovers] = useState<UserOption[]>([]);
  const [form] = Form.useForm();

  // 阶段 2 · 审批人下拉（ADR-0032）：租户用户列表
  useEffect(() => {
    void listUsers()
      .then(setApprovers)
      .catch(() => setApprovers([]));
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [list, c] = await Promise.all([listApprovals({ role: tab }), getApprovalCounts()]);
      setRows(list);
      setCounts(c);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const onCreate = async (values: {
    type: ApprovalType;
    title: string;
    amount?: number;
    detail?: string;
    approverId: number;
  }) => {
    try {
      await createApproval({
        type: values.type,
        title: values.title.trim(),
        amount: values.amount ? Number(values.amount) : undefined,
        detail: values.detail ? values.detail.trim() : undefined,
        approverId: Number(values.approverId),
      });
      messageApi.success("已发起审批");
      setCreateOpen(false);
      form.resetFields();
      void load();
    } catch (e) {
      messageApi.error(String(e));
    }
  };

  const onApprove = (row: ApprovalRequest) => {
    modalApi.confirm({
      title: `通过审批 #${row.id}`,
      content: row.title,
      okText: "通过",
      cancelText: "取消",
      onOk: async () => {
        try {
          await approveApproval(row.id);
          messageApi.success("已通过");
          void load();
        } catch (e) {
          messageApi.error(String(e));
        }
      },
    });
  };

  const onRejectConfirm = async () => {
    if (!rejectTarget) return;
    if (!rejectComment.trim()) {
      messageApi.warning("请填写驳回意见");
      return;
    }
    try {
      await rejectApproval(rejectTarget.id, rejectComment.trim());
      messageApi.success("已驳回");
      setRejectTarget(null);
      setRejectComment("");
      void load();
    } catch (e) {
      messageApi.error(String(e));
    }
  };

  const onCancel = async (id: number) => {
    try {
      await cancelApproval(id);
      messageApi.success("已撤销");
      void load();
    } catch (e) {
      messageApi.error(String(e));
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 60 },
    {
      title: "类型",
      dataIndex: "type",
      width: 100,
      render: (v: ApprovalType) => <StatusTag meta={APPROVAL_TYPE_META[v]} />,
    },
    { title: "标题", dataIndex: "title", ellipsis: true },
    {
      title: "金额",
      dataIndex: "amount",
      width: 120,
      render: (v: number | null | undefined) => (v !== null && v !== undefined ? `¥ ${Number(v).toFixed(2)}` : "—"),
    },
    { title: "发起人", dataIndex: "requesterId", width: 80 },
    { title: "审批人", dataIndex: "approverId", width: 80 },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (v: ApprovalRequest["status"]) => <StatusTag meta={APPROVAL_STATUS_META[v]} />,
    },
    {
      title: "意见",
      dataIndex: "comment",
      width: 140,
      ellipsis: true,
      render: (v: string | null | undefined) => v ?? "—",
    },
    {
      title: "提交时间",
      dataIndex: "createdAt",
      width: 170,
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      width: 170,
      render: (_: unknown, row: ApprovalRequest) => {
        const isApprover = userId !== null && userId !== undefined && row.approverId === userId;
        const isRequester = userId !== null && userId !== undefined && row.requesterId === userId;
        if (row.status !== "PENDING") {
          return <Text type="secondary">已处理</Text>;
        }
        return (
          <Space size={4}>
            {isApprover && (
              <Button
                size="small"
                type="link"
                icon={<CheckOutlined />}
                style={{ color: "#52c41a" }}
                onClick={() => onApprove(row)}
              >
                通过
              </Button>
            )}
            {isApprover && (
              <Button
                size="small"
                type="link"
                danger
                icon={<CloseOutlined />}
                onClick={() => {
                  setRejectComment("");
                  setRejectTarget(row);
                }}
              >
                驳回
              </Button>
            )}
            {isRequester && (
              <Popconfirm
                title="确定撤销这条审批？"
                okText="撤销"
                cancelText="取消"
                onConfirm={() => void onCancel(row.id)}
              >
                <Button size="small" type="link" icon={<StopOutlined />}>
                  撤销
                </Button>
              </Popconfirm>
            )}
            {!isApprover && !isRequester && <Text type="secondary">无权操作</Text>}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ReloadOutlined />} onClick={() => void load()}>
          刷新
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          发起审批
        </Button>
      </Space>

      <Tabs
        activeKey={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={[
          { key: "inbox", label: `待我审批${counts.inbox > 0 ? ` (${counts.inbox})` : ""}` },
          { key: "mine", label: "我发起的" },
          { key: "all", label: "全部" },
        ]}
        style={{ marginBottom: 12 }}
      />

      <Table<ApprovalRequest>
        rowKey="id"
        dataSource={rows}
        loading={loading}
        locale={{ emptyText: <EmptyState description="暂无审批请求" /> }}
        pagination={{ pageSize: 20 }}
        columns={columns}
      />

      {/* 驳回意见 */}
      <Modal
        title={rejectTarget ? `驳回审批 #${rejectTarget.id}` : ""}
        open={rejectTarget !== null}
        onOk={() => void onRejectConfirm()}
        onCancel={() => setRejectTarget(null)}
        okText="驳回"
        okButtonProps={{ danger: true }}
        cancelText="取消"
        width={440}
        destroyOnClose
      >
        <Typography.Paragraph style={{ marginBottom: 8 }}>{rejectTarget?.title}</Typography.Paragraph>
        <Input.TextArea
          value={rejectComment}
          onChange={(e) => setRejectComment(e.target.value)}
          placeholder="必填：说明驳回原因"
          rows={3}
          maxLength={500}
        />
      </Modal>

      {/* 发起审批 */}
      <Modal
        open={createOpen}
        title="发起审批"
        onCancel={() => setCreateOpen(false)}
        footer={null}
        destroyOnClose
        width={460}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onCreate}
          style={{ marginTop: 12 }}
          initialValues={{ type: "EXPENSE" }}
        >
          <Form.Item name="type" label="类型" rules={[{ required: true, message: "请选择类型" }]}>
            <Select
              options={(Object.keys(APPROVAL_TYPE_META) as ApprovalType[]).map((t) => ({
                label: APPROVAL_TYPE_META[t].text,
                value: t,
              }))}
            />
          </Form.Item>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: "请输入标题" }]}>
            <Input placeholder="如：报销 8 月差旅费" />
          </Form.Item>
          <Form.Item name="amount" label="金额（元）">
            <InputNumber style={{ width: "100%" }} min={0.01} step={0.01} />
          </Form.Item>
          <Form.Item name="detail" label="详情">
            <Input.TextArea rows={2} placeholder="选填，补充说明" />
          </Form.Item>
          <Form.Item name="approverId" label="审批人" rules={[{ required: true, message: "请选择审批人" }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="选择审批人（租户用户）"
              options={approvers.map((u) => ({
                label: `${u.displayName || u.username} (#${u.id})`,
                value: u.id,
              }))}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            提交
          </Button>
        </Form>
      </Modal>
    </div>
  );
}

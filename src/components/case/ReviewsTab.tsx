/**
 * 案件评审 Tab（智法云枢 · 办案产物评审闭环:发起/裁决）.
 * 数据源:@lieshoucloud/core-web reviews.api(业务逻辑唯一源)。
 */
import { PlusOutlined } from "@ant-design/icons";
import { EmptyState } from "@lieshoucloud/ui";
import { useCallback, useEffect, useState } from "react";
import { createReview, decideReview, listCaseReviews } from "@lieshoucloud/core-web";
import type {
  LegalReview,
  ReviewArtifactType,
  ReviewRequest,
  ReviewStatus,
} from "@lieshoucloud/contract-types/business/legal";
import { App, Button, Card, Form, Input, InputNumber, Modal, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";

const ARTIFACT_META: Record<ReviewArtifactType, { text: string; color: string }> = {
  DOCUMENT: { text: "文书", color: "blue" },
  STRATEGY: { text: "策略", color: "purple" },
  PLAN: { text: "计划", color: "cyan" },
  OUTCOME: { text: "结果", color: "green" },
};

const STATUS_META: Record<ReviewStatus, { text: string; color: string }> = {
  PENDING: { text: "待审", color: "orange" },
  APPROVED: { text: "已通过", color: "success" },
  REJECTED: { text: "已驳回", color: "red" },
};

export default function ReviewsTab({ caseId }: { caseId: number }) {
  const { message } = App.useApp();
  const [reviews, setReviews] = useState<LegalReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<ReviewRequest>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReviews(await listCaseReviews(caseId));
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    const values = await form.validateFields();
    await createReview({ ...values, caseId });
    message.success("评审已发起");
    setOpen(false);
    form.resetFields();
    void load();
  };

  const decide = async (id: number, status: "APPROVED" | "REJECTED") => {
    await decideReview(id, { status });
    message.success(status === "APPROVED" ? "已通过" : "已驳回");
    void load();
  };

  const columns: ColumnsType<LegalReview> = [
    { title: "产物类型", dataIndex: "artifactType", width: 90, render: (v: ReviewArtifactType) => <Tag color={ARTIFACT_META[v]?.color}>{ARTIFACT_META[v]?.text ?? v}</Tag> },
    { title: "产物", dataIndex: "artifactRef", ellipsis: true },
    { title: "状态", dataIndex: "status", width: 90, render: (v: ReviewStatus) => <Tag color={STATUS_META[v]?.color}>{STATUS_META[v]?.text ?? v}</Tag> },
    { title: "操作", width: 150, render: (_, r) => r.status === "PENDING" ? (
        <Space size={4}>
          <Button size="small" type="primary" onClick={() => void decide(r.id, "APPROVED")}>通过</Button>
          <Button size="small" danger onClick={() => void decide(r.id, "REJECTED")}>驳回</Button>
        </Space>
      ) : null },
  ];

  return (
    <>
      <Card
        title={`评审 (${reviews.length})`}
        extra={<Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setOpen(true); }}>发起评审</Button>}
        style={{ marginBottom: 12 }}
      >
        <Table<LegalReview> rowKey="id" columns={columns} dataSource={reviews} loading={loading} pagination={false} locale={{ emptyText: <EmptyState description="暂无评审" /> }} />
      </Card>
      <Modal title="发起评审" open={open} onOk={() => void save()} onCancel={() => setOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="artifactType" label="产物类型" rules={[{ required: true }]}>
            <Select options={Object.entries(ARTIFACT_META).map(([v, m]) => ({ value: v, label: m.text }))} />
          </Form.Item>
          <Form.Item name="artifactRef" label="产物引用" rules={[{ required: true }]}>
            <Input placeholder="文书/策略/计划引用" />
          </Form.Item>
          <Form.Item name="reviewerUserId" label="评审人">
            <InputNumber placeholder="用户 ID" style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}


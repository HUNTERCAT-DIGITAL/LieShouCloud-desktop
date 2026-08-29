/**
 * 知识库页（智法云枢 · 知识卡:列表/新建/状态流转/推荐/贡献榜）.
 * 数据源:@lieshoucloud/core-web knowledge.api。
 */
import { PlusOutlined } from "@ant-design/icons";
import { EmptyState } from "@lieshoucloud/ui";
import { useCallback, useEffect, useState } from "react";
import {
  createKnowledgeCard,
  deleteKnowledgeCard,
  getKnowledgeSummary,
  listContribution,
  listKnowledgeCards,
  listRecommendedCards,
  updateKnowledgeCardStatus,
} from "@lieshoucloud/core-web";
import type { KnowledgeCard, KnowledgeCardRequest, KnowledgeCardStatus, KnowledgeCardType } from "@lieshoucloud/contract-types/business/legal";
import { App, Button, Card, Col, Form, Input, Modal, Popconfirm, Row, Segmented, Select, Space, Statistic, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";

const TYPE_META: Record<KnowledgeCardType, { text: string; color: string }> = {
  RULE: { text: "规则卡", color: "blue" },
  EVIDENCE: { text: "证据卡", color: "green" },
  LESSON: { text: "教训卡", color: "red" },
  DRAFTING: { text: "起草卡", color: "purple" },
  COMMUNICATION: { text: "沟通卡", color: "cyan" },
  DELIVERY: { text: "送达卡", color: "orange" },
  STRATEGY: { text: "策略卡", color: "geekblue" },
  EXPERIENCE: { text: "经验卡", color: "magenta" },
};

const STATUS_META: Record<KnowledgeCardStatus, { text: string; color: string }> = {
  DRAFT: { text: "草稿", color: "default" },
  PENDING_REVIEW: { text: "待评审", color: "orange" },
  REVIEWED: { text: "已评审", color: "blue" },
  PUBLISHED: { text: "已发布", color: "success" },
  REJECTED: { text: "已拒绝", color: "red" },
};

const STATUS_FLOW: KnowledgeCardStatus[] = ["DRAFT", "PENDING_REVIEW", "REVIEWED", "PUBLISHED"];

export default function KnowledgeBase() {
  const { message } = App.useApp();
  const [tab, setTab] = useState<"all" | "recommended" | "contribution">("all");
  const [cards, setCards] = useState<KnowledgeCard[]>([]);
  const [summary, setSummary] = useState<{ total: number; published: number; pending: number }>({ total: 0, published: 0, pending: 0 });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<KnowledgeCardRequest>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, list] = await Promise.all([getKnowledgeSummary(), listKnowledgeCards()]);
      setCards(list);
      setSummary({ total: s.total ?? list.length, published: s.total - s.candidateCount, pending: s.reviewPendingCount ?? 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTab = useCallback(async (t: typeof tab) => {
    setLoading(true);
    try {
      if (t === "recommended") setCards(await listRecommendedCards());
      else if (t === "contribution") setCards(await listContribution());
      else {
        const [, list] = await Promise.all([getKnowledgeSummary(), listKnowledgeCards()]);
        setCards(list);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const switchTab = (t: typeof tab) => {
    setTab(t);
    void loadTab(t);
  };

  const save = async () => {
    const values = await form.validateFields();
    await createKnowledgeCard(values);
    message.success("知识卡已创建");
    setOpen(false);
    form.resetFields();
    void load();
  };

  const advance = async (id: number, status: KnowledgeCardStatus) => {
    await updateKnowledgeCardStatus(id, status);
    message.success("状态已更新");
    void load();
  };

  const doDelete = async (id: number) => {
    await deleteKnowledgeCard(id);
    message.success("已删除");
    void load();
  };

  const columns: ColumnsType<KnowledgeCard> = [
    { title: "类型", dataIndex: "cardType", width: 110, render: (v: KnowledgeCardType) => <Tag color={TYPE_META[v]?.color}>{TYPE_META[v]?.text ?? v}</Tag> },
    { title: "标题", dataIndex: "title", ellipsis: true },
    { title: "状态", dataIndex: "status", width: 90, render: (v: KnowledgeCardStatus) => <Tag color={STATUS_META[v]?.color}>{STATUS_META[v]?.text ?? v}</Tag> },
    { title: "复用", dataIndex: "usageCount", width: 70 },
    { title: "操作", width: 170, render: (_, r) => {
        const idx = STATUS_FLOW.indexOf(r.status);
        const next = STATUS_FLOW[idx + 1];
        return (
          <Space size={4}>
            {next && <Button size="small" onClick={() => void advance(r.id, next)}>流转</Button>}
            <Popconfirm title="删除该知识卡?" onConfirm={() => void doDelete(r.id)}>
              <Button size="small" danger>删除</Button>
            </Popconfirm>
          </Space>
        );
      } },
  ];

  return (
    <>
      <Row gutter={12} style={{ marginBottom: 12 }}>
        <Col span={8}><Card><Statistic title="知识卡总数" value={summary.total} /></Card></Col>
        <Col span={8}><Card><Statistic title="已发布" value={summary.published} valueStyle={{ color: "#52c41a" }} /></Card></Col>
        <Col span={8}><Card><Statistic title="待评审" value={summary.pending} valueStyle={{ color: "#fa8c16" }} /></Card></Col>
      </Row>
      <Card
        title="知识库"
        extra={
          <Space>
            <Segmented<typeof tab>
              value={tab}
              onChange={(v) => switchTab(v)}
              options={[
                { value: "all", label: "全部" },
                { value: "recommended", label: "推荐给我的" },
                { value: "contribution", label: "贡献榜" },
              ]}
            />
            <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setOpen(true); }}>新建知识卡</Button>
          </Space>
        }
      >
        <Table<KnowledgeCard> rowKey="id" columns={columns} dataSource={cards} loading={loading} pagination={false} locale={{ emptyText: <EmptyState description="暂无知识卡" /> }} />
      </Card>
      <Modal title="新建知识卡" open={open} onOk={() => void save()} onCancel={() => setOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical" initialValues={{ cardType: "STRATEGY_CARD" }}>
          <Form.Item name="cardType" label="类型" rules={[{ required: true }]}>
            <Select options={Object.entries(TYPE_META).map(([v, m]) => ({ value: v, label: m.text }))} />
          </Form.Item>
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input placeholder="知识卡标题" />
          </Form.Item>
          <Form.Item name="content" label="内容">
            <Input.TextArea rows={5} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

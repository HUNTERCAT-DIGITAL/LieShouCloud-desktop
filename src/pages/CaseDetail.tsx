/**
 * 智法云枢 · 案件详情（桌面端核心页 · 2026-09）.
 *
 * 八阶段进度（CASE_STAGE_FLOW）+ 阶段进度 + 时间线（CaseEvent）+ 基本信息。
 * 只前进不越级：当前 stage 由后端权威，前端按 stageIndex 渲染 Steps。
 */
import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import { EmptyState, StatusTag } from "@lieshoucloud/ui";
import {
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Modal,
  Progress,
  Row,
  Select,
  Skeleton,
  Space,
  Steps,
  Tag,
  Timeline,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  CASE_PRIORITY_META,
  CASE_STAGE_FLOW,
  CASE_STAGE_META,
  CASE_STATUS_META,
  CASE_TYPE_META,
  EVENT_TYPE_META,
  stageIndex,
  type CaseEvent,
  type LegalCase,
} from "@lieshoucloud/contract-types/business/legal";
import { addCaseEvent, getCase, listCaseEvents } from "../services/case";

const { Text, Title } = Typography;

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<LegalCase | null>(null);
  const [events, setEvents] = useState<CaseEvent[]>([]);
  const [eventOpen, setEventOpen] = useState(false);
  const [eventForm] = Form.useForm();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    void Promise.all([getCase(Number(id)), listCaseEvents(Number(id))])
      .then(([c, ev]) => {
        if (cancelled) return;
        setDetail(c);
        setEvents(ev);
      })
      .catch(() => {
        if (cancelled) return;
        setDetail(null);
        setEvents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} style={{ padding: 16 }} />;
  if (!detail) return <EmptyState description="案件不存在或无权查看" />;

  const loadEvents = async () => {
    try {
      setEvents(await listCaseEvents(Number(id)));
    } catch {
      setEvents([]);
    }
  };

  const submitEvent = async (v: { eventType: string; occurredAt: string; title: string; detail?: string }) => {
    try {
      await addCaseEvent(Number(id), {
        eventType: v.eventType as CaseEvent["eventType"],
        occurredAt: v.occurredAt,
        title: v.title,
        detail: v.detail || undefined,
      });
      message.success("时间线已更新");
      setEventOpen(false);
      eventForm.resetFields();
      void loadEvents();
    } catch (e) {
      message.error(String(e));
    }
  };

  const stageIdx = stageIndex(detail.stage);
  const stageMeta = CASE_STAGE_META[detail.stage];
  const statusMeta = CASE_STATUS_META[detail.status];
  const priorityMeta = CASE_PRIORITY_META[detail.priority];

  return (
    <div style={{ padding: 16 }}>
      <Space style={{ marginBottom: 12 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate("/cases")}>
          返回案件列表
        </Button>
      </Space>

      <Card style={{ marginBottom: 12 }}>
        <Space direction="vertical" size={4} style={{ width: "100%" }}>
          <Title level={4} style={{ margin: 0 }}>
            {detail.title}
          </Title>
          <Space wrap>
            <Text type="secondary">{detail.caseNo}</Text>
            {detail.matterNo && <Tag>{detail.matterNo}</Tag>}
            <Tag color={CASE_TYPE_META[detail.caseType] ? undefined : undefined}>
              {CASE_TYPE_META[detail.caseType] ?? detail.caseType}
            </Tag>
            {stageMeta && <Tag color={stageMeta.color}>{stageMeta.text}</Tag>}
            {statusMeta && <StatusTag meta={statusMeta} />}
            {priorityMeta && <Tag color={priorityMeta.color}>{priorityMeta.text}</Tag>}
            {detail.dataClassification && <Tag color="purple">密级 {detail.dataClassification}</Tag>}
          </Space>
        </Space>
      </Card>

      <Card title="八阶段办理主线" style={{ marginBottom: 12 }}>
        <Steps
          current={stageIdx}
          size="small"
          items={CASE_STAGE_FLOW.map((f) => ({ title: f.name }))}
        />
        <div style={{ marginTop: 16 }}>
          <Space>
            <Text type="secondary">当前阶段进度</Text>
            <Progress
              percent={detail.stageProgress}
              style={{ width: 280 }}
              status={detail.stageProgress >= 100 ? "success" : undefined}
            />
          </Space>
        </div>
        {CASE_STAGE_FLOW[stageIdx] && (
          <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
            本阶段产出：{CASE_STAGE_FLOW[stageIdx].outputs.join(" / ")}
          </Text>
        )}
      </Card>

      <Row gutter={12}>
        <Col span={14}>
          <Card title="案件信息" style={{ marginBottom: 12 }}>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="案件类型">
                {CASE_TYPE_META[detail.caseType] ?? detail.caseType}
              </Descriptions.Item>
              <Descriptions.Item label="承办律师">
                {detail.responsibleLawyer ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label="协办律师">
                {detail.coLawyer ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label="对方当事人">
                {detail.oppositeParty ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label="受理法院">
                {detail.court ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label="标的额">
                {detail.amount != null ? `¥${detail.amount.toLocaleString()}` : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="立案日期">
                {detail.filedAt ? new Date(detail.filedAt).toLocaleDateString("zh-CN") : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="结案日期">
                {detail.closedAt ? new Date(detail.closedAt).toLocaleDateString("zh-CN") : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>
                {detail.remark ?? "—"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={10}>
          <Card
            title="办案时间线"
            style={{ marginBottom: 12 }}
            extra={
              <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setEventOpen(true)}>
                新增事件
              </Button>
            }
          >
            {events.length === 0 ? (
              <EmptyState description="暂无办案记录" />
            ) : (
              <Timeline
                items={events.map((ev) => {
                  const meta = EVENT_TYPE_META[ev.eventType];
                  return {
                    color: meta?.color,
                    children: (
                      <>
                        <Space size={6}>
                          {meta && <Tag color={meta.color}>{meta.text}</Tag>}
                          <Text strong>{ev.title}</Text>
                        </Space>
                        {ev.detail && (
                          <div>
                            <Text type="secondary">{ev.detail}</Text>
                          </div>
                        )}
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {new Date(ev.occurredAt).toLocaleString("zh-CN", { hour12: false })}
                          </Text>
                        </div>
                      </>
                    ),
                  };
                })}
              />
            )}
          </Card>
          <Modal
            title="新增办案事件"
            open={eventOpen}
            onCancel={() => setEventOpen(false)}
            onOk={() => eventForm.submit()}
            destroyOnClose
            width={460}
          >
            <Form form={eventForm} layout="vertical" onFinish={submitEvent} requiredMark={false}>
              <Form.Item label="事件类型" name="eventType" rules={[{ required: true }]}>
                <Select
                  options={Object.entries(EVENT_TYPE_META).map(([v, m]) => ({ value: v, label: m.text }))}
                />
              </Form.Item>
              <Form.Item label="发生时间" name="occurredAt" rules={[{ required: true }]}>
                <Input placeholder="YYYY-MM-DD 或 YYYY-MM-DD HH:mm" />
              </Form.Item>
              <Form.Item label="标题" name="title" rules={[{ required: true }]}>
                <Input placeholder="如:第一次开庭" />
              </Form.Item>
              <Form.Item label="详情" name="detail">
                <Input.TextArea rows={3} placeholder="事件描述(可选)" />
              </Form.Item>
            </Form>
          </Modal>
        </Col>
      </Row>
    </div>
  );
}

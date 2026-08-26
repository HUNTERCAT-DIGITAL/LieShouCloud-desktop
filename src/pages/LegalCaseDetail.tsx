/**
 * Desktop 案件详情 + 办案时间线（ADR-0036/0045 · legal 能力域）.
 */
import { ArrowLeftOutlined } from "@ant-design/icons";
import { StatusTag } from "@lieshoucloud/ui";
import { Button, Card, Descriptions, Empty, Space, Tag, Timeline, Typography } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  CASE_STATUS_META,
  CASE_TYPE_META,
  EVENT_TYPE_META,
  getCase,
  listCaseEvents,
  type CaseEvent,
  type LegalCase,
} from "../services/legal";

const { Text } = Typography;

export default function LegalCaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<LegalCase | null>(null);
  const [events, setEvents] = useState<CaseEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const caseId = Number(id);
    Promise.all([getCase(caseId), listCaseEvents(caseId)])
      .then(([c, evs]) => {
        setDetail(c);
        setEvents(evs);
      })
      .catch(() => {
        setDetail(null);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!detail) {
    return (
      <div style={{ padding: 24 }}>
        <Empty description={loading ? "加载中…" : "案件不存在或已被删除"} />
      </div>
    );
  }

  return (
    <div style={{ padding: 8 }}>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/legal/cases")}>
          返回
        </Button>
        <Text strong style={{ fontSize: 16 }}>
          {detail.caseNo}
        </Text>
        <Text type="secondary">{detail.title}</Text>
      </Space>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="状态">
            <StatusTag meta={CASE_STATUS_META[detail.status]} />
          </Descriptions.Item>
          <Descriptions.Item label="案件类型">
            {CASE_TYPE_META[detail.caseType] ?? detail.caseType}
          </Descriptions.Item>
          <Descriptions.Item label="承办律师">{detail.responsibleLawyer ?? "-"}</Descriptions.Item>
          <Descriptions.Item label="协办律师">{detail.coLawyer ?? "-"}</Descriptions.Item>
          <Descriptions.Item label="我方当事人">{detail.party ?? "-"}</Descriptions.Item>
          <Descriptions.Item label="对方当事人">{detail.oppositeParty ?? "-"}</Descriptions.Item>
          <Descriptions.Item label="受理法院">{detail.court ?? "-"}</Descriptions.Item>
          <Descriptions.Item label="标的额">
            {typeof detail.amount === "number" ? `¥${detail.amount.toLocaleString()}` : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="立案日期">{detail.filedAt ?? "-"}</Descriptions.Item>
          <Descriptions.Item label="结案日期">{detail.closedAt ?? "-"}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card size="small" title={`办案时间线（${events.length}）`}>
        {events.length === 0 ? (
          <Empty description="暂无时间线事件" />
        ) : (
          <Timeline
            items={events.map((e) => ({
              color: EVENT_TYPE_META[e.eventType]?.color ?? "gray",
              children: (
                <div>
                  <Space size="middle" wrap>
                    <Tag color={EVENT_TYPE_META[e.eventType]?.color}>
                      {EVENT_TYPE_META[e.eventType]?.text ?? e.eventType}
                    </Tag>
                    <strong>{e.title}</strong>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {new Date(e.occurredAt).toLocaleString("zh-CN", { hour12: false })}
                    </Text>
                  </Space>
                  {e.detail && (
                    <div style={{ marginTop: 4, color: "rgba(0,0,0,0.65)" }}>{e.detail}</div>
                  )}
                </div>
              ),
            }))}
          />
        )}
      </Card>
    </div>
  );
}

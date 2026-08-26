/**
 * iot-desktop 告警列表（全角色 · industry-iot）.
 */
import { EmptyState } from "@lieshoucloud/ui";
import { Table, Tag, Typography } from "antd";
import { useEffect, useState } from "react";

import { iotApi } from "../services/industryIot";
import type { AlertLevel, AlertStatus, IotAlert } from "@lieshoucloud/industry-iot";

const { Text } = Typography;

const LEVEL_COLOR: Record<AlertLevel, string> = { WARN: "gold", CRITICAL: "red" };
const LEVEL_TEXT: Record<AlertLevel, string> = { WARN: "警告", CRITICAL: "严重" };
const STATUS_COLOR: Record<AlertStatus, string> = { PENDING: "red", ACKNOWLEDGED: "green" };
const STATUS_TEXT: Record<AlertStatus, string> = { PENDING: "待处理", ACKNOWLEDGED: "已确认" };

export default function IotAlerts() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IotAlert[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      setData(await iotApi.listAlerts({}));
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div style={{ padding: 8 }}>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        告警中心
      </Typography.Title>
      {data.length === 0 && !loading ? (
        <EmptyState description="暂无告警" />
      ) : (
        <Table<IotAlert>
          rowKey="id"
          loading={loading}
          dataSource={data}
          pagination={false}
          columns={[
            { title: "告警内容", dataIndex: "message", render: (v: string) => <Text strong>{v}</Text> },
            {
              title: "级别",
              dataIndex: "level",
              render: (v: AlertLevel) => <Tag color={LEVEL_COLOR[v]}>{LEVEL_TEXT[v]}</Tag>,
            },
            {
              title: "状态",
              dataIndex: "status",
              render: (v: AlertStatus) => <Tag color={STATUS_COLOR[v]}>{STATUS_TEXT[v]}</Tag>,
            },
            {
              title: "实测/阈值",
              key: "value",
              render: (_, a) =>
                a.actualValue != null && a.threshold != null ? `${a.actualValue} / ${a.threshold}` : "—",
            },
            {
              title: "时间",
              dataIndex: "createdAt",
              render: (v: string) => v.replace("T", " ").slice(0, 16),
            },
          ]}
        />
      )}
    </div>
  );
}

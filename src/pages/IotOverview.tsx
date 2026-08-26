/**
 * iot-desktop 设备总览（IOT_CUSTOMER · industry-iot）.
 */
import { EmptyState } from "@lieshoucloud/ui";
import { Card, Col, Row, Statistic, Typography } from "antd";
import { useEffect, useState } from "react";

import { iotApi } from "../services/industryIot";
import type { IotOverview } from "@lieshoucloud/industry-iot";

export default function IotOverviewPage() {
  const [data, setData] = useState<IotOverview | null>(null);

  const load = async () => {
    try {
      setData(await iotApi.overview());
    } catch {
      setData(null);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (!data) return <EmptyState description="暂无设备数据" />;

  return (
    <div style={{ padding: 8 }}>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        设备总览
      </Typography.Title>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="设备总数" value={data.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="在线" value={data.online} valueStyle={{ color: "#52c41a" }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="离线" value={data.offline} valueStyle={{ color: "#faad14" }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="未确认告警"
              value={data.pendingAlerts}
              valueStyle={{ color: data.pendingAlerts > 0 ? "#f5222d" : undefined }}
            />
          </Card>
        </Col>
      </Row>
      {data.maxTemperature != null && (
        <Card style={{ marginTop: 16 }}>
          <Statistic title="全站最高节点温度" value={data.maxTemperature} suffix="℃" />
        </Card>
      )}
    </div>
  );
}

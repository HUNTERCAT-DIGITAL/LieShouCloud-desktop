/**
 * iot-desktop 设备列表（IOT_OPERATOR · industry-iot）.
 */
import { EmptyState } from "@lieshoucloud/ui";
import { Table, Tag, Typography } from "antd";
import { useEffect, useState } from "react";

import { iotApi } from "../services/industryIot";
import type { DeviceStatus, IotDevice } from "@lieshoucloud/industry-iot";

const { Text } = Typography;

const STATUS_COLOR: Record<DeviceStatus, string> = {
  ONLINE: "green",
  OFFLINE: "gold",
  UNKNOWN: "default",
};

const STATUS_TEXT: Record<DeviceStatus, string> = {
  ONLINE: "在线",
  OFFLINE: "离线",
  UNKNOWN: "未知",
};

export default function IotDevices() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IotDevice[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      setData(await iotApi.listDevices({}));
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
        设备管理
      </Typography.Title>
      {data.length === 0 && !loading ? (
        <EmptyState description="暂无设备" />
      ) : (
        <Table<IotDevice>
          rowKey="id"
          loading={loading}
          dataSource={data}
          pagination={false}
          columns={[
            {
              title: "设备",
              dataIndex: "name",
              render: (v: string | undefined, d) => <Text strong>{v ?? d.deviceKey}</Text>,
            },
            { title: "设备号", dataIndex: "deviceKey" },
            {
              title: "状态",
              dataIndex: "status",
              render: (v: DeviceStatus) => <Tag color={STATUS_COLOR[v]}>{STATUS_TEXT[v]}</Tag>,
            },
            {
              title: "最高温度",
              dataIndex: "maxTemperature",
              render: (v?: number | null) => (v != null ? `${v}℃` : "—"),
            },
            {
              title: "未确认告警",
              dataIndex: "pendingAlerts",
              render: (v?: number) => (v ? `${v} 条` : "—"),
            },
            { title: "安装地址", dataIndex: "installAddress", render: (v?: string) => v ?? "—" },
          ]}
        />
      )}
    </div>
  );
}

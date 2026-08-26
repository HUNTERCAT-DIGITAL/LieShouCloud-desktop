/**
 * legal-desktop 计时记录（律师/助理 · industry-legal）.
 */
import { EmptyState } from "@lieshoucloud/ui";
import { Table, Tag, Typography } from "antd";
import { useEffect, useState } from "react";

import { legalApi } from "../services/industryLegal";
import type { TimeEntry } from "@lieshoucloud/industry-legal";

const { Text } = Typography;

export default function LegalTime() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TimeEntry[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      setData(await legalApi.listTimeEntries({}));
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
        计时记录
      </Typography.Title>
      {data.length === 0 && !loading ? (
        <EmptyState description="暂无计时记录" />
      ) : (
        <Table<TimeEntry>
          rowKey="id"
          loading={loading}
          dataSource={data}
          pagination={false}
          columns={[
            { title: "案件 ID", dataIndex: "caseId", render: (v: number) => <Text>#{v}</Text> },
            {
              title: "时长",
              dataIndex: "durationMinutes",
              render: (v: number) => <Tag color="blue">{v} 分钟</Tag>,
            },
            {
              title: "计费时间",
              dataIndex: "billedAt",
              render: (v: string) => v.replace("T", " ").slice(0, 16),
            },
            { title: "备注", dataIndex: "note", render: (v?: string) => v ?? "—" },
          ]}
        />
      )}
    </div>
  );
}

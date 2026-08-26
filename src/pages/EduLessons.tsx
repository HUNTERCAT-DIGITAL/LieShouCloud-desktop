/**
 * edu-desktop 课时列表（全角色 · industry-edu）.
 */
import { EmptyState } from "@lieshoucloud/ui";
import { Table, Tag, Typography } from "antd";
import { useEffect, useState } from "react";

import { eduApi } from "../services/industryEdu";
import type { Lesson, LessonStatus } from "@lieshoucloud/industry-edu";

const { Text } = Typography;

const STATUS_COLOR: Record<LessonStatus, string> = {
  SCHEDULED: "blue",
  IN_PROGRESS: "gold",
  COMPLETED: "green",
  CANCELLED: "default",
};

const STATUS_TEXT: Record<LessonStatus, string> = {
  SCHEDULED: "待上课",
  IN_PROGRESS: "进行中",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

export default function EduLessons() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Lesson[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      setData(await eduApi.listLessons({}));
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
        课时排期
      </Typography.Title>
      {data.length === 0 && !loading ? (
        <EmptyState description="暂无课时" />
      ) : (
        <Table<Lesson>
          rowKey="id"
          loading={loading}
          dataSource={data}
          pagination={false}
          columns={[
            {
              title: "上课时间",
              dataIndex: "scheduledAt",
              render: (v: string) => <Text>{v.replace("T", " ").slice(0, 16)}</Text>,
            },
            {
              title: "状态",
              dataIndex: "status",
              render: (v: LessonStatus) => <Tag color={STATUS_COLOR[v]}>{STATUS_TEXT[v]}</Tag>,
            },
            { title: "时长", dataIndex: "durationMinutes", render: (v: number) => `${v} 分钟` },
          ]}
        />
      )}
    </div>
  );
}

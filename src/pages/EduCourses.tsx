/**
 * edu-desktop 课程列表（学生/家长 · industry-edu）.
 */
import { EmptyState } from "@lieshoucloud/ui";
import { Table, Typography } from "antd";
import { useEffect, useState } from "react";

import { eduApi } from "../services/industryEdu";
import type { Course } from "@lieshoucloud/industry-edu";

const { Text } = Typography;

export default function EduCourses() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Course[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      setData(await eduApi.listCourses({}));
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
        课程管理
      </Typography.Title>
      {data.length === 0 && !loading ? (
        <EmptyState description="暂无课程" />
      ) : (
        <Table<Course>
          rowKey="id"
          loading={loading}
          dataSource={data}
          pagination={false}
          columns={[
            { title: "课程", dataIndex: "name", render: (v: string) => <Text strong>{v}</Text> },
            {
              title: "课时",
              dataIndex: "lessonCount",
              render: (v?: number) => (v ? `${v} 课时` : "—"),
            },
            { title: "适用年龄", dataIndex: "ageGroup", render: (v?: string) => v ?? "—" },
            { title: "班型", dataIndex: "classMode", render: (v?: string) => v ?? "—" },
          ]}
        />
      )}
    </div>
  );
}

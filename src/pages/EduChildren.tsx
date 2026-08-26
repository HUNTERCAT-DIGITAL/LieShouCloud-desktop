/**
 * edu-desktop 孩子进度（家长 · industry-edu）.
 */
import { EmptyState } from "@lieshoucloud/ui";
import { Progress, Table, Typography } from "antd";
import { useEffect, useState } from "react";

import { eduApi } from "../services/industryEdu";
import type { ChildProgress } from "@lieshoucloud/industry-edu";

export default function EduChildren() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ChildProgress[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      // 演示期固定 childId=1；后端接入后按当前家长的孩子列表遍历
      setData(await eduApi.listChildProgress(1));
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const total = (p: ChildProgress) => p.completedLessons + p.remainingLessons;
  const pct = (p: ChildProgress) => (total(p) === 0 ? 0 : Math.round((p.completedLessons / total(p)) * 100));

  return (
    <div style={{ padding: 8 }}>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        孩子进度
      </Typography.Title>
      {data.length === 0 && !loading ? (
        <EmptyState description="暂无孩子进度数据" />
      ) : (
        <Table<ChildProgress>
          rowKey={(r) => `${r.childId}-${r.courseId}`}
          loading={loading}
          dataSource={data}
          pagination={false}
          columns={[
            { title: "孩子 ID", dataIndex: "childId" },
            { title: "课程 ID", dataIndex: "courseId" },
            {
              title: "进度",
              key: "progress",
              render: (_, p) => (
                <Progress
                  percent={pct(p)}
                  format={() => `${p.completedLessons}/${total(p)} 课时`}
                />
              ),
            },
          ]}
        />
      )}
    </div>
  );
}

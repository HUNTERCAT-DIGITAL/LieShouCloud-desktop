/**
 * Desktop 工作台（Phase 9 · desktop）.
 */
import { ContactsOutlined, TeamOutlined } from "@ant-design/icons";
import { Card, Col, Empty, Row, Statistic } from "antd";
import { useEffect, useState } from "react";

import { EmptyState } from "@lieshoucloud/ui";
import { countCustomers, listCustomers } from "../services/customer";
import { colors } from "../theme/colors";
import { useAuthStore } from "../stores/auth";

export default function Welcome() {
  const user = useAuthStore((s) => s.user);
  const [customers, setCustomers] = useState<number | null>(null);
  const [recent, setRecent] = useState<Awaited<ReturnType<typeof listCustomers>>>([]);

  useEffect(() => {
    void Promise.all([countCustomers(), listCustomers()])
      .then(([count, list]) => {
        setCustomers(count);
        setRecent([...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5));
      })
      .catch(() => undefined);
  }, []);

  return (
    <div style={{ padding: 8 }}>
      <h2 style={{ marginTop: 0 }}>欢迎回来，{user?.username ?? "用户"}</h2>
      <Row gutter={16}>
        <Col span={12}>
          <Card>
            <Statistic title="本租户客户" value={customers ?? "—"} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="今日新增（mock）"
              value={3}
              prefix={<ContactsOutlined />}
              valueStyle={{ color: colors.primary }}
            />
          </Card>
        </Col>
      </Row>
      <Card title="最近客户" style={{ marginTop: 16 }}>
        {recent.length === 0 ? (
          <EmptyState description="暂无客户数据" />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                {recent.map((c) => (
                  <div key={c.id} style={{ padding: "4px 0" }}>
                    <strong>{c.name}</strong> · {c.status} · {c.createdAt}
                  </div>
                ))}
              </div>
            }
          />
        )}
      </Card>
    </div>
  );
}

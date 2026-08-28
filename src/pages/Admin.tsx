/**
 * Desktop 平台管理总览（简化版）.
 * 统计卡片:用户 / 角色 / 租户 / 审计。
 */
import { AuditOutlined, ReloadOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";
import { Card, Col, Row, Space, Statistic, Button } from "antd";
import { useEffect, useState } from "react";

import { countAuditLogs } from "../services/audit";
import { listRoles } from "../services/role";
import { listTenants } from "../services/tenant";
import { listUsers } from "../services/user";

export default function Admin() {
  const [stats, setStats] = useState({ users: 0, roles: 0, tenants: 0, audits: 0 });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [users, roles, tenants, auditCount] = await Promise.all([
        listUsers(),
        listRoles(),
        listTenants(),
        countAuditLogs().catch(() => 0),
      ]);
      setStats({ users: users.length, roles: roles.length, tenants: tenants.length, audits: auditCount });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const cards = [
    { title: "用户数", value: stats.users, icon: <UserOutlined />, color: "#1677ff" },
    { title: "角色数", value: stats.roles, icon: <TeamOutlined />, color: "#722ed1" },
    { title: "租户数", value: stats.tenants, icon: <AuditOutlined />, color: "#13c2c2" },
    { title: "审计记录", value: stats.audits, icon: <AuditOutlined />, color: "#fa8c16" },
  ];

  return (
    <Card
      title="平台管理"
      extra={
        <Button icon={<ReloadOutlined />} loading={loading} onClick={() => void load()}>
          刷新
        </Button>
      }
    >
      <Row gutter={[16, 16]}>
        {cards.map((c) => (
          <Col span={6} key={c.title}>
            <Card>
              <Statistic title={c.title} value={c.value} prefix={<span style={{ color: c.color }}>{c.icon}</span>} />
            </Card>
          </Col>
        ))}
      </Row>
      <Space style={{ marginTop: 16 }}>
        平台管理入口:左侧菜单「用户管理 / 角色管理 / 租户管理 / 审计日志」。
      </Space>
    </Card>
  );
}

/**
 * Desktop 个人中心（简化版）.
 * 展示当前登录用户信息(/auth/me),支持手动刷新。
 */
import { ReloadOutlined } from "@ant-design/icons";
import { RoleTag } from "@lieshoucloud/ui";
import { Avatar, Button, Card, Descriptions, Space, Typography } from "antd";
import { useEffect, useState } from "react";

import { useAuthStore } from "../stores/auth";
import type { CurrentUser } from "@lieshoucloud/contract-types/business/auth";

const { Text } = Typography;

export default function Profile() {
  const cached = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [me, setMe] = useState<CurrentUser | null>(cached);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setMe(await fetchMe());
    } catch {
      /* 拉取失败保留缓存 */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card
      title="个人中心"
      extra={
        <Button icon={<ReloadOutlined />} loading={loading} onClick={() => void load()}>
          刷新
        </Button>
      }
      style={{ maxWidth: 640 }}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Space align="center" size="middle">
          <Avatar size={56} style={{ background: "#1677ff" }}>
            {me?.username?.[0]?.toUpperCase() ?? "U"}
          </Avatar>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{me?.username ?? "—"}</div>
            <Text type="secondary">@{me?.username ?? "—"}</Text>
          </div>
        </Space>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="用户 ID">{me?.userId ?? "—"}</Descriptions.Item>
          <Descriptions.Item label="租户">
            {me?.tenantName ? `${me.tenantName} (${me.tenantCode})` : me?.tenantCode ?? "—"}
          </Descriptions.Item>
          <Descriptions.Item label="版别">{me?.tenantEdition ?? "—"}</Descriptions.Item>
          <Descriptions.Item label="角色">
            <Space wrap>
              {me?.roles?.length ? me.roles.map((r) => <RoleTag key={r} role={r} />) : "—"}
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Space>
    </Card>
  );
}

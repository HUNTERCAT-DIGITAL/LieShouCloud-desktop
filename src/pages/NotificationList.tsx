/**
 * Desktop 通知中心（简化版）.
 */
import { CheckOutlined, ReloadOutlined } from "@ant-design/icons";
import { EmptyState } from "@lieshoucloud/ui";
import { App, Badge, Button, Card, List, Space, Tag, Typography } from "antd";
import { useEffect, useState } from "react";

import { listNotifications, markAllNotificationsRead, markNotificationRead, unreadNotificationCount } from "../services/notification";
import type { NotificationItem } from "../services/notification";

const { Text } = Typography;

export default function NotificationList() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const [list, count] = await Promise.all([listNotifications(), unreadNotificationCount()]);
      setItems(list);
      setUnread(count);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onRead = async (n: NotificationItem) => {
    if (n.readAt) return;
    await markNotificationRead(n.id);
    void load();
  };

  const onReadAll = async () => {
    const updated = await markAllNotificationsRead();
    message.success(`已标记 ${updated} 条为已读`);
    void load();
  };

  return (
    <Card
      title={
        <Space>
          通知中心
          <Badge count={unread} color="#1677ff" showZero />
        </Space>
      }
      extra={
        <Space>
          <Button icon={<CheckOutlined />} onClick={() => void onReadAll()}>
            全部已读
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => void load()}>
            刷新
          </Button>
        </Space>
      }
    >
      <List<NotificationItem>
        loading={loading}
        dataSource={items}
        locale={{ emptyText: <EmptyState description="暂无通知" /> }}
        renderItem={(n) => (
          <List.Item
            onClick={() => void onRead(n)}
            style={{ cursor: n.readAt ? "default" : "pointer", padding: "12px 8px" }}
            actions={n.readAt ? [<Text type="secondary" key="read">已读</Text>] : undefined}
          >
            <List.Item.Meta
              avatar={n.readAt ? undefined : <Badge status="processing" />}
              title={
                <Space>
                  {n.title}
                  {n.bizType && <Tag>{n.bizType}</Tag>}
                </Space>
              }
              description={
                <Space direction="vertical" size={2}>
                  <Text>{n.content}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {n.createdAt}
                  </Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
}

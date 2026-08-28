/**
 * Desktop 工作台（增强版）.
 * 统计卡(客户/待审批/未读通知/合同) + 待办(审批+通知) + 快捷入口。
 */
import {
  AuditOutlined,
  BellOutlined,
  BookOutlined,
  CheckSquareOutlined,
  ContainerOutlined,
  ContactsOutlined,
  FileTextOutlined,
  MoneyCollectOutlined,
  RightOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { EmptyState } from "@lieshoucloud/ui";
import { Button, Card, Col, List, Row, Space, Statistic, Typography } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { countCustomers } from "../services/customer";
import { listApprovals, getApprovalCounts } from "../services/approval";
import { listNotifications, unreadNotificationCount } from "../services/notification";
import { listContracts } from "../services/contract";
import { useAuthStore } from "../stores/auth";
import { colors } from "../theme/colors";
import type { ApprovalRequest } from "../services/approval";
import type { NotificationItem } from "../services/notification";

const { Text } = Typography;

interface StatItem {
  title: string;
  value: number | "—";
  icon: React.ReactNode;
  color: string;
}

export default function Welcome() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const [customerCount, counts, unread, contracts] = await Promise.all([
          countCustomers().catch(() => 0),
          getApprovalCounts().catch(() => ({ inbox: 0, mine: 0 })),
          unreadNotificationCount().catch(() => 0),
          listContracts().catch(() => []),
        ]);
        setStats([
          { title: "客户", value: customerCount, icon: <TeamOutlined />, color: "#1677ff" },
          { title: "待审批", value: counts.inbox, icon: <CheckSquareOutlined />, color: "#fa8c16" },
          { title: "未读通知", value: unread, icon: <BellOutlined />, color: "#eb2f96" },
          { title: "合同", value: contracts.length, icon: <FileTextOutlined />, color: "#13c2c2" },
        ]);
      } catch {
        /* 统计失败不阻塞页面 */
      }
      try {
        const [ap, nt] = await Promise.all([
          listApprovals({ role: "inbox" }).catch(() => []),
          listNotifications({ size: 5 }).catch(() => []),
        ]);
        setApprovals(ap.slice(0, 5));
        setNotifications(nt.slice(0, 5));
      } catch {
        /* 待办失败不阻塞 */
      }
    })();
  }, []);

  const quickLinks = [
    { key: "/customers", label: "客户管理", icon: <ContactsOutlined />, color: "#1677ff" },
    { key: "/lead/list", label: "线索管理", icon: <AuditOutlined />, color: "#722ed1" },
    { key: "/contract/list", label: "合同管理", icon: <FileTextOutlined />, color: "#13c2c2" },
    { key: "/approval", label: "审批流", icon: <CheckSquareOutlined />, color: "#fa8c16" },
    { key: "/inventory", label: "库存管理", icon: <ContainerOutlined />, color: "#2f54eb" },
    { key: "/finance", label: "记账本", icon: <MoneyCollectOutlined />, color: "#52c41a" },
    { key: "/cases", label: "案件管理", icon: <BookOutlined />, color: "#eb2f96" },
    { key: "/notification", label: "通知中心", icon: <BellOutlined />, color: "#faad14" },
  ];

  return (
    <div style={{ padding: 0 }}>
      <h2 style={{ marginTop: 0 }}>欢迎回来，{user?.username ?? "用户"}</h2>
      {/* 统计卡 */}
      <Row gutter={[16, 16]}>
        {stats.map((s) => (
          <Col span={6} key={s.title}>
            <Card>
              <Statistic
                title={s.title}
                value={s.value}
                prefix={<span style={{ color: s.color, marginRight: 4 }}>{s.icon}</span>}
              />
            </Card>
          </Col>
        ))}
      </Row>
      {/* 快捷入口 */}
      <Card title="快捷入口" style={{ marginTop: 16 }}>
        <Row gutter={[12, 12]}>
          {quickLinks.map((l) => (
            <Col span={6} key={l.key}>
              <Card
                hoverable
                size="small"
                onClick={() => navigate(l.key)}
                styles={{ body: { padding: "14px 16px", cursor: "pointer" } }}
              >
                <Space>
                  <span style={{ color: l.color, fontSize: 18 }}>{l.icon}</span>
                  <Text strong>{l.label}</Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
      {/* 待办 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card
            title="待我审批"
            extra={
              <Button type="link" size="small" onClick={() => navigate("/approval")}>
                全部 <RightOutlined />
              </Button>
            }
          >
            {approvals.length === 0 ? (
              <EmptyState description="暂无待办审批" />
            ) : (
              <List<ApprovalRequest>
                dataSource={approvals}
                renderItem={(a) => (
                  <List.Item style={{ cursor: "pointer" }} onClick={() => navigate("/approval")}>
                    <List.Item.Meta
                      title={a.title}
                      description={
                        <Space size="small">
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            发起人 #{a.requesterId}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {a.createdAt}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title="最新通知"
            extra={
              <Button type="link" size="small" onClick={() => navigate("/notification")}>
                全部 <RightOutlined />
              </Button>
            }
          >
            {notifications.length === 0 ? (
              <EmptyState description="暂无通知" />
            ) : (
              <List<NotificationItem>
                dataSource={notifications}
                renderItem={(n) => (
                  <List.Item style={{ cursor: "pointer" }} onClick={() => navigate("/notification")}>
                    <List.Item.Meta
                      title={
                        <Space>
                          <span style={{ fontWeight: n.readAt ? 400 : 600 }}>{n.title}</span>
                          {!n.readAt && <span style={{ color: colors.primary }}>· 未读</span>}
                        </Space>
                      }
                      description={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {n.createdAt}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

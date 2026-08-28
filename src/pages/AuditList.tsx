/**
 * Desktop 审计日志（平台管理 · 只读 · ADR-0030）.
 */
import { ReloadOutlined } from "@ant-design/icons";
import { EmptyState, StatusTag } from "@lieshoucloud/ui";
import { AUDIT_ACTION_TEXT, AUDIT_OUTCOME_TEXT, AUDIT_RESOURCE_TEXT } from "@lieshoucloud/contract-types/business/audit";
import type { AuditAction, AuditLog, AuditOutcome } from "@lieshoucloud/contract-types/business/audit";
import { Button, Card, Select, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";

import { listAuditLogs } from "../services/audit";

const { Text } = Typography;

const OUTCOME_META: Record<AuditOutcome, { text: string; color: string }> = {
  SUCCESS: { text: AUDIT_OUTCOME_TEXT.SUCCESS, color: "green" },
  DENIED: { text: AUDIT_OUTCOME_TEXT.DENIED, color: "red" },
  ERROR: { text: AUDIT_OUTCOME_TEXT.ERROR, color: "orange" },
};

export default function AuditList() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [action, setAction] = useState<AuditAction | undefined>(undefined);
  const [resourceType, setResourceType] = useState<string | undefined>(undefined);

  const load = async () => {
    setLoading(true);
    try {
      setLogs(await listAuditLogs({ action, resourceType, limit: 200 }));
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, resourceType]);

  const columns: ColumnsType<AuditLog> = [
    { title: "时间", dataIndex: "createdAt", key: "createdAt", width: 180 },
    {
      title: "操作人",
      key: "user",
      width: 110,
      render: (_, l) => l.userId ?? "—",
    },
    {
      title: "动作",
      dataIndex: "action",
      key: "action",
      width: 90,
      render: (a: AuditAction) => AUDIT_ACTION_TEXT[a] ?? a,
    },
    {
      title: "资源",
      key: "resource",
      width: 120,
      render: (_, l) => (
        <Text>
          {AUDIT_RESOURCE_TEXT[l.resourceType] ?? l.resourceType}
          {l.resourceId != null ? ` #${l.resourceId}` : ""}
        </Text>
      ),
    },
    { title: "详情", dataIndex: "detail", key: "detail", ellipsis: true },
    {
      title: "结果",
      dataIndex: "outcome",
      key: "outcome",
      width: 90,
      render: (o: AuditOutcome) => <StatusTag meta={OUTCOME_META[o]} />,
    },
    { title: "IP", dataIndex: "sourceIp", key: "sourceIp", width: 130, render: (v?: string) => v ?? "—" },
  ];

  return (
    <Card
      title="审计日志"
      extra={
        <Space>
          <Select
            allowClear
            placeholder="动作"
            style={{ width: 120 }}
            value={action}
            onChange={(v) => setAction(v)}
            options={Object.entries(AUDIT_ACTION_TEXT).map(([v, t]) => ({ value: v, label: t }))}
          />
          <Select
            allowClear
            placeholder="资源类型"
            style={{ width: 130 }}
            value={resourceType}
            onChange={(v) => setResourceType(v)}
            options={Object.entries(AUDIT_RESOURCE_TEXT).map(([v, t]) => ({ value: v, label: t }))}
          />
          <Button icon={<ReloadOutlined />} onClick={() => void load()}>
            刷新
          </Button>
        </Space>
      }
    >
      <Table<AuditLog>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={logs}
        pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
        locale={{ emptyText: <EmptyState description="暂无审计记录" /> }}
      />
    </Card>
  );
}

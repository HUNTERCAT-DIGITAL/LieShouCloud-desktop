/**
 * 智法云枢 · 案件列表（桌面端核心页 · 2026-09）.
 *
 * 对齐 LegalCase 契约 + 八阶段元数据（contract-types/business/legal）；
 * 列表 → 详情（八阶段推进主链路）。
 */
import { SearchOutlined } from "@ant-design/icons";
import { EmptyState, StatusTag } from "@lieshoucloud/ui";
import { Card, Input, Select, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  CASE_PRIORITY_META,
  CASE_STAGE_META,
  CASE_STATUS_META,
  CASE_TYPE_META,
  type CasePriority,
  type CaseStage,
  type CaseStatus,
  type LegalCase,
} from "@lieshoucloud/contract-types/business/legal";
import { listCases } from "../services/case";

const { Text } = Typography;

const STAGE_OPTIONS = (Object.keys(CASE_STAGE_META) as CaseStage[]).map((s) => ({
  label: CASE_STAGE_META[s].text,
  value: s,
}));

const STATUS_OPTIONS = (Object.keys(CASE_STATUS_META) as CaseStatus[]).map((s) => ({
  label: CASE_STATUS_META[s].text,
  value: s,
}));

export default function Cases() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LegalCase[]>([]);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [stage, setStage] = useState<CaseStage | undefined>(undefined);
  const [status, setStatus] = useState<CaseStatus | undefined>(undefined);

  const load = async (p = 0) => {
    setLoading(true);
    try {
      const res = await listCases({
        keyword: keyword || undefined,
        stage,
        status,
        page: p,
        size: 20,
      });
      setData(res.items);
      setTotal(res.total);
    } catch {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, status]);

  const columns: ColumnsType<LegalCase> = [
    { title: "案号", dataIndex: "caseNo", width: 170 },
    { title: "案件标题", dataIndex: "title", ellipsis: true },
    {
      title: "类型",
      dataIndex: "caseType",
      width: 100,
      render: (v: string) => CASE_TYPE_META[v as keyof typeof CASE_TYPE_META] ?? v,
    },
    {
      title: "办理阶段",
      dataIndex: "stage",
      width: 150,
      render: (v: CaseStage) => {
        const m = CASE_STAGE_META[v];
        return m ? <Tag color={m.color}>{m.text}</Tag> : v;
      },
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (v: CaseStatus) => {
        const m = CASE_STATUS_META[v];
        return m ? <StatusTag meta={m} /> : v;
      },
    },
    {
      title: "关注度",
      dataIndex: "priority",
      width: 100,
      render: (v: CasePriority) => {
        const m = CASE_PRIORITY_META[v];
        return m ? <Tag color={m.color}>{m.text}</Tag> : v;
      },
    },
    { title: "承办人", dataIndex: "responsibleLawyer", width: 110, render: (v) => v ?? "—" },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      width: 160,
      render: (v) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {new Date(v).toLocaleString("zh-CN", { hour12: false })}
        </Text>
      ),
    },
  ];

  return (
    <Card>
      <Space style={{ marginBottom: 12 }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="按案号/标题/当事人搜索"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={() => void load(0)}
          allowClear
          style={{ width: 260 }}
        />
        <Select
          placeholder="办理阶段"
          value={stage}
          onChange={setStage}
          options={STAGE_OPTIONS}
          allowClear
          style={{ width: 160 }}
        />
        <Select
          placeholder="案件状态"
          value={status}
          onChange={setStatus}
          options={STATUS_OPTIONS}
          allowClear
          style={{ width: 140 }}
        />
      </Space>
      <Table<LegalCase>
        rowKey="id"
        dataSource={data}
        loading={loading}
        locale={{ emptyText: <EmptyState description="暂无案件" /> }}
        onRow={(row) => ({
          onClick: () => navigate(`/cases/${row.id}`),
          style: { cursor: "pointer" },
        })}
        pagination={{
          pageSize: 20,
          total,
          showTotal: (t) => `共 ${t} 件案件`,
          onChange: (p) => void load(p - 1),
        }}
        columns={columns}
      />
    </Card>
  );
}

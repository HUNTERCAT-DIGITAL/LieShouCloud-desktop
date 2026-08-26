/**
 * Desktop 案件列表（ADR-0036/0045 · legal 能力域）.
 *
 * 简化版：搜索 + 状态过滤 + Table（复用 ui 包 StatusTag）。
 */
import { SearchOutlined } from "@ant-design/icons";
import { StatusTag } from "@lieshoucloud/ui";
import { Input, Select, Space, Table, Typography } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  CASE_STATUS_META,
  CASE_TYPE_META,
  listCases,
  type CaseStatus,
  type LegalCase,
} from "../services/legal";

const { Text } = Typography;

const STATUS_OPTIONS = (Object.keys(CASE_STATUS_META) as CaseStatus[]).map((s) => ({
  label: CASE_STATUS_META[s].text,
  value: s,
}));

export default function LegalCases() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LegalCase[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<CaseStatus | undefined>(undefined);

  const load = async () => {
    setLoading(true);
    try {
      const page = await listCases({ keyword: keyword || undefined, status }, 1, 100);
      setData(page.items);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div style={{ padding: 8 }}>
      <Space style={{ marginBottom: 12 }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="按案号/标题/当事人搜索"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={() => void load()}
          allowClear
          style={{ width: 240 }}
        />
        <Select
          placeholder="状态"
          value={status}
          onChange={setStatus}
          options={STATUS_OPTIONS}
          allowClear
          style={{ width: 140 }}
        />
      </Space>
      <Table<LegalCase>
        rowKey="id"
        size="small"
        loading={loading}
        dataSource={data}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        onRow={(record) => ({
          onClick: () => navigate(`/legal/cases/${record.id}`),
          style: { cursor: "pointer" },
        })}
        columns={[
          { title: "案号", dataIndex: "caseNo", width: 200, ellipsis: true },
          { title: "案件标题", dataIndex: "title", ellipsis: true },
          {
            title: "类型",
            dataIndex: "caseType",
            width: 90,
            render: (_, r) => CASE_TYPE_META[r.caseType] ?? r.caseType,
          },
          {
            title: "状态",
            dataIndex: "status",
            width: 100,
            render: (_, r) => <StatusTag meta={CASE_STATUS_META[r.status]} />,
          },
          { title: "承办律师", dataIndex: "responsibleLawyer", width: 100, render: (v) => v ?? "-" },
          { title: "我方当事人", dataIndex: "party", width: 120, ellipsis: true, render: (v) => v ?? "-" },
        ]}
      />
      <Text type="secondary" style={{ fontSize: 12 }}>
        共 {data.length} 条（点击行查看详情与时间线）
      </Text>
    </div>
  );
}

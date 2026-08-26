/**
 * Desktop 客户列表（Phase 9 · desktop）.
 *
 * 复用 ui 包 StatusTag + EmptyState；简化版 antd Table。
 */
import { SearchOutlined } from "@ant-design/icons";
import { StatusTag, EmptyState } from "@lieshoucloud/ui";
import { Input, Select, Space, Table, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { STATUS_META, listCustomers, type Customer, type CustomerStatus } from "../services/customer";

const { Text } = Typography;

const STATUS_OPTIONS = (Object.keys(STATUS_META) as CustomerStatus[]).map((s) => ({
  label: STATUS_META[s].text,
  value: s,
}));

export default function Customers() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Customer[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<CustomerStatus | undefined>(undefined);

  const load = async () => {
    setLoading(true);
    try {
      const list = await listCustomers(keyword || undefined, status);
      setData(list);
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
          placeholder="按关键字搜索"
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
          options={[{ value: undefined as unknown as CustomerStatus, label: "全部" }, ...STATUS_OPTIONS]}
          allowClear
          style={{ width: 160 }}
        />
      </Space>
      <Table<Customer>
        rowKey="id"
        dataSource={data}
        loading={loading}
        locale={{
          emptyText: <EmptyState description="暂无客户" />,
        }}
        onRow={(row) => ({
          onClick: () => navigate(`/customers/${row.id}`),
          style: { cursor: "pointer" },
        })}
        pagination={{ pageSize: 20 }}
        columns={[
          { title: "ID", dataIndex: "id", width: 64 },
          { title: "客户名称", dataIndex: "name" },
          {
            title: "状态",
            dataIndex: "status",
            width: 100,
            render: (_, row) => <StatusTag meta={STATUS_META[row.status]} />,
          },
          { title: "联系人", dataIndex: "contactName", render: (v) => v ?? "—" },
          { title: "电话", dataIndex: "contactPhone", render: (v) => v ?? "—" },
          {
            title: "创建时间",
            dataIndex: "createdAt",
            width: 160,
            render: (v) => (
              <Text type="secondary" style={{ fontSize: 12 }}>
                <Tag>{v}</Tag>
              </Text>
            ),
          },
        ]}
      />
    </div>
  );
}

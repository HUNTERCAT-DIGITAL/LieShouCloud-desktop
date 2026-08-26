/**
 * Desktop 客户详情（Phase 9 · desktop）.
 */
import { ArrowLeftOutlined } from "@ant-design/icons";
import { EmptyState, StatusTag } from "@lieshoucloud/ui";
import { Alert, Button, Card, Descriptions, Space } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { STATUS_META, getCustomer, type Customer } from "../services/customer";
import { isApiError } from "../services/auth";

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const cid = Number(id);
    if (!Number.isFinite(cid)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    getCustomer(cid)
      .then((c) => setCustomer(c))
      .catch((e: unknown) => {
        if (isApiError(e) && e.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (notFound) {
    return (
      <Card>
        <EmptyState
          description="客户不存在或不属于当前租户"
          action={
            <Button type="primary" onClick={() => navigate("/customers")}>
              返回列表
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <Card
      loading={loading}
      title={
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate("/customers")} />
          客户详情
        </Space>
      }
      extra={customer ? <StatusTag meta={STATUS_META[customer.status]} /> : null}
    >
      {customer ? (
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="客户名称">{customer.name}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <StatusTag meta={STATUS_META[customer.status]} />
          </Descriptions.Item>
          <Descriptions.Item label="联系人">{customer.contactName ?? "—"}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{customer.contactPhone ?? "—"}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{customer.email ?? "—"}</Descriptions.Item>
          <Descriptions.Item label="地址">{customer.address ?? "—"}</Descriptions.Item>
          <Descriptions.Item label="创建时间" span={2}>
            {customer.createdAt}
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <Alert message="加载中…" type="info" />
      )}
    </Card>
  );
}

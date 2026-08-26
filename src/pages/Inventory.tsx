/**
 * Desktop 库存管理页（Phase 9 · 多端接入）.
 * 商品列表 + 出入库 Modal + 流水抽屉（复用 @lieshoucloud/ui 的 StatusTag 思路，桌面端直接用 antd Tag）。
 */
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { EmptyState, StatusTag } from "@lieshoucloud/ui";
import { App, Button, Form, Input, InputNumber, Modal, Space, Table, Tag, Typography } from "antd";
import { useEffect, useState } from "react";

import {
  createProduct,
  listMovements,
  listProducts,
  MOVEMENT_META,
  stockIn,
  stockOut,
  type Product,
  type StockMovement,
} from "../services/inventory";

const { Text } = Typography;

export default function Inventory() {
  const { message: messageApi } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [keyword, setKeyword] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockType, setStockType] = useState<"IN" | "OUT">("IN");
  const [stockOpen, setStockOpen] = useState(false);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementOpen, setMovementOpen] = useState(false);
  const [form] = Form.useForm();
  const [stockForm] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      setProducts(await listProducts(keyword || undefined));
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreate = async (values: { name: string; code?: string; unit?: string; price?: number; remark?: string }) => {
    try {
      await createProduct({
        name: values.name,
        code: values.code || undefined,
        unit: values.unit || undefined,
        price: values.price,
        remark: values.remark || undefined,
      });
      messageApi.success("已创建");
      setCreateOpen(false);
      form.resetFields();
      void load();
    } catch (e) {
      messageApi.error(String(e));
    }
  };

  const onStock = async (values: { quantity: number; remark?: string }) => {
    if (!stockProduct) return;
    try {
      if (stockType === "IN") await stockIn(stockProduct.id, values.quantity, values.remark);
      else await stockOut(stockProduct.id, values.quantity, values.remark);
      messageApi.success(stockType === "IN" ? "入库成功" : "出库成功");
      setStockOpen(false);
      stockForm.resetFields();
      void load();
    } catch (e) {
      messageApi.error(String(e));
    }
  };

  const openMovements = async (p: Product) => {
    setStockProduct(p);
    setMovementOpen(true);
    try {
      setMovements(await listMovements(p.id));
    } catch {
      setMovements([]);
    }
  };

  return (
    <div style={{ padding: 8 }}>
      <Space style={{ marginBottom: 12 }}>
        <Input.Search
          placeholder="搜索商品名称/编码"
          allowClear
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={() => void load()}
          style={{ width: 260 }}
        />
        <Button icon={<ReloadOutlined />} onClick={() => void load()}>
          刷新
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          新建商品
        </Button>
      </Space>

      <Table<Product>
        rowKey="id"
        dataSource={products}
        loading={loading}
        locale={{ emptyText: <EmptyState description="暂无商品" /> }}
        pagination={{ pageSize: 20 }}
        columns={[
          { title: "ID", dataIndex: "id", width: 60 },
          { title: "商品名称", dataIndex: "name" },
          { title: "编码", dataIndex: "code", width: 110, render: (v) => v ?? "—" },
          { title: "单位", dataIndex: "unit", width: 70, render: (v) => v ?? "—" },
          {
            title: "单价",
            dataIndex: "price",
            width: 110,
            render: (v) => (v != null ? `¥ ${Number(v).toFixed(2)}` : "—"),
          },
          {
            title: "库存",
            dataIndex: "stockQuantity",
            width: 90,
            render: (v: number) => <Tag color={v > 0 ? "blue" : "red"}>{v}</Tag>,
          },
          {
            title: "操作",
            width: 240,
            render: (_, row) => (
              <Space size={4}>
                <Button
                  size="small"
                  onClick={() => {
                    setStockProduct(row);
                    setStockType("IN");
                    setStockOpen(true);
                  }}
                >
                  入库
                </Button>
                <Button
                  size="small"
                  disabled={row.stockQuantity <= 0}
                  onClick={() => {
                    setStockProduct(row);
                    setStockType("OUT");
                    setStockOpen(true);
                  }}
                >
                  出库
                </Button>
                <Button size="small" onClick={() => void openMovements(row)}>
                  流水
                </Button>
              </Space>
            ),
          },
        ]}
      />

      {/* 新建商品 */}
      <Modal open={createOpen} title="新建商品" onCancel={() => setCreateOpen(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={onCreate} style={{ marginTop: 12 }}>
          <Form.Item name="name" label="商品名称" rules={[{ required: true, message: "请输入商品名称" }]}>
            <Input placeholder="如：联想 ThinkPad X1" />
          </Form.Item>
          <Form.Item name="code" label="编码（SKU）">
            <Input placeholder="SKU-001" />
          </Form.Item>
          <Form.Item name="unit" label="单位">
            <Input placeholder="台 / 件 / kg" />
          </Form.Item>
          <Form.Item name="price" label="单价（元）">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            创建
          </Button>
        </Form>
      </Modal>

      {/* 出入库 */}
      <Modal
        open={stockOpen}
        title={`${stockType === "IN" ? "入库" : "出库"}：${stockProduct?.name ?? ""}`}
        onCancel={() => setStockOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={stockForm} layout="vertical" onFinish={onStock} style={{ marginTop: 12 }}>
          <Text type="secondary">
            当前库存：<Tag color="blue">{stockProduct?.stockQuantity ?? 0}</Tag>
            {stockType === "OUT" && "（不能超过当前库存）"}
          </Text>
          <Form.Item name="quantity" label="数量" rules={[{ required: true, message: "请输入数量" }]}>
            <InputNumber style={{ width: "100%" }} min={1} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            确认
          </Button>
        </Form>
      </Modal>

      {/* 流水 */}
      <Modal
        open={movementOpen}
        title={`出入库流水：${stockProduct?.name ?? ""}`}
        onCancel={() => setMovementOpen(false)}
        footer={null}
        width={480}
      >
        {movements.length === 0 ? (
          <EmptyState description="暂无流水记录" size="small" />
        ) : (
          movements.map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <Space>
                <StatusTag meta={{ text: MOVEMENT_META[m.type].text, color: MOVEMENT_META[m.type].color }} />
                <Text strong>{m.quantity}</Text>
                {m.remark && <Text type="secondary">{m.remark}</Text>}
              </Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {m.createdAt}
              </Text>
            </div>
          ))
        )}
      </Modal>
    </div>
  );
}

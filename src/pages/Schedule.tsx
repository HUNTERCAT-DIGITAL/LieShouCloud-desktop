/**
 * 日程页（智法云枢 · 案件节点/评审/会见/团队会议日程）.
 * 数据源:@lieshoucloud/core-web schedules.api。
 */
import { PlusOutlined } from "@ant-design/icons";
import { EmptyState } from "@lieshoucloud/ui";
import { useCallback, useEffect, useState } from "react";
import {
  confirmSchedule,
  createSchedule,
  deleteSchedule,
  getScheduleSummary,
  listSchedules,
} from "@lieshoucloud/core-web";
import type { MatterSchedule, ScheduleRequest, ScheduleType } from "@lieshoucloud/contract-types/business/legal";
import { App, Button, Card, Col, Form, Input, InputNumber, Modal, Popconfirm, Row, Select, Space, Statistic, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";

const TYPE_META: Record<ScheduleType, { text: string; color: string }> = {
  NODE_TASK: { text: "节点任务", color: "blue" },
  REVIEW: { text: "评审", color: "purple" },
  CLIENT_MEETING: { text: "客户会见", color: "green" },
  TEAM_MEETING: { text: "团队会议", color: "orange" },
};

export default function Schedule() {
  const { message } = App.useApp();
  const [items, setItems] = useState<MatterSchedule[]>([]);
  const [summary, setSummary] = useState<{ total: number; upcoming: number; confirmed: number }>({ total: 0, upcoming: 0, confirmed: 0 });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<ScheduleRequest>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([listSchedules(), getScheduleSummary()]);
      setItems(list);
      setSummary({
        total: s.workCount + s.meetingCount,
        upcoming: s.pendingConfirm,
        confirmed: list.filter((i: MatterSchedule) => i.confirmed).length,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    const values = await form.validateFields();
    await createSchedule(values);
    message.success("日程已创建");
    setOpen(false);
    form.resetFields();
    void load();
  };

  const doConfirm = async (id: number) => {
    await confirmSchedule(id);
    message.success("已确认");
    void load();
  };

  const doDelete = async (id: number) => {
    await deleteSchedule(id);
    message.success("已删除");
    void load();
  };

  const columns: ColumnsType<MatterSchedule> = [
    { title: "日期", dataIndex: "scheduleDate", width: 110 },
    { title: "开始", width: 70, render: (_, r) => `${Math.floor(r.startMinute / 60)}:${String(r.startMinute % 60).padStart(2, "0")}` },
    { title: "类型", dataIndex: "scheduleType", width: 100, render: (v: ScheduleType) => <Tag color={TYPE_META[v]?.color}>{TYPE_META[v]?.text ?? v}</Tag> },
    { title: "事项", dataIndex: "title", ellipsis: true },
    { title: "案件", dataIndex: "caseTitle", width: 140, render: (v) => v ?? "—" },
    { title: "状态", width: 90, render: (_, r) => r.confirmed ? <Tag color="success">已确认</Tag> : <Tag color="orange">待确认</Tag> },
    { title: "操作", width: 150, render: (_, r) => (
        <Space size={4}>
          {!r.confirmed && <Button size="small" onClick={() => void doConfirm(r.id)}>确认</Button>}
          <Popconfirm title="删除该日程?" onConfirm={() => void doDelete(r.id)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ) },
  ];

  return (
    <>
      <Row gutter={12} style={{ marginBottom: 12 }}>
        <Col span={8}><Card><Statistic title="日程总数" value={summary.total} /></Card></Col>
        <Col span={8}><Card><Statistic title="待确认" value={summary.total - summary.confirmed} valueStyle={{ color: "#fa8c16" }} /></Card></Col>
        <Col span={8}><Card><Statistic title="已确认" value={summary.confirmed} valueStyle={{ color: "#52c41a" }} /></Card></Col>
      </Row>
      <Card
        title="日程"
        extra={<Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setOpen(true); }}>新建日程</Button>}
      >
        <Table<MatterSchedule> rowKey="id" columns={columns} dataSource={items} loading={loading} pagination={false} locale={{ emptyText: <EmptyState description="暂无日程" /> }} />
      </Card>
      <Modal title="新建日程" open={open} onOk={() => void save()} onCancel={() => setOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical" initialValues={{ scheduleType: "NODE_TASK", startMinute: 540, durationMinutes: 60 }}>
          <Form.Item name="title" label="事项" rules={[{ required: true }]}>
            <Input placeholder="日程事项" />
          </Form.Item>
          <Form.Item name="scheduleDate" label="日期" rules={[{ required: true }]}>
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="scheduleType" label="类型">
            <Select options={Object.entries(TYPE_META).map(([v, m]) => ({ value: v, label: m.text }))} />
          </Form.Item>
          <Form.Item name="caseId" label="关联案件 ID">
            <InputNumber style={{ width: "100%" }} min={1} />
          </Form.Item>
          <Form.Item name="startMinute" label="开始(分钟,0=00:00)">
            <InputNumber style={{ width: "100%" }} min={0} max={1439} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

/**
 * 案件团队 Tab（智法云枢 · 分工授权 + 五角色席位）.
 * 数据源:@lieshoucloud/core-web assignments.api + roles.api。
 */
import { PlusOutlined } from "@ant-design/icons";
import { EmptyState } from "@lieshoucloud/ui";
import { useCallback, useEffect, useState } from "react";
import {
  createAssignment,
  listAssignments,
  listCaseRoles,
  updateAssignment,
  updateCaseRoles,
} from "@lieshoucloud/core-web";
import type {
  AssignmentRequest,
  AssignmentStatus,
  CaseAssignment,
  CaseRole,
  CaseRoleRequest,
  SeatCode,
} from "@lieshoucloud/contract-types/business/legal";
import { App, Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";

const STATUS_META: Record<AssignmentStatus, { text: string; color: string }> = {
  ASSIGNED: { text: "已指派", color: "blue" },
  IN_PROGRESS: { text: "进行中", color: "processing" },
  REVIEWING: { text: "复核中", color: "gold" },
  COMPLETED: { text: "已完成", color: "success" },
};

const SEAT_META: Record<SeatCode, { text: string; color: string }> = {
  CASE_SOURCE: { text: "案源律师", color: "cyan" },
  LEAD: { text: "主办律师", color: "geekblue" },
  ASSOCIATE: { text: "协办律师", color: "blue" },
  ASSISTANT: { text: "助理律师", color: "purple" },
  SECRETARY: { text: "法律秘书", color: "default" },
};

export default function TeamTab({ caseId }: { caseId: number }) {
  const { message } = App.useApp();
  const [assignments, setAssignments] = useState<CaseAssignment[]>([]);
  const [roles, setRoles] = useState<CaseRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<AssignmentRequest>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, r] = await Promise.all([listAssignments(caseId), listCaseRoles(caseId)]);
      setAssignments(a);
      setRoles(r);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    const values = await form.validateFields();
    await createAssignment(caseId, values);
    message.success("分工已指派");
    setOpen(false);
    form.resetFields();
    void load();
  };

  const advanceStatus = async (r: CaseAssignment) => {
    const order: AssignmentStatus[] = ["ASSIGNED", "IN_PROGRESS", "REVIEWING", "COMPLETED"];
    const next = order[Math.min(order.indexOf(r.status) + 1, order.length - 1)];
    await updateAssignment(r.id, { stageCode: r.stageCode, taskType: r.taskType, ownerUserId: r.ownerUserId, reviewerUserId: r.reviewerUserId ?? undefined, status: next });
    message.success("状态已推进");
    void load();
  };

  const assignSeat = async (seatCode: SeatCode) => {
    // 弹出输入成员 ID 的简化交互:改用 Modal.prompt 风格——直接收一个成员
    let memberUserId = 0;
    try {
      // 简单做法:提示输入(桌面端可用 window.prompt)
      const raw = window.prompt(`指定「${SEAT_META[seatCode].text}」成员用户 ID`);
      if (!raw) return;
      memberUserId = Number(raw);
      if (!memberUserId) return;
      const next: CaseRoleRequest[] = [
        ...roles.filter((r) => r.seatCode !== seatCode).map((r) => ({ seatCode: r.seatCode, memberUserId: r.memberUserId })),
        { seatCode, memberUserId },
      ];
      await updateCaseRoles(caseId, next);
      message.success("席位已更新");
      void load();
    } catch {
      /* 取消/非法输入忽略 */
    }
  };

  const assignmentColumns: ColumnsType<CaseAssignment> = [
    { title: "任务类型", dataIndex: "taskType", width: 140 },
    { title: "阶段", dataIndex: "stageCode", width: 130 },
    { title: "执行人", dataIndex: "ownerUserId", width: 80 },
    { title: "复核人", dataIndex: "reviewerUserId", width: 80, render: (v) => v ?? "—" },
    { title: "状态", dataIndex: "status", width: 100, render: (v: AssignmentStatus) => <Tag color={STATUS_META[v]?.color}>{STATUS_META[v]?.text ?? v}</Tag> },
    { title: "操作", width: 90, render: (_, r) => r.status !== "COMPLETED" && <Button size="small" onClick={() => void advanceStatus(r)}>推进</Button> },
  ];

  return (
    <>
      <Row gutter={12}>
        <Col span={15}>
          <Card
            title={`分工授权 (${assignments.length})`}
            extra={<Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setOpen(true); }}>新建分工</Button>}
          >
            <Table<CaseAssignment> rowKey="id" columns={assignmentColumns} dataSource={assignments} loading={loading} pagination={false} size="small" locale={{ emptyText: <EmptyState description="暂无分工" /> }} />
          </Card>
        </Col>
        <Col span={9}>
          <Card title="五角色席位">
            <Table<CaseRole> rowKey="id" columns={[
              { title: "席位", dataIndex: "seatCode", render: (v: SeatCode) => <Tag color={SEAT_META[v]?.color}>{SEAT_META[v]?.text ?? v}</Tag> },
              { title: "成员", dataIndex: "memberUserId", width: 70 },
              { title: "操作", width: 90, render: (_, r) => <Button size="small" onClick={() => void assignSeat(r.seatCode)}>换人</Button> },
            ]} dataSource={roles} pagination={false} size="small" locale={{ emptyText: <EmptyState description="未配置席位" /> }} />
          </Card>
        </Col>
      </Row>
      <Modal title="新建分工" open={open} onOk={() => void save()} onCancel={() => setOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="taskType" label="任务类型" rules={[{ required: true }]}>
            <Select options={["策略分析", "文书起草", "检索报告", "证据整理", "客户沟通"].map((t) => ({ value: t, label: t }))} />
          </Form.Item>
          <Form.Item name="stageCode" label="案件阶段" rules={[{ required: true }]}>
            <Input placeholder="如 STRATEGY_REPORT" />
          </Form.Item>
          <Form.Item name="ownerUserId" label="执行人 ID" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} min={1} />
          </Form.Item>
          <Form.Item name="reviewerUserId" label="复核人 ID">
            <InputNumber style={{ width: "100%" }} min={1} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}


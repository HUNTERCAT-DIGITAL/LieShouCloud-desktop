/**
 * 智法云枢 · 案件列表（桌面端核心页）.
 *
 * 列表 → 详情（八阶段推进主链路）+ 案件 CRUD(新建/编辑/删除)。
 */
import { PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { EmptyState, StatusTag } from "@lieshoucloud/ui";
import { App, Button, Card, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, Typography } from "antd";
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
import { createCase, deleteCase, listCases, updateCase } from "../services/case";

const { Text } = Typography;

const STAGE_OPTIONS = (Object.keys(CASE_STAGE_META) as CaseStage[]).map((s) => ({
  label: CASE_STAGE_META[s].text,
  value: s,
}));
const STATUS_OPTIONS = (Object.keys(CASE_STATUS_META) as CaseStatus[]).map((s) => ({
  label: CASE_STATUS_META[s].text,
  value: s,
}));
const TYPE_OPTIONS = (Object.keys(CASE_TYPE_META) as (keyof typeof CASE_TYPE_META)[]).map((v) => ({
  label: CASE_TYPE_META[v],
  value: v,
}));
const PRIORITY_OPTIONS = (Object.keys(CASE_PRIORITY_META) as CasePriority[]).map((s) => ({
  label: CASE_PRIORITY_META[s].text,
  value: s,
}));

interface CaseFormValues {
  caseNo: string;
  title: string;
  caseType?: string;
  stage?: CaseStage;
  priority?: CasePriority;
  party?: string;
  oppositeParty?: string;
  court?: string;
  status?: CaseStatus;
  responsibleLawyer?: string;
  coLawyer?: string;
  amount?: number;
  filedAt?: string;
  remark?: string;
}

export default function Cases() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LegalCase[]>([]);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [stage, setStage] = useState<CaseStage | undefined>(undefined);
  const [status, setStatus] = useState<CaseStatus | undefined>(undefined);
  const [editing, setEditing] = useState<LegalCase | null>(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<CaseFormValues>();

  const load = async (p = 0) => {
    setLoading(true);
    try {
      const res = await listCases({ keyword: keyword || undefined, stage, status, page: p, size: 20 });
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

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ stage: "CLIENT_MEETING", status: "INTAKE", priority: "MEDIUM" });
    setOpen(true);
  };

  const openEdit = (c: LegalCase) => {
    setEditing(c);
    form.setFieldsValue({
      caseNo: c.caseNo,
      title: c.title,
      caseType: c.caseType,
      stage: c.stage,
      priority: c.priority,
      party: c.party ?? undefined,
      oppositeParty: c.oppositeParty ?? undefined,
      court: c.court ?? undefined,
      status: c.status,
      responsibleLawyer: c.responsibleLawyer ?? undefined,
      coLawyer: c.coLawyer ?? undefined,
      amount: c.amount ?? undefined,
      filedAt: c.filedAt ?? undefined,
      remark: c.remark ?? undefined,
    });
    setOpen(true);
  };

  const submit = async (v: CaseFormValues) => {
    const body = {
      caseNo: v.caseNo,
      title: v.title,
      caseType: v.caseType as LegalCase["caseType"],
      stage: v.stage,
      priority: v.priority,
      party: v.party || undefined,
      oppositeParty: v.oppositeParty || undefined,
      court: v.court || undefined,
      status: v.status,
      responsibleLawyer: v.responsibleLawyer || undefined,
      coLawyer: v.coLawyer || undefined,
      amount: v.amount,
      filedAt: v.filedAt || undefined,
      remark: v.remark || undefined,
    };
    try {
      if (editing) await updateCase(editing.id, body);
      else await createCase(body);
      message.success(editing ? "已保存" : "案件已创建");
      setOpen(false);
      void load(0);
    } catch (e) {
      message.error(String(e));
    }
  };

  const onDelete = (c: LegalCase) => {
    Modal.confirm({
      title: `删除案件 ${c.caseNo}？`,
      content: "删除后不可恢复",
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteCase(c.id);
        message.success("已删除");
        void load(0);
      },
    });
  };

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
    {
      title: "操作",
      key: "action",
      width: 140,
      render: (_, row) => (
        <Space onClick={(e) => e.stopPropagation()}>
          <Button type="link" size="small" onClick={() => openEdit(row)}>
            编辑
          </Button>
          <Button type="link" size="small" danger onClick={() => onDelete(row)}>
            删除
          </Button>
        </Space>
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
          style={{ width: 240 }}
        />
        <Select
          placeholder="办理阶段"
          value={stage}
          onChange={setStage}
          options={STAGE_OPTIONS}
          allowClear
          style={{ width: 150 }}
        />
        <Select
          placeholder="案件状态"
          value={status}
          onChange={setStatus}
          options={STATUS_OPTIONS}
          allowClear
          style={{ width: 130 }}
        />
        <Button icon={<ReloadOutlined />} onClick={() => void load(0)}>
          刷新
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新建案件
        </Button>
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
      <Modal
        title={editing ? `编辑案件 ${editing.caseNo}` : "新建案件"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
        width={560}
      >
        <Form<CaseFormValues> form={form} layout="vertical" onFinish={submit} requiredMark={false}>
          <Space size="middle" style={{ display: "flex" }}>
            <Form.Item label="案号" name="caseNo" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="如:(2026)赣0102民初123号" />
            </Form.Item>
            <Form.Item label="类型" name="caseType" style={{ flex: 1 }}>
              <Select options={TYPE_OPTIONS} placeholder="案件类型" />
            </Form.Item>
          </Space>
          <Form.Item label="案件标题" name="title" rules={[{ required: true }]}>
            <Input placeholder="如:某某买卖合同纠纷" />
          </Form.Item>
          <Space size="middle" style={{ display: "flex" }}>
            <Form.Item label="办理阶段" name="stage" style={{ flex: 1 }}>
              <Select options={STAGE_OPTIONS} />
            </Form.Item>
            <Form.Item label="状态" name="status" style={{ flex: 1 }}>
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item label="关注度" name="priority" style={{ flex: 1 }}>
              <Select options={PRIORITY_OPTIONS} />
            </Form.Item>
          </Space>
          <Space size="middle" style={{ display: "flex" }}>
            <Form.Item label="委托方" name="party" style={{ flex: 1 }}>
              <Input placeholder="我方当事人" />
            </Form.Item>
            <Form.Item label="对方当事人" name="oppositeParty" style={{ flex: 1 }}>
              <Input placeholder="对方当事人" />
            </Form.Item>
          </Space>
          <Space size="middle" style={{ display: "flex" }}>
            <Form.Item label="承办律师" name="responsibleLawyer" style={{ flex: 1 }}>
              <Input placeholder="承办律师" />
            </Form.Item>
            <Form.Item label="协办律师" name="coLawyer" style={{ flex: 1 }}>
              <Input placeholder="协办律师(可选)" />
            </Form.Item>
            <Form.Item label="标的额(元)" name="amount" style={{ flex: 1 }}>
              <InputNumber style={{ width: "100%" }} min={0} placeholder="0" />
            </Form.Item>
          </Space>
          <Space size="middle" style={{ display: "flex" }}>
            <Form.Item label="受理法院" name="court" style={{ flex: 1 }}>
              <Input placeholder="受理法院(可选)" />
            </Form.Item>
            <Form.Item label="立案日期" name="filedAt" style={{ flex: 1 }}>
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
          </Space>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

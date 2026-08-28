/**
 * 智法云枢 · 个人中心.
 * 展示当前登录用户信息(/auth/me) + 头像配色(前端本地) + 修改密码(管理端 updateUser 能力,权限不足提示)。
 */
import { LockOutlined, ReloadOutlined } from "@ant-design/icons";
import { RoleTag } from "@lieshoucloud/ui";
import {
  App,
  Avatar,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Space,
  Tooltip,
  Typography,
} from "antd";
import { useEffect, useState } from "react";

import { useAuthStore } from "../stores/auth";
import { AVATAR_COLORS, getAvatarColor, setAvatarColor } from "../utils/avatar";
import { changeMyPassword } from "../services/user";
import type { CurrentUser } from "@lieshoucloud/contract-types/business/auth";

const { Text } = Typography;

interface PwdValues {
  oldPassword: string;
  newPassword: string;
  confirm: string;
}

export default function Profile() {
  const cached = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const { message } = App.useApp();
  const [me, setMe] = useState<CurrentUser | null>(cached);
  const [loading, setLoading] = useState(false);
  const [color, setColor] = useState(() => getAvatarColor(cached?.username));
  const [pwdForm] = Form.useForm<PwdValues>();

  const load = async () => {
    setLoading(true);
    try {
      const fresh = await fetchMe();
      setMe(fresh);
    } catch {
      /* 拉取失败保留缓存 */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickColor = (c: string) => {
    setColor(c);
    setAvatarColor(c);
  };

  /** 改密码:调自助接口(校验原密码;framework 业务源,普通用户即可用) */
  const submitPwd = async (v: PwdValues) => {
    try {
      await changeMyPassword(v.oldPassword, v.newPassword);
      message.success("密码已更新,下次登录请使用新密码");
      pwdForm.resetFields();
    } catch (e) {
      const msg = String(e);
      if (msg.includes("OLD_PASSWORD_MISMATCH") || msg.includes("原密码")) {
        message.error("原密码不正确");
      } else if (msg.includes("INVALID_PASSWORD") || msg.includes("至少")) {
        message.error("新密码至少 6 位");
      } else {
        message.error(msg);
      }
    }
  };

  return (
    <Card
      title="个人中心"
      extra={
        <Button icon={<ReloadOutlined />} loading={loading} onClick={() => void load()}>
          刷新
        </Button>
      }
      style={{ maxWidth: 640 }}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Space align="center" size="middle">
          <Avatar size={56} style={{ background: color }}>
            {me?.username?.[0]?.toUpperCase() ?? "U"}
          </Avatar>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{me?.username ?? "—"}</div>
            <Text type="secondary">@{me?.username ?? "—"}</Text>
          </div>
        </Space>

        {/* 头像配色 */}
        <Card size="small" title="头像配色">
          <Space wrap>
            {AVATAR_COLORS.map((c) => (
              <Tooltip key={c} title={color === c ? "当前配色" : "设为头像色"}>
                <span
                  onClick={() => pickColor(c)}
                  style={{
                    display: "inline-block",
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: c,
                    cursor: "pointer",
                    border: color === c ? "3px solid #fff" : "none",
                    boxShadow: color === c ? `0 0 0 2px ${c}` : "0 0 0 1px rgba(0,0,0,0.1)",
                  }}
                />
              </Tooltip>
            ))}
          </Space>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              配色保存在本机,顶栏头像同步生效
            </Text>
          </div>
        </Card>

        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="用户 ID">{me?.userId ?? "—"}</Descriptions.Item>
          <Descriptions.Item label="租户">
            {me?.tenantName ? `${me.tenantName} (${me.tenantCode})` : me?.tenantCode ?? "—"}
          </Descriptions.Item>
          <Descriptions.Item label="版别">{me?.tenantEdition ?? "—"}</Descriptions.Item>
          <Descriptions.Item label="角色">
            <Space wrap>
              {me?.roles?.length ? me.roles.map((r) => <RoleTag key={r} role={r} />) : "—"}
            </Space>
          </Descriptions.Item>
        </Descriptions>

        {/* 修改密码 */}
        <Card size="small" title={<Space><LockOutlined />修改密码</Space>}>
          <Form form={pwdForm} layout="vertical" onFinish={submitPwd} requiredMark={false}>
            <Form.Item
              label="当前密码"
              name="oldPassword"
              rules={[{ required: true, message: "请输入当前密码" }]}
            >
              <Input.Password placeholder="当前登录密码" />
            </Form.Item>
            <Form.Item
              label="新密码"
              name="newPassword"
              rules={[
                { required: true, message: "请输入新密码" },
                { min: 6, message: "至少 6 位" },
              ]}
            >
              <Input.Password placeholder="至少 6 位" />
            </Form.Item>
            <Form.Item
              label="确认新密码"
              name="confirm"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "请再次输入新密码" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) return Promise.resolve();
                    return Promise.reject(new Error("两次输入的密码不一致"));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="再次输入新密码" />
            </Form.Item>
            <Button type="primary" htmlType="submit">
              更新密码
            </Button>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                需校验当前密码;所有账号均可自助修改。
              </Text>
            </div>
          </Form>
        </Card>
      </Space>
    </Card>
  );
}

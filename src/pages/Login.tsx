/**
 * Desktop Login 页面（Phase 9 · desktop）.
 *
 * 复用 ui 包 EmptyState；轻量 antd Form。失败展示后端 message。
 */
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { DEFAULT_TENANT_CODE } from "@lieshoucloud/contract-config";
import { Alert, Button, Card, Form, Input, Space, Typography } from "antd";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import WindowControls from "../components/WindowControls";
import { getEdition } from "../config/editions";
import { isApiError } from "../services/auth";
import { useAuthStore } from "../stores/auth";
import { colors } from "../theme/colors";

const { Title } = Typography;

interface LoginForm {
  username: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (isAuthenticated) {
    const from = (location.state as { from?: string } | null)?.from ?? "/welcome";
    return <Navigate to={from} replace />;
  }

  const onFinish = async (values: LoginForm) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      // 客户专属桌面端：默认租户 jxlkas（凌科安时），登录请求显式携带
      await login(values.username, values.password, DEFAULT_TENANT_CODE);
      const from = (location.state as { from?: string } | null)?.from ?? "/welcome";
      navigate(from, { replace: true });
    } catch (e) {
      if (isApiError(e)) {
        setErrorMsg(`登录失败（${e.message || "未知"}）`);
      } else {
        setErrorMsg(`登录失败: ${String(e)}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div className="light-titlebar" style={styles.titlebar}>
        <div data-tauri-drag-region style={{ flex: 1, height: "100%" }} />
        <WindowControls />
      </div>
      <Card style={styles.card} styles={{ body: { padding: "36px 40px" } }}>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <div style={styles.brand}>
            <img src="/brand-logo.png" alt="logo" style={styles.brandLogo} />
            <div>
              <div style={styles.brandText}>{getEdition().brandName}</div>
              <div style={styles.slogan}>凌科安时 · 智能法律服务平台</div>
            </div>
          </div>
          <Title level={4} style={{ margin: 0 }}>
            登录
          </Title>
          {errorMsg && <Alert type="error" message={errorMsg} showIcon />}
          <Form<LoginForm>
            name="desktop-login"
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            requiredMark={false}
          >
            <Form.Item label="用户名" name="username" rules={[{ required: true, message: "请输入用户名" }]}>
              <Input prefix={<UserOutlined />} placeholder="请输入用户名" autoFocus size="large" />
            </Form.Item>
            <Form.Item label="密码" name="password" rules={[{ required: true, message: "请输入密码" }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" size="large" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" loading={submitting} size="large" block>
                登录
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
      <div style={styles.footer}>智法云枢 · 桌面客户端 v0.0.1</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    position: "relative",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: `linear-gradient(135deg, ${colors.siderBg} 0%, ${colors.siderBgLight} 45%, ${colors.primary} 100%)`,
    padding: 16,
  },
  titlebar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 36,
    display: "flex",
  },
  card: {
    width: 420,
    borderRadius: 12,
    boxShadow: "0 16px 48px rgba(0,0,0,0.24)",
    border: "none",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  brandLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    objectFit: "cover",
  },
  brandText: {
    fontSize: 20,
    fontWeight: 700,
    color: colors.text,
    letterSpacing: 1,
  },
  slogan: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    marginTop: 16,
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
};

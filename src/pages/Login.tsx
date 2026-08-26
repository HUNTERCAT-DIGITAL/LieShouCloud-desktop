/**
 * Desktop Login 页面（Phase 9 · desktop）.
 *
 * 复用 ui 包 EmptyState；轻量 antd Form。失败展示后端 message。
 */
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { EmptyState } from "@lieshoucloud/ui";
import { Alert, Button, Card, Form, Input, Space, Typography } from "antd";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { colors } from "../theme/colors";
import { isApiError } from "../services/auth";
import { useAuthStore } from "../stores/auth";

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
      await login(values.username, values.password);
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
      <Card style={styles.card}>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Space>
            <div style={styles.dot} />
            <span style={styles.brandText}>LieShou Cloud</span>
          </Space>
          <Title level={3} style={{ margin: 0 }}>
            登录 · Desktop
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
              <Input prefix={<UserOutlined />} placeholder="futurewl" autoFocus size="large" />
            </Form.Item>
            <Form.Item label="密码" name="password" rules={[{ required: true, message: "请输入密码" }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="password" size="large" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" loading={submitting} size="large" block>
                登录
              </Button>
            </Form.Item>
          </Form>
          <EmptyState description="Desktop 是 Tauri 桌面应用，与 Web Admin 共享后端 / 共享 ui 包" size="small" />
        </Space>
      </Card>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: colors.bg,
    padding: 16,
  },
  card: {
    width: 420,
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    background: colors.primary,
    marginRight: 8,
  },
  brandText: {
    fontSize: 16,
    fontWeight: 600,
  },
};

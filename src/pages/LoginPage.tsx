/**
 * 管理后台 · 登录页（端自身骨架 · 登录态来自 core-web useAuthStore）.
 *
 * 三种能力：密码登录（记住密码）/ 短信验证码登录 / 忘记密码（短信验证码重置）。
 * 单租户部署（login.hideTenantInput）隐藏租户框，固定 edition.tenantCode。
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Button, Input, Modal, Segmented } from 'antd';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  loginWithCode,
  resetPassword,
  sendCode,
  useAuthStore,
} from '@lieshoucloud/core-web';

import { getEdition } from '../config/editions';
import { APP_VERSION } from '../config/version';
import { checkForUpdates, isTauri } from '../lib/updater';

/** 记住密码（明文存 localStorage，仅「记住密码」勾选时） */
const REMEMBER_KEY = 'lieshoucloud:remember';

interface RememberData {
  account: string;
  password: string;
}

function readRemember(): RememberData | null {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY);
    return raw ? (JSON.parse(raw) as RememberData) : null;
  } catch {
    return null;
  }
}

export default function LoginPage() {
  const edition = getEdition();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useAuthStore((s) => s.login);
  const setSession = useAuthStore((s) => s.setSession);

  const hideTenantInput = edition.login?.hideTenantInput === true;
  const [tenantCode, setTenantCode] = useState(edition.tenantCode ?? 'default');

  // 登录模式
  const [mode, setMode] = useState<'password' | 'sms'>('password');

  // 记住密码
  const saved = useMemo(() => readRemember(), []);
  const [remember, setRemember] = useState(saved !== null);
  const [account, setAccount] = useState(saved?.account ?? '');
  const [password, setPassword] = useState(saved?.password ?? '');

  // 验证码登录
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  // 忘记密码
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotPassword, setForgotPassword] = useState('');
  const [forgotCountdown, setForgotCountdown] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);
  useEffect(() => {
    if (forgotCountdown <= 0) return;
    const t = setInterval(() => setForgotCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [forgotCountdown]);

  async function handlePasswordLogin(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(account.trim(), password, tenantCode);
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify({ account: account.trim(), password }));
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      navigate(edition.homePath ?? '/home', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function sendLoginCode(): Promise<void> {
    if (!phone.trim()) return;
    setError(null);
    try {
      await sendCode('SMS', phone.trim(), 'LOGIN');
      setCountdown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleSmsLogin(): Promise<void> {
    setError(null);
    setSubmitting(true);
    try {
      const token = await loginWithCode(tenantCode, 'SMS', phone.trim(), code.trim());
      setSession(token);
      navigate(edition.homePath ?? '/home', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function sendForgotCode(): Promise<void> {
    if (!forgotPhone.trim()) return;
    setForgotError(null);
    try {
      await sendCode('SMS', forgotPhone.trim(), 'RESET_PASSWORD');
      setForgotCountdown(60);
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleResetPassword(): Promise<void> {
    setForgotError(null);
    setSubmitting(true);
    try {
      await resetPassword(
        edition.tenantCode,
        'SMS',
        forgotPhone.trim(),
        forgotCode.trim(),
        forgotPassword,
      );
      setForgotOpen(false);
      setForgotPhone('');
      setForgotCode('');
      setForgotPassword('');
      setMode('password');
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  // 已登录重定向（放所有 hooks 之后——避免 early return 破坏 hooks 顺序导致 React 崩）
  if (isAuthenticated) return <Navigate to={edition.homePath ?? '/home'} replace />;

  return (
    <div className="login-page">
      <div className="login-brand">
        <h1 className="login-title">{edition.brandName}</h1>
        {edition.slogan && <p className="login-slogan">{edition.slogan}</p>}
      </div>

      <form className="login-card" onSubmit={handlePasswordLogin}>
        <Segmented
          block
          value={mode}
          onChange={(v) => {
            setMode(v as 'password' | 'sms');
            setError(null);
          }}
          options={[
            { label: '密码登录', value: 'password' },
            { label: '验证码登录', value: 'sms' },
          ]}
          style={{ marginBottom: 16 }}
        />

        {!hideTenantInput && (
          <label className="field">
            <span className="field-label">租户</span>
            <input
              className="field-input"
              value={tenantCode}
              onChange={(e) => setTenantCode(e.target.value)}
              placeholder="租户编码"
              autoComplete="organization"
            />
          </label>
        )}

        {mode === 'password' ? (
          <>
            <label className="field">
              <span className="field-label">账号</span>
              <input
                className="field-input"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="用户名 / 手机号"
                autoComplete="username"
                required
              />
            </label>
            <label className="field">
              <span className="field-label">密码</span>
              <input
                className="field-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密码"
                autoComplete="current-password"
                required
              />
            </label>
            <div className="login-options">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                记住密码
              </label>
              <button
                type="button"
                className="login-forgot-link"
                onClick={() => {
                  setForgotOpen(true);
                  setForgotError(null);
                }}
              >
                忘记密码？
              </button>
            </div>
          </>
        ) : (
          <>
            <label className="field">
              <span className="field-label">手机号</span>
              <input
                className="field-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="手机号"
                autoComplete="tel"
                required
              />
            </label>
            <label className="field">
              <span className="field-label">验证码</span>
              <div className="login-code-row">
                <input
                  className="field-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="6 位验证码"
                  autoComplete="one-time-code"
                  required
                />
                <Button
                  type="primary"
                  ghost
                  disabled={countdown > 0 || !phone.trim()}
                  onClick={() => void sendLoginCode()}
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </Button>
              </div>
            </label>
          </>
        )}

        {error && <p className="login-error">{error}</p>}

        <Button
          type="primary"
          block
          htmlType={mode === 'password' ? 'submit' : 'button'}
          loading={submitting}
          style={{ height: 44, fontSize: 16 }}
          onClick={mode === 'sms' ? () => void handleSmsLogin() : undefined}
        >
          {mode === 'password' ? '登 录' : '验证码登录'}
        </Button>
      </form>

      {/* 页脚：版本号 + 检查更新（沉浸式） */}
      <footer className="login-footer">
        <span>v{APP_VERSION}</span>
        {isTauri() && (
          <button
            className="login-check-update"
            type="button"
            onClick={() => void checkForUpdates(false)}
          >
            检查更新
          </button>
        )}
      </footer>

      {/* 忘记密码 */}
      <Modal
        title="忘记密码"
        open={forgotOpen}
        onCancel={() => setForgotOpen(false)}
        onOk={() => void handleResetPassword()}
        okText="重置密码"
        okButtonProps={{ loading: submitting, disabled: !forgotPassword }}
        destroyOnClose
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <Input
            placeholder="手机号"
            value={forgotPhone}
            onChange={(e) => setForgotPhone(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              placeholder="6 位验证码"
              value={forgotCode}
              onChange={(e) => setForgotCode(e.target.value)}
            />
            <Button
              disabled={forgotCountdown > 0 || !forgotPhone.trim()}
              onClick={() => void sendForgotCode()}
            >
              {forgotCountdown > 0 ? `${forgotCountdown}s` : '获取验证码'}
            </Button>
          </div>
          <Input.Password
            placeholder="新密码"
            value={forgotPassword}
            onChange={(e) => setForgotPassword(e.target.value)}
          />
          {forgotError && <p className="login-error" style={{ margin: 0 }}>{forgotError}</p>}
        </div>
      </Modal>
    </div>
  );
}

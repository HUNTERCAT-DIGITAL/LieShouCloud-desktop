/**
 * 桌面端 · 登录页（端自身骨架 · 登录态来自 core-web useAuthStore）
 * 租户 + 账号 + 密码 → core-web login（POST /api/auth/login）。
 */
import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@lieshoucloud/core-web';

import { getEdition } from '../config/editions';

export default function LoginPage() {
  const edition = getEdition();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useAuthStore((s) => s.login);
  // 单租户部署（login.hideTenantInput）隐藏租户框，固定用 edition.tenantCode（缺省 default）
  const hideTenantInput = edition.login?.hideTenantInput === true;
  const [tenantCode, setTenantCode] = useState(edition.tenantCode ?? 'default');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to={edition.homePath ?? '/home'} replace />;

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password, tenantCode.trim() || undefined);
      navigate(edition.homePath ?? '/home', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-brand">
        <h1 className="login-title">{edition.brandName}</h1>
        {edition.slogan && <p className="login-slogan">{edition.slogan}</p>}
      </div>
      <form className="login-card" onSubmit={handleSubmit}>
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
        <label className="field">
          <span className="field-label">账号</span>
          <input
            className="field-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="用户名"
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
        {error && <p className="login-error">{error}</p>}
        <button className="login-submit" type="submit" disabled={submitting}>
          {submitting ? '登录中…' : '登 录'}
        </button>
      </form>
    </div>
  );
}

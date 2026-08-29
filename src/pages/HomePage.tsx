/**
 * 桌面端 · 启动页（端自身骨架）
 * 品牌 + 平台标识 + 版本 + 登录用户 + 后端连通性检查（GET /api/auth/me）。
 */
import { useCallback, useEffect, useState } from 'react';

import { getEdition } from '../config/editions';
import { APP_VERSION } from '../config/version';
import { fetchMe, getUser, logout, type SessionUser } from '../lib/auth';

interface CheckState {
  loading: boolean;
  ok: boolean;
  message: string;
}

export default function HomePage() {
  const edition = getEdition();
  const [user, setUser] = useState<SessionUser | null>(() => getUser());
  const [check, setCheck] = useState<CheckState>({ loading: false, ok: false, message: '' });

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch(() => {
        /* 静默：守卫已兜底 */
      });
  }, []);

  const runCheck = useCallback(async () => {
    setCheck({ loading: true, ok: false, message: '' });
    try {
      const me = await fetchMe();
      setUser(me);
      setCheck({
        loading: false,
        ok: true,
        message: `后端连通正常（${me.username ?? '已登录'} @ ${me.tenantCode ?? '-'}）`,
      });
    } catch (err) {
      setCheck({
        loading: false,
        ok: false,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  return (
    <div className="home-page">
      <header className="home-header">
        <h2 className="home-title">{edition.brandName}</h2>
        <p className="home-slogan">{edition.slogan}</p>
      </header>

      <section className="home-card">
        <div className="home-row">
          <span className="home-key">平台</span>
          <span className="home-value">桌面端 · Tauri 2 + Vite + React</span>
        </div>
        <div className="home-row">
          <span className="home-key">版本</span>
          <span className="home-value">{APP_VERSION}</span>
        </div>
        <div className="home-row">
          <span className="home-key">版别</span>
          <span className="home-value">{edition.id}</span>
        </div>
        <div className="home-row">
          <span className="home-key">用户</span>
          <span className="home-value">
            {user?.displayName || user?.username || '未登录'}
            {user?.tenantName ? `（${user.tenantName}）` : ''}
          </span>
        </div>
      </section>

      <section className="home-actions">
        <button type="button" className="btn-primary" onClick={runCheck} disabled={check.loading}>
          {check.loading ? '检查中…' : '检查后端连通性'}
        </button>
        {check.message && (
          <p className={check.ok ? 'check-ok' : 'check-fail'}>{check.message}</p>
        )}
        <button type="button" className="btn-ghost" onClick={() => logout()}>
          退出登录
        </button>
      </section>
    </div>
  );
}

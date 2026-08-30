/**
 * 管理后台 · 门户页（公开官网 landing · 端自身骨架）.
 *
 * 结构：品牌 hero（logo/slogan/heroDesc + 登录 CTA）→ 产品介绍 → 产品功能卡片 → 多端入口
 * （H5 二维码 / 桌面端下载 / 移动端下载 / 小程序二维码）。
 * 内容（介绍/功能/入口）由 edition.portal 注入，端层只渲染结构。
 */
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@lieshoucloud/core-web';

import { getEdition } from '../config/editions';

export default function PortalPage() {
  const edition = getEdition();
  const portal = edition.portal;
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const go = () => navigate(isAuthenticated ? (edition.homePath ?? '/home') : '/login');

  return (
    <div className="portal-page">
      {/* ① 品牌 hero */}
      <section className="portal-hero">
        {edition.logo && (
          <img
            className="portal-logo"
            src={`${import.meta.env.BASE_URL}${edition.logo.replace(/^\//, '')}`}
            alt={edition.brandName}
          />
        )}
        <h1 className="portal-title">{edition.brandName}</h1>
        {edition.slogan && <p className="portal-slogan">{edition.slogan}</p>}
        {edition.heroDesc && <p className="portal-desc">{edition.heroDesc}</p>}
        <button type="button" className="portal-cta" onClick={go}>
          {isAuthenticated ? '进入工作台' : '登录进入'}
        </button>
      </section>

      {/* ② 产品介绍 */}
      {portal?.intro && portal.intro.length > 0 && (
        <section className="portal-section">
          <h2 className="portal-section-title">产品介绍</h2>
          <div className="portal-intro">
            {portal.intro.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      )}

      {/* ③ 产品功能 */}
      {portal?.features && portal.features.length > 0 && (
        <section className="portal-section">
          <h2 className="portal-section-title">产品功能</h2>
          <div className="feature-grid">
            {portal.features.map((f) => (
              <div className="feature-card" key={f.title}>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ④ 多端入口 */}
      {portal?.entries && portal.entries.length > 0 && (
        <section className="portal-section">
          <h2 className="portal-section-title">多端访问</h2>
          <div className="entry-grid">
            {portal.entries.map((e) => (
              <div className="entry-card" key={e.label}>
                <h3 className="entry-title">{e.label}</h3>
                {e.desc && <p className="entry-desc">{e.desc}</p>}
                {e.kind === 'qrcode' && e.url && (
                  <QRCodeSVG value={e.url} size={132} className="entry-qrcode" />
                )}
                {e.kind === 'download' && e.url && (
                  <a
                    className="entry-btn"
                    href={e.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    下载
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {edition.companyName && (
        <footer className="portal-footer">
          © {new Date().getFullYear()} {edition.companyName}
        </footer>
      )}
    </div>
  );
}

/**
 * 桌面端 · 门户页（公开品牌 landing · 端自身骨架）.
 *
 * 未登录游客可直达的品牌页：logo + 品牌名 + slogan + hero 副文案 + 主 CTA（登录/进入工作台）。
 * 与登录页互跳（登录页「前往门户」→ /portal；门户 CTA → /login）。
 */
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@lieshoucloud/core-web';

import { getEdition } from '../config/editions';

export default function PortalPage() {
  const edition = getEdition();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const go = () => {
    if (isAuthenticated) navigate(edition.homePath ?? '/home');
    else navigate('/login');
  };

  return (
    <div className="portal-page">
      <div className="portal-hero">
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
      </div>
    </div>
  );
}

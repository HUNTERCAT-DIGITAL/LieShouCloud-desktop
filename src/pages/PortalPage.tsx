/**
 * 桌面端 · 门户页（未登录公开落地页 · 端通用层 · 2026-09 沉浸式重建）.
 *
 * 沉浸式无边框界面：顶部自定义标题栏（拖拽区 + 品牌 + 窗口控制按钮）
 * → Hero（logo/标语/描述/CTA）→ 平台功能（extraRoutes 图标卡自动装配）→ 页脚。
 * 登录态访问自动回主页。
 */
import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Tag, Typography } from 'antd';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@lieshoucloud/core-web';

import { getEdition } from '../config/editions';
import { APP_VERSION } from '../config/version';
import { checkForUpdates, isTauri } from '../lib/updater';

const { Title, Paragraph } = Typography;

/** logo 完整路径（/desktop/ 子路径下需 BASE_URL 前缀） */
function logoUrl(logo?: string): string | undefined {
  if (!logo) return undefined;
  return `${import.meta.env.BASE_URL}${logo.replace(/^\//, '')}`;
}

export default function PortalPage() {
  const navigate = useNavigate();
  const edition = getEdition();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  // 已登录 → 直接进主页（避免门户/主页来回）
  if (isAuthenticated) return <Navigate to={edition.homePath ?? '/home'} replace />;

  return (
    <div className="portal-page">

      {/* ===== Hero：品牌 + 标语 + 描述 + CTA ===== */}
      <header className="portal-hero" id="hero">
        <div className="portal-hero-inner">
          <div className="portal-logo">
            {edition.logo ? (
              <img src={logoUrl(edition.logo)} alt={edition.brandName} />
            ) : (
              <span className="portal-logo-fallback">{edition.brandName?.slice(0, 1)}</span>
            )}
          </div>
          <Title level={1} className="portal-title">
            {edition.brandName}
          </Title>
          {edition.slogan && <Paragraph className="portal-slogan">{edition.slogan}</Paragraph>}
          {edition.heroDesc && <Paragraph className="portal-desc">{edition.heroDesc}</Paragraph>}
          <div className="portal-hero-actions">
            <Button
              type="primary"
              size="large"
              className="portal-cta"
              icon={<ArrowRightOutlined />}
              iconPosition="end"
              onClick={() => navigate('/login')}
            >
              进入系统
            </Button>
            {isTauri() && (
              <Button
                size="large"
                className="portal-update-btn"
                onClick={() => void checkForUpdates(false)}
              >
                检查更新
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ===== 页脚 ===== */}
      <footer className="portal-footer">
        <span>
          © {new Date().getFullYear()} {edition.companyName ?? edition.brandName}
        </span>
        <Tag className="portal-version-tag">v{APP_VERSION}</Tag>
      </footer>
    </div>
  );
}

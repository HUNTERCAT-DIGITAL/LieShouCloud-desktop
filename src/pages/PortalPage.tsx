/**
 * 桌面端 · 门户页（未登录公开落地页 · 端通用层）.
 *
 * 品牌 hero（brandName/slogan/heroDesc）+ 功能入口卡（从 extraRoutes 带 menu 的项派生，
 * 客户装配什么就展示什么）+ 进入系统 CTA + 页脚（版本号 + 检查更新）。
 * 登录态访问自动回主页（homePath）。
 */
import { Button, Card, Col, Row, Tag, Typography } from 'antd';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@lieshoucloud/core-web';

import { getEdition } from '../config/editions';
import { APP_VERSION } from '../config/version';
import { checkForUpdates, isTauri } from '../lib/updater';

const { Title, Paragraph, Text } = Typography;

export default function PortalPage() {
  const navigate = useNavigate();
  const edition = getEdition();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const entries = (edition.extraRoutes ?? [])
    .filter((r) => r.menu && !r.menu?.group)
    .slice(0, 6);

  // 已登录 → 直接进主页（避免门户/主页来回）
  if (isAuthenticated) return <Navigate to={edition.homePath ?? '/home'} replace />;

  return (
    <div className="portal-page">
      {/* Hero：品牌 + 标语 + 描述 + CTA */}
      <header className="portal-hero">
        <div className="portal-logo">
          {edition.logo ? (
            <img src={edition.logo} alt={edition.brandName} />
          ) : (
            <span className="portal-logo-fallback">{edition.brandName?.slice(0, 1)}</span>
          )}
        </div>
        <Title level={2} className="portal-title">
          {edition.brandName}
        </Title>
        {edition.slogan && <Paragraph className="portal-slogan">{edition.slogan}</Paragraph>}
        {edition.heroDesc && <Paragraph className="portal-desc">{edition.heroDesc}</Paragraph>}
        <Button type="primary" size="large" className="portal-cta" onClick={() => navigate('/login')}>
          进入系统
        </Button>
      </header>

      {/* 功能入口卡（客户装配的菜单项） */}
      {entries.length > 0 && (
        <section className="portal-features">
          <Row gutter={[16, 16]}>
            {entries.map((r) => (
              <Col key={r.path} xs={12} sm={8} md={6}>
                <Card
                  hoverable
                  className="portal-feature-card"
                  onClick={() => navigate('/login')}
                  title={<span className="portal-feature-icon">{r.menu?.icon}</span>}
                >
                  <Text strong>{r.menu?.name}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </section>
      )}

      {/* 页脚：版本号 + 检查更新 */}
      <footer className="portal-footer">
        <Tag>v{APP_VERSION}</Tag>
        {isTauri() && (
          <Button type="link" size="small" onClick={() => void checkForUpdates(false)}>
            检查更新
          </Button>
        )}
      </footer>
    </div>
  );
}

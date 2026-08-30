/**
 * 桌面端 · 门户页（未登录公开落地页 · 端通用层）.
 *
 * 现代化品牌 landing：Hero（品牌 + 标语 + 描述 + CTA）+ 功能入口卡
 * （extraRoutes 菜单项 → 真实 antd 图标）+ 页脚（版本号 + 检查更新）。
 * 登录态访问自动回主页（homePath）。
 */
import {
  AlertOutlined,
  ApartmentOutlined,
  AppstoreOutlined,
  DashboardOutlined,
  FundOutlined,
  FundProjectionScreenOutlined,
  HomeOutlined,
  MenuOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  ControlOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Row, Tag, Typography } from 'antd';
import type { ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@lieshoucloud/core-web';

import { getEdition } from '../config/editions';
import { APP_VERSION } from '../config/version';
import { checkForUpdates, isTauri } from '../lib/updater';

const { Title, Paragraph } = Typography;

/** 菜单 icon 字符串 → antd 图标（与 ConsoleLayout 同源映射） */
const ICON_MAP: Record<string, ReactNode> = {
  dashboard: <DashboardOutlined />,
  workbench: <DashboardOutlined />,
  home: <HomeOutlined />,
  alert: <AlertOutlined />,
  overview: <FundOutlined />,
  topo: <ApartmentOutlined />,
  device: <ThunderboltOutlined />,
  devices: <ThunderboltOutlined />,
  product: <AppstoreOutlined />,
  products: <AppstoreOutlined />,
  rule: <ControlOutlined />,
  rules: <ControlOutlined />,
  ops: <ToolOutlined />,
  cockpit: <FundProjectionScreenOutlined />,
  menu: <MenuOutlined />,
};

function iconOf(name?: string): ReactNode {
  return (name && ICON_MAP[name]) || <AppstoreOutlined />;
}

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
      {/* ===== Hero：品牌 + 标语 + 描述 + CTA ===== */}
      <header className="portal-hero">
        <div className="portal-hero-inner">
          <div className="portal-logo">
            {edition.logo ? (
              <img src={edition.logo} alt={edition.brandName} />
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
              <Button size="large" className="portal-update-btn" onClick={() => void checkForUpdates(false)}>
                检查更新
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ===== 功能入口卡（客户装配的菜单项 · 真实图标） ===== */}
      {entries.length > 0 && (
        <section className="portal-features">
          <div className="portal-section-title">
            <Title level={3}>平台功能</Title>
            <Paragraph>一站式数字化值守工作台</Paragraph>
          </div>
          <Row gutter={[20, 20]} justify="center">
            {entries.map((r) => (
              <Col key={r.path} xs={12} sm={8} md={6} lg={4}>
                <Card hoverable className="portal-feature-card" onClick={() => navigate('/login')}>
                  <div className="portal-feature-icon">{iconOf(r.menu?.icon)}</div>
                  <div className="portal-feature-name">{r.menu?.name}</div>
                </Card>
              </Col>
            ))}
          </Row>
        </section>
      )}

      {/* ===== 页脚：版本号 + 检查更新 ===== */}
      <footer className="portal-footer">
        <span className="portal-footer-brand">
          {edition.companyName ?? edition.brandName}
        </span>
        <Tag className="portal-version-tag">v{APP_VERSION}</Tag>
        {isTauri() && (
          <Button type="link" size="small" onClick={() => void checkForUpdates(false)}>
            检查更新
          </Button>
        )}
      </footer>
    </div>
  );
}

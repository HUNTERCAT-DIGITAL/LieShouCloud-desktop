/**
 * 桌面端 · 欢迎页（登录后落地 · 端通用层）.
 *
 * 欢迎语（用户名 + 品牌）+ 快捷入口卡（extraRoutes 带 menu 的项，登录态点击直达）
 * + 页脚（版本号 + 检查更新）。
 */
import { Button, Card, Col, Row, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@lieshoucloud/core-web';

import WindowControls from '../components/WindowControls';
import { getEdition } from '../config/editions';
import { APP_VERSION } from '../config/version';
import { checkForUpdates, isTauri } from '../lib/updater';

const { Title, Paragraph, Text } = Typography;

export default function WelcomePage() {
  const navigate = useNavigate();
  const edition = getEdition();
  const user = useAuthStore((s) => s.user);
  const entries = (edition.extraRoutes ?? []).filter((r) => r.menu);

  return (
    <div className="portal-page welcome-page">
      {/* 沉浸式标题栏（拖拽 + 窗口控制） */}
      <header className="portal-titlebar" data-tauri-drag-region>
        <div className="portal-titlebar-brand">
          <span className="portal-titlebar-name">{edition.brandName}</span>
        </div>
        <div className="portal-titlebar-right">
          <WindowControls />
        </div>
      </header>
      <header className="portal-hero">
        <Title level={2} className="portal-title">
          欢迎回来，{user?.username ?? '用户'}
        </Title>
        <Paragraph className="portal-desc">
          {edition.brandName}
          {edition.slogan ? ` · ${edition.slogan}` : ''}
        </Paragraph>
      </header>

      {/* 快捷入口（客户装配的菜单项 · 登录态直达） */}
      {entries.length > 0 && (
        <section className="portal-features">
          <Row gutter={[16, 16]}>
            {entries.map((r) => (
              <Col key={r.path} xs={12} sm={8} md={6}>
                <Card hoverable className="portal-feature-card" onClick={() => navigate(r.path)}>
                  <Text strong>{r.menu?.name}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </section>
      )}

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

/**
 * Desktop 基础布局（Phase 9 · desktop）.
 *
 * 简化版：admin 用 ProLayout，desktop 是独立 WebView 进程，自己写一个
 * 轻量 sidebar + topbar。注意复用 @lieshoucloud/ui 的 RoleTag / StatusTag。
 */
import { CloudSyncOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { RoleTag } from "@lieshoucloud/ui";
import { Avatar, Dropdown, Layout, Menu, Space } from "antd";
import type { MenuProps } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import WindowControls from "../components/WindowControls";
import { useUpdaterContext } from "../components/Updater";
import { useAuthStore } from "../stores/auth";
import { colors } from "../theme/colors";

import { getBranding, getEdition, getExtraEdition, isMenuHidden } from '../config/editions';

const { Header, Sider, Content } = Layout;

interface NavItem {
  key: string;
  label: string;
  path: string;
}

/** 通用菜单（所有版别基础；客户层可用 hiddenMenus 裁剪） */
const BASE_NAV: NavItem[] = [
  { key: "/welcome", label: "工作台", path: "/welcome" },
  { key: "/cases", label: "案件管理", path: "/cases" },
  { key: "/customers", label: "客户管理", path: "/customers" },
  { key: "/inventory", label: "库存管理", path: "/inventory" },
  { key: "/finance", label: "记账本", path: "/finance" },
  { key: "/approval", label: "审批流", path: "/approval" },
];


export default function BasicLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updater = useUpdaterContext();

  const edition = getEdition();
  const homePath = getExtraEdition().homePath;
  const visibleNav: NavItem[] = BASE_NAV.map((n) =>
    n.key === "/welcome" && homePath
      ? { key: homePath, label: "今日作战台", path: homePath }
      : n,
  ).filter((n) => !isMenuHidden(edition, n.path));

  const items: MenuProps["items"] = visibleNav.map((n) => ({
    key: n.path,
    label: n.label,
  }));

  const userMenu: MenuProps["items"] = [
    {
      key: "check-update",
      icon: <CloudSyncOutlined />,
      label: "检查更新",
      onClick: () => void updater.checkForUpdates(),
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      onClick: () => {
        logout();
        navigate("/login", { replace: true });
      },
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={208}
        style={{
          background: `linear-gradient(180deg, ${colors.siderBg} 0%, ${colors.siderBgLight} 100%)`,
          borderRight: "none",
        }}
      >
        <div style={styles.brand}>
          <img src={getBranding().logo} alt="logo" style={styles.brandLogo} />
          <span style={styles.brandText}>{getEdition().brandName}</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={items}
          onClick={({ key }) => navigate(key)}
          style={{ background: "transparent", border: "none", padding: "8px 6px" }}
        />
      </Sider>
      <Layout>
        <Header style={styles.header}>
          <div data-tauri-drag-region style={styles.dragArea}>
            <span style={styles.title}>
              {visibleNav.find((n) => n.path === location.pathname)?.label ?? ""}
            </span>
          </div>
          <Dropdown menu={{ items: userMenu }} placement="bottomRight">
            <Space style={{ cursor: "pointer", padding: "0 8px" }}>
              <Avatar size="small" icon={<UserOutlined />} style={{ background: colors.primary }}>
                {user?.username?.charAt(0).toUpperCase() ?? "?"}
              </Avatar>
              <span style={{ color: "#fff" }}>{user?.username ?? "未登录"}</span>
              {user?.roles.map((r: string) => <RoleTag key={r} role={r} />)}
            </Space>
          </Dropdown>
          <WindowControls />
        </Header>
        <Content style={styles.content}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "18px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  brandLogo: {
    width: 28,
    height: 28,
    borderRadius: 7,
    objectFit: "cover",
  },
  brandText: {
    fontSize: 16,
    fontWeight: 700,
    color: "#fff",
    letterSpacing: 1,
  },
  header: {
    background: `linear-gradient(180deg, ${colors.siderBg} 0%, ${colors.siderBgLight} 100%)`,
    borderBottom: "none",
    padding: "0 0 0 24px",
    display: "flex",
    alignItems: "center",
    height: 48,
  },
  dragArea: {
    flex: 1,
    height: "100%",
    display: "flex",
    alignItems: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: 600,
    color: "#fff",
  },
  content: {
    padding: 24,
    background: colors.pageBg,
    overflow: "auto",
    height: "calc(100vh - 48px)",
  },
};

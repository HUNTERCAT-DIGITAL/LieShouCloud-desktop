/**
 * Desktop 基础布局（Phase 9 · desktop）.
 *
 * 简化版：admin 用 ProLayout，desktop 是独立 WebView 进程，自己写一个
 * 轻量 sidebar + topbar。注意复用 @lieshoucloud/ui 的 RoleTag / StatusTag。
 */
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { RoleTag } from "@lieshoucloud/ui";
import { Avatar, Button, Dropdown, Layout, Menu, Space } from "antd";
import type { MenuProps } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuthStore } from "../stores/auth";
import { colors } from "../theme/colors";

const { Header, Sider, Content } = Layout;

interface NavItem {
  key: string;
  label: string;
  path: string;
}

const NAV: NavItem[] = [
  { key: "/welcome", label: "工作台", path: "/welcome" },
  { key: "/customers", label: "客户管理", path: "/customers" },
  { key: "/legal/cases", label: "案件管理", path: "/legal/cases" },
  { key: "/inventory", label: "库存管理", path: "/inventory" },
  { key: "/finance", label: "记账本", path: "/finance" },
  { key: "/approval", label: "审批流", path: "/approval" },
];

export default function BasicLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const items: MenuProps["items"] = NAV.map((n) => ({
    key: n.path,
    label: n.label,
  }));

  const userMenu: MenuProps["items"] = [
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
          background: colors.siderBg,
          borderRight: `1px solid ${colors.border}`,
        }}
      >
        <div style={styles.brand}>
          <div style={styles.dot} />
          <span style={styles.brandText}>LieShou Cloud</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={items}
          onClick={({ key }) => navigate(key)}
          style={{ background: "transparent", border: "none" }}
        />
      </Sider>
      <Layout>
        <Header style={styles.header}>
          <div style={styles.title}>Desktop · {NAV.find((n) => n.path === location.pathname)?.label ?? ""}</div>
          <Dropdown menu={{ items: userMenu }} placement="bottomRight">
            <Space style={{ cursor: "pointer" }}>
              <Avatar size="small" icon={<UserOutlined />} style={{ background: colors.primary }}>
                {user?.username?.charAt(0).toUpperCase() ?? "?"}
              </Avatar>
              <span>{user?.username ?? "未登录"}</span>
              {user?.roles.map((r: string) => <RoleTag key={r} role={r} />)}
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={() => {
                  logout();
                  navigate("/login", { replace: true });
                }}
              />
            </Space>
          </Dropdown>
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
    padding: "20px 16px",
    borderBottom: `1px solid ${colors.border}`,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    background: colors.primary,
    marginRight: 8,
  },
  brandText: {
    fontSize: 16,
    fontWeight: 600,
    color: colors.text,
  },
  header: {
    background: "#fff",
    borderBottom: `1px solid ${colors.border}`,
    padding: "0 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: colors.text,
  },
  content: {
    padding: 24,
    background: colors.bg,
  },
};

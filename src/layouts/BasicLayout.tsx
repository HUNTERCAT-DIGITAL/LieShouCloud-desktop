/**
 * Desktop 基础布局（Phase 9 · desktop）.
 *
 * 简化版：admin 用 ProLayout，desktop 是独立 WebView 进程，自己写一个
 * 轻量 sidebar + topbar。注意复用 @lieshoucloud/ui 的 RoleTag / StatusTag。
 *
 * 菜单结构（2026-10 菜单治理，与 admin-web 对齐）：
 *   客户专属菜单（extraRoutes.menu，可分组）→ 通用 BASE_NAV（hiddenMenus 裁剪）
 *   → 平台管理（PLATFORM_ADMIN/TENANT_ADMIN 角色可见）→ 业务管理（hiddenMenus 裁剪）。
 */
import {
  AccountBookOutlined,
  AppstoreOutlined,
  BellOutlined,
  CloudSyncOutlined,
  DashboardOutlined,
  FileTextOutlined,
  LineChartOutlined,
  LogoutOutlined,
  SwapOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { RoleTag } from "@lieshoucloud/ui";
import { Avatar, Badge, Button, Dropdown, Layout, Menu, Space } from "antd";
import type { MenuProps } from "antd";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import WindowControls from "../components/WindowControls";
import { useUpdaterContext } from "../components/Updater";
import { unreadNotificationCount } from "../services/notification";
import { useAuthStore } from "../stores/auth";
import { colors } from "../theme/colors";

import { getBranding, getEdition, getExtraEdition, isMenuHidden } from '../config/editions';

const { Header, Sider, Content } = Layout;

interface NavItem {
  key: string;
  label: string;
  path: string;
  icon?: ReactNode;
  /** 客户菜单分组（extraRoutes.menu.group · 2026-10 菜单治理） */
  group?: string;
}

/** 菜单图标映射（icon 字符串 key → antd 图标；缺省回退 AppstoreOutlined） */
const ICON_MAP: Record<string, ReactNode> = {
  dashboard: <DashboardOutlined />,
  "account-book": <AccountBookOutlined />,
  swap: <SwapOutlined />,
  "file-text": <FileTextOutlined />,
  "line-chart": <LineChartOutlined />,
};

/** 通用菜单（所有版别基础；客户层可用 hiddenMenus 裁剪） */
const BASE_NAV: NavItem[] = [
  { key: "/welcome", label: "工作台", path: "/welcome" },
  { key: "/cases", label: "案件管理", path: "/cases" },
  { key: "/customers", label: "客户管理", path: "/customers" },
  { key: "/inventory", label: "库存管理", path: "/inventory" },
  { key: "/finance", label: "记账本", path: "/finance" },
  { key: "/approval", label: "审批流", path: "/approval" },
];

/** 平台管理（2026-08 补入 desktop;简化版,按权限后续裁剪） */
const PLATFORM_NAV: NavItem[] = [
  { key: "/admin", label: "管理总览", path: "/admin" },
  { key: "/user/list", label: "用户管理", path: "/user/list" },
  { key: "/role/list", label: "角色管理", path: "/role/list" },
  { key: "/tenant/list", label: "租户管理", path: "/tenant/list" },
  { key: "/audit/list", label: "审计日志", path: "/audit/list" },
];

/** 业务模块（2026-08 补入 desktop;简化版） */
const BUSINESS_NAV: NavItem[] = [
  { key: "/lead/list", label: "线索管理", path: "/lead/list" },
  { key: "/contact/list", label: "联系人", path: "/contact/list" },
  { key: "/contract/list", label: "合同管理", path: "/contract/list" },
  { key: "/member/list", label: "会员管理", path: "/member/list" },
  { key: "/quality/list", label: "质量管理", path: "/quality/list" },
];

/** 构建 antd Menu items：同 group 项收进分组（type: 'group'），无 group 平铺；保持传入顺序 */
function buildMenuItems(nav: NavItem[]): NonNullable<MenuProps["items"]> {
  const groups = new Map<string, NonNullable<MenuProps["items"]>>();
  const top: NonNullable<MenuProps["items"]> = [];
  for (const n of nav) {
    const item = { key: n.path, label: n.label, icon: n.icon };
    if (n.group) {
      const g = groups.get(n.group) ?? [];
      g.push(item);
      groups.set(n.group, g);
    } else {
      top.push(item);
    }
  }
  const grouped = [...groups.entries()].map(([label, children]) => ({
    key: `group:${label}`,
    label,
    type: "group" as const,
    children,
  }));
  return [...top, ...grouped];
}

export default function BasicLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updater = useUpdaterContext();

  // 通知未读数：首拉 + 60s 轮询 + 页面切换刷新
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    const refresh = () => {
      unreadNotificationCount()
        .then(setUnread)
        .catch(() => undefined);
    };
    refresh();
    const timer = setInterval(refresh, 60_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    unreadNotificationCount()
      .then(setUnread)
      .catch(() => undefined);
  }, [location.pathname]);

  // 平台管理可见性：按角色过滤（me 响应 roles 为准;PLATFORM_ADMIN/TENANT_ADMIN 可见）
  const roles = user?.roles ?? [];
  const isPlatformAdmin = roles.some((r) => r === "PLATFORM_ADMIN" || r === "TENANT_ADMIN");

  const edition = getEdition();
  const homePath = getExtraEdition().homePath;

  // 客户专属菜单（extraRoutes.menu · 2026-10 菜单治理，与 admin-web 对齐）：
  // 按 order 排序；menu.group 同组收进分组；无 menu 声明的路由只挂路由不进菜单
  const extraMenuItems: NavItem[] =
    (getExtraEdition().extraRoutes ?? [])
      .filter((r) => r.menu)
      .sort((a, b) => (a.menu?.order ?? 99) - (b.menu?.order ?? 99))
      .map((r) => ({
        key: r.path,
        label: r.menu?.name ?? r.path,
        path: r.path,
        group: r.menu?.group,
        icon: ICON_MAP[r.menu?.icon ?? ""] ?? <AppstoreOutlined />,
      }));

  const hasClientMenu = extraMenuItems.length > 0;
  const baseNav: NavItem[] = BASE_NAV.flatMap((n) => {
    // 客户菜单接管工作台入口：客户版去掉 BASE_NAV 的 /welcome（避免与 extraRoutes 工作台重复）
    if (n.key === "/welcome" && hasClientMenu) return [];
    // 无客户菜单但声明了 homePath（旧版客户）：/welcome 项替换为 homePath
    if (n.key === "/welcome" && homePath) {
      return [{ ...n, key: homePath, label: "今日作战台", path: homePath }];
    }
    return [n];
  }).filter((n) => !isMenuHidden(edition, n.path));

  const items: MenuProps["items"] = [
    ...buildMenuItems([...extraMenuItems, ...baseNav]),
    ...(isPlatformAdmin
      ? [
          {
            key: "platform",
            label: "平台管理",
            children: PLATFORM_NAV.map((n) => ({ key: n.path, label: n.label })),
          },
        ]
      : []),
    ...(BUSINESS_NAV.filter((n) => !isMenuHidden(edition, n.path)).length > 0
      ? [
          {
            key: "business",
            label: "业务管理",
            children: BUSINESS_NAV.filter((n) => !isMenuHidden(edition, n.path)).map((n) => ({
              key: n.path,
              label: n.label,
            })),
          },
        ]
      : []),
  ];
  const allNav = [...extraMenuItems, ...baseNav];

  const userMenu: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "个人中心",
      onClick: () => navigate("/profile"),
    },
    {
      key: "notification",
      icon: <BellOutlined />,
      label: "通知中心",
      onClick: () => navigate("/notification"),
    },
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
              {allNav.find((n) => n.path === location.pathname)?.label ?? ""}
            </span>
          </div>
          <Button
            type="text"
            aria-label="通知中心"
            onClick={() => navigate("/notification")}
            style={{ color: "#fff", padding: "4px 10px" }}
            icon={
              <Badge count={unread} size="small" overflowCount={99}>
                <BellOutlined style={{ fontSize: 16 }} />
              </Badge>
            }
          />
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

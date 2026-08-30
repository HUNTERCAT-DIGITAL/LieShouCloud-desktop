/**
 * 桌面端 · 控制台主框架壳（ProLayout mix · 侧栏 + 顶栏 + 内容区）.
 *
 * 职责（端通用层 · 客户无关）：
 *  - 菜单渲染：从 edition.extraRoutes 中带 menu 声明的项生成侧栏菜单
 *    （name/icon/order/group + hiddenMenus 裁剪 + roles 角色过滤 + badge 角标轮询），
 *    客户经 extraRoutes 注入。
 *  - 顶栏：品牌名 + 当前用户 + 退出登录。
 *  - 内容区：<Outlet />（嵌套路由渲染，行业页面自带内容容器）。
 *
 * 无菜单版别（generic 骨架）不进入本壳，由 App.tsx 条件渲染（shouldUseConsole）。
 */
import {
  AlertOutlined,
  ApartmentOutlined,
  AppstoreOutlined,
  ControlOutlined,
  DashboardOutlined,
  FundOutlined,
  FundProjectionScreenOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  LogoutOutlined,
  MenuOutlined,
  ThunderboltOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import type { MenuDataItem } from '@ant-design/pro-components';
import { ProLayout } from '@ant-design/pro-components';
import { Avatar, Badge, Dropdown, Typography } from 'antd';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { request } from '@lieshoucloud/contract-api';
import { useAuthStore } from '@lieshoucloud/core-web';
import type { EditionConfig, EditionExtraRoute } from '@lieshoucloud/contract-types';

import { getEdition } from '../config/editions';

/** 菜单图标：string 名称 → antd 图标（未知名称兜底默认图标） */
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

/** 当前用户角色集合（缺省空；roles 未声明 = 全可见） */
function userRoles(): string[] {
  return (useAuthStore.getState().user as { roles?: string[] } | null)?.roles ?? [];
}

/** 单个路由 → 菜单项（roles 过滤：菜单声明 roles 且与用户角色无交集 → 跳过） */
function toMenuItem(r: EditionExtraRoute, roles: Set<string>): MenuDataItem | null {
  const need = r.menu?.roles;
  if (need && need.length > 0 && !need.some((x) => roles.has(x))) return null;
  return {
    path: r.path,
    name: r.menu?.name ?? r.title ?? r.path,
    icon: iconOf(r.menu?.icon),
  };
}

/** extraRoutes（带 menu 声明）→ 菜单树（group 分组 + order 排序 + hiddenMenus/roles 裁剪） */
export function buildMenuItems(edition: EditionConfig, currentRoles: string[] = []): MenuDataItem[] {
  const routes = (edition.extraRoutes ?? []).filter((r) => r.menu);
  const hidden = new Set(edition.hiddenMenus ?? []);
  const roles = new Set(currentRoles);

  // 裁剪：隐藏非本客户业务菜单 + 角色不可见
  const visible = routes.filter((r) => !hidden.has(r.path) && toMenuItem(r, roles) !== null);

  // group 分组：同 group 收进子菜单；无 group 平铺
  const groups = new Map<string, EditionExtraRoute[]>();
  const flat: EditionExtraRoute[] = [];
  for (const r of visible) {
    const g = r.menu?.group;
    if (g) {
      const list = groups.get(g) ?? [];
      list.push(r);
      groups.set(g, list);
    } else {
      flat.push(r);
    }
  }

  const byOrder = (a: EditionExtraRoute, b: EditionExtraRoute) =>
    (a.menu?.order ?? 99) - (b.menu?.order ?? 99);

  const items: MenuDataItem[] = [
    ...flat.sort(byOrder).map((r) => toMenuItem(r, roles) as MenuDataItem),
    ...[...groups.entries()]
      .sort((a, b) => (a[1][0]?.menu?.order ?? 99) - (b[1][0]?.menu?.order ?? 99))
      .map(([name, list]) => {
        const group: MenuDataItem = {
          name,
          icon: <MenuOutlined />,
          children: list.sort(byOrder).map((r) => toMenuItem(r, roles) as MenuDataItem),
        };
        return group;
      }),
  ];
  return items;
}

/** 菜单角标轮询：带 menu.badge 的项按其 endpoint 轮询计数字段（如告警待确认数）。
 * 角标值挂在 path 上，供菜单项渲染时回填。
 */
function useBadgeMap(routes: EditionExtraRoute[]): Record<string, number> {
  const [badges, setBadges] = useState<Record<string, number>>({});
  const targets = useMemo(() => routes.filter((r) => r.menu?.badge), [routes]);

  useEffect(() => {
    if (targets.length === 0) return;
    let cancelled = false;
    const tick = async () => {
      for (const r of targets) {
        const b = r.menu?.badge;
        if (!b) continue;
        try {
          const res = (await request({ method: 'GET', path: b.endpoint })) as Record<string, unknown>;
          const v = res?.[b.field];
          if (typeof v === 'number' && !cancelled) {
            setBadges((m) => ({ ...m, [r.path]: v }));
          }
        } catch {
          // 轮询失败静默（后端未实现/网络抖动不打断值守）
        }
      }
    };
    void tick();
    const interval = Math.min(...targets.map((r) => r.menu?.badge?.intervalMs ?? 30000));
    const id = setInterval(() => void tick(), interval);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [targets]);

  return badges;
}

/** 是否启用控制台壳：有客户菜单声明（或值班员控制台模式） */
export function shouldUseConsole(edition: EditionConfig): boolean {
  return edition.dutyConsole === true || (edition.extraRoutes ?? []).some((r) => r.menu);
}

export default function ConsoleLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const edition = getEdition();
  const menuItems = useMemo(() => buildMenuItems(edition, userRoles()), [edition]);
  const badgeMap = useBadgeMap(edition.extraRoutes ?? []);

  return (
    <ProLayout
      title={edition.brandName}
      logo={false}
      layout="mix"
      fixSiderbar
      fixedHeader
      route={{ path: '/', routes: menuItems }}
      location={{ pathname: location.pathname }}
      menuItemRender={(item: MenuDataItem, dom: ReactNode) => {
        let node: ReactNode = dom;
        if (item.path) {
          node = <a onClick={() => navigate(item.path as string)}>{dom}</a>;
        }
        // 角标（badge 轮询值 · antd Badge 包菜单项；>0 才显示）
        const count = item.path ? badgeMap[item.path] : undefined;
        return count && count > 0 ? (
          <Badge count={count} size="small" offset={[8, 0]}>
            {node}
          </Badge>
        ) : (
          node
        );
      }}
      avatarProps={{
        icon: <Avatar size="small">{user?.username?.slice(0, 1)?.toUpperCase() ?? '值'}</Avatar>,
        title: <Typography.Text>{user?.username ?? '值班员'}</Typography.Text>,
        render: (_props: unknown, dom: ReactNode) => (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'about',
                  icon: <InfoCircleOutlined />,
                  label: '关于',
                  onClick: () => navigate('/about'),
                },
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: '退出登录',
                  onClick: () => logout(),
                },
              ],
            }}
          >
            {dom}
          </Dropdown>
        ),
      }}
      actionsRender={() => []}
    >
      <Outlet />
    </ProLayout>
  );
}

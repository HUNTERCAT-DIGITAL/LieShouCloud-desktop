/**
 * Routes (Phase 9 · desktop).
 */
import { lazy, Suspense, useEffect, useState } from "react";
import type { ComponentType } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { getExtraEdition } from "./config/editions";

import { AuthGuard, PageLoading } from "@lieshoucloud/ui";
import BasicLayout from "./layouts/BasicLayout";
import { useAuthStore } from "./stores/auth";

const Login = lazy(() => import("./pages/Login"));
const Welcome = lazy(() => import("./pages/Welcome"));
const Cases = lazy(() => import("./pages/Cases"));
const CaseDetail = lazy(() => import("./pages/CaseDetail"));
const Customers = lazy(() => import("./pages/Customers"));
const CustomerDetail = lazy(() => import("./pages/CustomerDetail"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Finance = lazy(() => import("./pages/Finance"));
const Approval = lazy(() => import("./pages/Approval"));
const Admin = lazy(() => import("./pages/Admin"));
const UserList = lazy(() => import("./pages/UserList"));
const RoleList = lazy(() => import("./pages/RoleList"));
const TenantList = lazy(() => import("./pages/TenantList"));
const AuditList = lazy(() => import("./pages/AuditList"));
const LeadList = lazy(() => import("./pages/LeadList"));
const ContactList = lazy(() => import("./pages/ContactList"));
const ContractList = lazy(() => import("./pages/ContractList"));
const MemberList = lazy(() => import("./pages/MemberList"));
const QualityList = lazy(() => import("./pages/QualityList"));
const Profile = lazy(() => import("./pages/Profile"));
const NotificationList = lazy(() => import("./pages/NotificationList"));

/** 客户专属路由槽（extraRoutes · 2026-09 客户聚合仓）：内容由客户仓注入 */
function ExtraRoute({ route }: { route: { path: string; load: () => Promise<{ default: ComponentType }> } }) {
  const [Comp, setComp] = useState<ComponentType | null>(null);
  useEffect(() => {
    route
      .load()
      .then((m) => setComp(() => m.default))
      .catch(() => setComp(null));
  }, [route]);
  return Comp ? <Comp /> : <PageLoading />;
}

const EXTRA_ROUTES = getExtraEdition().extraRoutes ?? [];

/** 客户定制首页（今日作战台等；缺省 /welcome 通用工作台） */
const homePath = getExtraEdition().homePath;

/**
 * 受保护布局：认证状态由端内 auth store 读取，注入共享 AuthGuard（L1-1 · 受控版）.
 */
function ProtectedLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return (
    <AuthGuard isAuthenticated={isAuthenticated}>
      <BasicLayout />
    </AuthGuard>
  );
}

export const routes = (
  <Suspense fallback={<PageLoading />}>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/welcome" element={homePath ? <Navigate to={homePath} replace /> : <Welcome />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/cases/:id" element={<CaseDetail />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/approval" element={<Approval />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/user/list" element={<UserList />} />
        <Route path="/role/list" element={<RoleList />} />
        <Route path="/tenant/list" element={<TenantList />} />
        <Route path="/audit/list" element={<AuditList />} />
        <Route path="/lead/list" element={<LeadList />} />
        <Route path="/contact/list" element={<ContactList />} />
        <Route path="/contract/list" element={<ContractList />} />
        <Route path="/member/list" element={<MemberList />} />
        <Route path="/quality/list" element={<QualityList />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notification" element={<NotificationList />} />
        {EXTRA_ROUTES.map((r) => (
          <Route key={r.path} path={r.path} element={<ExtraRoute route={r} />} />
        ))}
        <Route path="/" element={<Navigate to="/welcome" replace />} />
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Route>
    </Routes>
  </Suspense>
);

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
const Customers = lazy(() => import("./pages/Customers"));
const CustomerDetail = lazy(() => import("./pages/CustomerDetail"));
const LegalCases = lazy(() => import("./pages/LegalCases"));
const LegalCaseDetail = lazy(() => import("./pages/LegalCaseDetail"));
const LegalTime = lazy(() => import("./pages/LegalTime"));
const EduCourses = lazy(() => import("./pages/EduCourses"));
const EduLessons = lazy(() => import("./pages/EduLessons"));
const EduChildren = lazy(() => import("./pages/EduChildren"));
const IotDevices = lazy(() => import("./pages/IotDevices"));
const IotAlerts = lazy(() => import("./pages/IotAlerts"));
const IotOverview = lazy(() => import("./pages/IotOverview"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Finance = lazy(() => import("./pages/Finance"));
const Approval = lazy(() => import("./pages/Approval"));

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
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/legal/cases" element={<LegalCases />} />
        <Route path="/legal/cases/:id" element={<LegalCaseDetail />} />
        <Route path="/legal/time" element={<LegalTime />} />
        <Route path="/edu/courses" element={<EduCourses />} />
        <Route path="/edu/lessons" element={<EduLessons />} />
        <Route path="/edu/children" element={<EduChildren />} />
        <Route path="/iot/devices" element={<IotDevices />} />
        <Route path="/iot/alerts" element={<IotAlerts />} />
        <Route path="/iot/overview" element={<IotOverview />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/approval" element={<Approval />} />
        {EXTRA_ROUTES.map((r) => (
          <Route key={r.path} path={r.path} element={<ExtraRoute route={r} />} />
        ))}
        <Route path="/" element={<Navigate to="/welcome" replace />} />
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Route>
    </Routes>
  </Suspense>
);

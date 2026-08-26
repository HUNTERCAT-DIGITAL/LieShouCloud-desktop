/**
 * Routes (Phase 9 · desktop).
 */
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AuthGuard } from "./components/AuthGuard";
import PageLoading from "./components/PageLoading";
import BasicLayout from "./layouts/BasicLayout";

const Login = lazy(() => import("./pages/Login"));
const Welcome = lazy(() => import("./pages/Welcome"));
const Customers = lazy(() => import("./pages/Customers"));
const CustomerDetail = lazy(() => import("./pages/CustomerDetail"));
const LegalCases = lazy(() => import("./pages/LegalCases"));
const LegalCaseDetail = lazy(() => import("./pages/LegalCaseDetail"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Finance = lazy(() => import("./pages/Finance"));
const Approval = lazy(() => import("./pages/Approval"));

export const routes = (
  <Suspense fallback={<PageLoading />}>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <AuthGuard>
            <BasicLayout />
          </AuthGuard>
        }
      >
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/legal/cases" element={<LegalCases />} />
        <Route path="/legal/cases/:id" element={<LegalCaseDetail />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/approval" element={<Approval />} />
        <Route path="/" element={<Navigate to="/welcome" replace />} />
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Route>
    </Routes>
  </Suspense>
);

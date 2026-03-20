/**
 * FLL Admin Console — React SPA
 *
 * This SPA handles:
 *   /admin/login          → Admin login (Supabase auth)
 *   /admin-panel/*        → Admin panel pages
 *   /courier/register     → Courier registration
 *   /courier/portal       → Courier portal
 *   /unified-login        → Unified portal (Staff & Courier selection)
 *   /login                → Driver login (password-based)
 *
 * Public site pages (/about, /contact, etc.) are served by the static
 * root index.html (Skywork bundle) via vercel.json rewrites — NOT this SPA.
 */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider as AdminAuthProvider } from "@/lib/admin/auth";

// ── Courier / public onboarding ───────────────────────────────────────────────
import CourierRegister from "@/pages/courier/Register";
import CourierPortal from "@/pages/courier/Portal";
import ApplicationStatus from "@/pages/courier/ApplicationStatus";
import PasswordLogin from "@/pages/PasswordLogin";

// ── Admin panel (exists) ──────────────────────────────────────────────────────
import { AdminLayout } from "@/components/admin/Layout";
import { AccessGuard, PermissionGuard } from "@/components/admin/PermissionGuard";
import AdminLogin from "@/pages/admin/Login";
import AdminPanelDashboard from "@/pages/admin/Dashboard";
import AdminFinance from "@/pages/admin/Finance";
import AdminStaff from "@/pages/admin/Staff";
import AdminCouriers from "@/pages/admin/Couriers";
import AdminPanelOrders from "@/pages/admin/Orders";
import AdminVehicles from "@/pages/admin/Vehicles";
import AdminSettings from "@/pages/admin/Settings";
import AdminPanelReports from "@/pages/admin/Reports";
import AdminDriverWallet from "@/pages/admin/DriverWallet";
import AdminReconciliation from "@/pages/admin/Reconciliation";
import AdminPageBuilder from "@/pages/admin/PageBuilder";
import AdminDispatch from "@/pages/admin/Dispatch";
import FinanceDashboard from "@/pages/admin/FinanceDashboard";
import Revenue from "@/pages/admin/Revenue";
import Expenses from "@/pages/admin/Expenses";
import CashFlow from "@/pages/admin/CashFlow";
import FinancialReports from "@/pages/admin/FinancialReports";
import AIFinanceAnalysis from "@/pages/admin/AIFinanceAnalysis";
import AdminComplaints from "@/pages/admin/Complaints";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* ── Admin login ── */}
          <Route
            path="/admin/login"
            element={
              <AdminAuthProvider>
                <AdminLogin />
              </AdminAuthProvider>
            }
          />

          {/* ── Admin panel ── */}
          <Route
            path="/admin-panel"
            element={
              <AdminAuthProvider>
                <AdminLayout />
              </AdminAuthProvider>
            }
          >
            <Route path="dashboard" element={<AccessGuard roles={["admin", "owner", "staff"]}><AdminPanelDashboard /></AccessGuard>} />
            <Route path="couriers" element={<PermissionGuard permission="couriers"><AdminCouriers /></PermissionGuard>} />
            <Route path="orders" element={<PermissionGuard permission="orders"><AdminPanelOrders /></PermissionGuard>} />
            <Route path="complaints" element={<PermissionGuard permission="complaints"><AdminComplaints /></PermissionGuard>} />
            <Route path="finance" element={<PermissionGuard permission="finance"><AdminFinance /></PermissionGuard>} />
            <Route path="finance-dashboard" element={<PermissionGuard permission="finance"><FinanceDashboard /></PermissionGuard>} />
            <Route path="revenue" element={<PermissionGuard permission="finance"><Revenue /></PermissionGuard>} />
            <Route path="expenses" element={<PermissionGuard permission="finance"><Expenses /></PermissionGuard>} />
            <Route path="cashflow" element={<PermissionGuard permission="finance"><CashFlow /></PermissionGuard>} />
            <Route path="financial-reports" element={<PermissionGuard permission="finance"><FinancialReports /></PermissionGuard>} />
            <Route path="ai-finance" element={<PermissionGuard permission="finance"><AIFinanceAnalysis /></PermissionGuard>} />
            <Route path="reports" element={<PermissionGuard permission="reports"><AdminPanelReports /></PermissionGuard>} />
            <Route path="vehicles" element={<AccessGuard roles={["admin", "owner", "staff"]} departments={["fleet"]}><AdminVehicles /></AccessGuard>} />
            <Route path="staff" element={<AccessGuard roles={["admin", "owner", "staff"]} departments={["hr"]}><AdminStaff /></AccessGuard>} />
            <Route path="settings" element={<AccessGuard roles={["admin", "owner"]}><AdminSettings /></AccessGuard>} />
            <Route path="wallet" element={<PermissionGuard permission="finance"><AdminDriverWallet /></PermissionGuard>} />
            <Route path="reconciliation" element={<PermissionGuard permission="finance"><AdminReconciliation /></PermissionGuard>} />
            <Route path="excel" element={<PermissionGuard permission="excel"><AdminReconciliation /></PermissionGuard>} />
            <Route path="page-builder" element={<AccessGuard roles={["admin", "owner"]}><AdminPageBuilder /></AccessGuard>} />
            <Route path="dispatch" element={<PermissionGuard permission="orders"><AdminDispatch /></PermissionGuard>} />
            {/* Default → dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* ── Driver login (password-based) ── */}
          <Route
            path="/login"
            element={
              <AdminAuthProvider>
                <PasswordLogin title="تسجيل دخول السائقين" subtitle="الدخول المؤقت الآن عبر اسم المستخدم وكلمة المرور" />
              </AdminAuthProvider>
            }
          />

          {/* ── Unified login portal (Staff & Courier selection) ── */}
          <Route
            path="/unified-login"
            element={
              <AdminAuthProvider>
                <PasswordLogin title="تسجيل الدخول الموحّد" subtitle="دخول الموظفين والإدارة عبر اسم المستخدم وكلمة المرور" />
              </AdminAuthProvider>
            }
          />

          {/* ── Courier onboarding (public) ── */}
          <Route path="/courier/register" element={<CourierRegister />} />
          <Route path="/courier/portal" element={<CourierPortal />} />
          <Route path="/application-status" element={<ApplicationStatus />} />

          {/* ── Fallback: redirect unknown routes to unified login ── */}
          <Route path="*" element={<Navigate to="/unified-login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

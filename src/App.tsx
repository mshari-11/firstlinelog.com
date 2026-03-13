/**
 * FLL Admin Console — React SPA
 *
 * This SPA handles:
 *   /admin/login          → Admin login (Supabase auth)
 *   /admin-panel/*        → Admin panel pages
 *   /courier/register     → Courier registration
 *   /courier/portal       → Courier portal
 *   /unified-login        → Unified portal (Staff & Courier selection)
 *   /login                → Driver login (static JS handles auth)
 *
 * Public site pages (/about, /contact, etc.) are served by the static
 * root index.html (Skywork bundle) via vercel.json rewrites — NOT this SPA.
 */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider as AdminAuthProvider } from "@/lib/admin/auth";

// ── Login (Cognito) ──────────────────────────────────────────────────────────
import UnifiedLogin from "@/pages/UnifiedLogin";

// ── Courier / public onboarding ───────────────────────────────────────────────
import CourierRegister from "@/pages/courier/Register";
import CourierPortal from "@/pages/courier/Portal";
import ApplicationStatus from "@/pages/courier/ApplicationStatus";

// ── Admin panel (exists) ──────────────────────────────────────────────────────
import { AdminLayout } from "@/components/admin/Layout";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
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

// ── Guides / Showcase pages ─────────────────────────────────────────────────
import ReactHooksGuide from "@/pages/guides/ReactHooksGuide";
import FitnessProfile from "@/pages/guides/FitnessProfile";
// ── Unified Login Portal ──────────────────────────────────────────────────────
import UnifiedPortal from "@/pages/UnifiedPortal";

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
          {/* ── Admin login (Cognito) ── */}
          <Route path="/admin/login" element={<UnifiedLogin />} />
          {/* ── Unified Login Portal (Staff & Courier selection) ── */}
          <Route
            path="/unified-login"
            element={
              <AdminAuthProvider>
                <UnifiedPortal />
              </AdminAuthProvider>
            }
          />

          {/* ── Admin login (direct access) ── */}
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
            <Route path="dashboard" element={<AdminPanelDashboard />} />
            <Route path="couriers" element={<PermissionGuard permission="couriers"><AdminCouriers /></PermissionGuard>} />
            <Route path="orders" element={<PermissionGuard permission="orders"><AdminPanelOrders /></PermissionGuard>} />
            <Route path="finance" element={<PermissionGuard permission="finance"><AdminFinance /></PermissionGuard>} />
            <Route path="finance-dashboard" element={<PermissionGuard permission="finance"><FinanceDashboard /></PermissionGuard>} />
            <Route path="revenue" element={<PermissionGuard permission="finance"><Revenue /></PermissionGuard>} />
            <Route path="expenses" element={<PermissionGuard permission="finance"><Expenses /></PermissionGuard>} />
            <Route path="cashflow" element={<PermissionGuard permission="finance"><CashFlow /></PermissionGuard>} />
            <Route path="financial-reports" element={<PermissionGuard permission="finance"><FinancialReports /></PermissionGuard>} />
            <Route path="ai-finance" element={<PermissionGuard permission="finance"><AIFinanceAnalysis /></PermissionGuard>} />
            <Route path="reports" element={<PermissionGuard permission="reports"><AdminPanelReports /></PermissionGuard>} />
            <Route path="vehicles" element={<AdminVehicles />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="wallet" element={<PermissionGuard permission="finance"><AdminDriverWallet /></PermissionGuard>} />
            <Route path="reconciliation" element={<PermissionGuard permission="finance"><AdminReconciliation /></PermissionGuard>} />
            <Route path="page-builder" element={<AdminPageBuilder />} />
            <Route path="dispatch" element={<AdminDispatch />} />
            {/* Default → dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* ── Login pages ── */}
          <Route path="/login" element={<LoginShell title="تسجيل دخول السائقين" />} />
          <Route path="/unified-login" element={<UnifiedLogin />} />

          {/* ── Guides / Showcase (public) ── */}
          <Route path="/guides/react-hooks" element={<ReactHooksGuide />} />
          <Route path="/guides/fitness-profile" element={<FitnessProfile />} />
          {/* ── Login pages — backwards compatibility ── */}
          <Route path="/login" element={<LoginShell title="تسجيل دخول السائقين" />} />

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

/** Minimal shell for /login — the static JS scripts take over */
function LoginShell({ title }: { title: string }) {
  return (
    <div
      id="fll-login-root"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b1622",
        fontFamily: "'IBM Plex Sans Arabic', sans-serif",
      }}
    >
      <p style={{ color: "#7e8ca2", fontSize: "14px" }}>{title}</p>
    </div>
  );
}

/**
 * FLL Platform — First Line Logistics
 *
 * Complete SPA with:
 *   - Public website pages (Home, About, Services, Contact, etc.)
 *   - Admin panel (Dashboard, Finance, Couriers, Orders, etc.)
 *   - Driver portal (Dashboard, Orders, Earnings, Profile, Entitlements)
 *   - Courier onboarding (Register, Portal, Application Status)
 *   - Service detail pages
 */
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider as AdminAuthProvider } from "@/lib/admin/auth";
import { Toaster } from "@/components/ui/sonner";

// ── Loading fallback ─────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div dir="rtl" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#07111d", fontFamily: "Tahoma, Arial, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #1a3a52", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
        <p style={{ fontSize: 13, color: "#94a3b8" }}>جاري التحميل...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Public pages ─────────────────────────────────────────────────────────────
import { Layout as PublicLayout } from "@/components/Layout";
const Home = lazy(() => import("@/pages/Home"));
const About = lazy(() => import("@/pages/About"));
const Services = lazy(() => import("@/pages/Services"));
const ServiceDetails = lazy(() => import("@/pages/ServiceDetails"));
const Contact = lazy(() => import("@/pages/Contact"));
const Team = lazy(() => import("@/pages/Team"));
const News = lazy(() => import("@/pages/News"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const JoinUs = lazy(() => import("@/pages/JoinUs"));
const ForPlatforms = lazy(() => import("@/pages/ForPlatforms"));
const Investors = lazy(() => import("@/pages/Investors"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
const Compliance = lazy(() => import("@/pages/Compliance"));
const Governance = lazy(() => import("@/pages/Governance"));
const NotFound = lazy(() => import("@/pages/not-found/Index"));

// ── Service detail pages ─────────────────────────────────────────────────────
const DashboardService = lazy(() => import("@/pages/services/DashboardService"));
const OrdersService = lazy(() => import("@/pages/services/OrdersService"));
const CouriersService = lazy(() => import("@/pages/services/CouriersService"));
const FinanceService = lazy(() => import("@/pages/services/FinanceService"));
const ComplaintsService = lazy(() => import("@/pages/services/ComplaintsService"));
const StaffService = lazy(() => import("@/pages/services/StaffService"));
const VehiclesService = lazy(() => import("@/pages/services/VehiclesService"));
const ExcelService = lazy(() => import("@/pages/services/ExcelService"));

// ── Driver portal ────────────────────────────────────────────────────────────
const DriverDashboard = lazy(() => import("@/pages/driver/DriverDashboard"));
const DriverOrders = lazy(() => import("@/pages/driver/DriverOrders"));
const DriverEarnings = lazy(() => import("@/pages/driver/DriverEarnings"));
const DriverProfile = lazy(() => import("@/pages/driver/DriverProfile"));
const DriverEntitlements = lazy(() => import("@/pages/driver/DriverEntitlements"));
import { DriverLayout } from "@/components/driver/DriverLayout";

// ── Courier onboarding ───────────────────────────────────────────────────────
import CourierRegister from "@/pages/courier/Register";
import CourierPortal from "@/pages/courier/Portal";
import ApplicationStatus from "@/pages/courier/ApplicationStatus";
import PasswordLogin from "@/pages/PasswordLogin";
import UnifiedPortal from "@/pages/UnifiedPortal";

// ── Admin panel ──────────────────────────────────────────────────────────────
import { AdminLayout } from "@/components/admin/Layout";
import { AccessGuard, PermissionGuard } from "@/components/admin/PermissionGuard";
import AdminLogin from "@/pages/admin/Login";
const AdminPanelDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminFinance = lazy(() => import("@/pages/admin/Finance"));
const AdminStaff = lazy(() => import("@/pages/admin/Staff"));
const AdminCouriers = lazy(() => import("@/pages/admin/Couriers"));
const AdminPanelOrders = lazy(() => import("@/pages/admin/Orders"));
const AdminVehicles = lazy(() => import("@/pages/admin/Vehicles"));
const AdminSettings = lazy(() => import("@/pages/admin/Settings"));
const AdminPanelReports = lazy(() => import("@/pages/admin/Reports"));
const AdminDriverWallet = lazy(() => import("@/pages/admin/DriverWallet"));
const AdminReconciliation = lazy(() => import("@/pages/admin/Reconciliation"));
const AdminPageBuilder = lazy(() => import("@/pages/admin/PageBuilder"));
const AdminDispatch = lazy(() => import("@/pages/admin/Dispatch"));
const FinanceDashboard = lazy(() => import("@/pages/admin/FinanceDashboard"));
const Revenue = lazy(() => import("@/pages/admin/Revenue"));
const Expenses = lazy(() => import("@/pages/admin/Expenses"));
const CashFlow = lazy(() => import("@/pages/admin/CashFlow"));
const FinancialReports = lazy(() => import("@/pages/admin/FinancialReports"));
const AIFinanceAnalysis = lazy(() => import("@/pages/admin/AIFinanceAnalysis"));
const AdminComplaints = lazy(() => import("@/pages/admin/Complaints"));
const AdminExcel = lazy(() => import("@/pages/admin/Excel"));
const AdminDashboardLegacy = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminDriversLegacy = lazy(() => import("@/pages/admin/AdminDrivers"));

// ── New pages (connected to AWS APIs) ──────────────────────────────────────
const Approvals = lazy(() => import("@/pages/admin/Approvals"));
const AuditLog = lazy(() => import("@/pages/admin/AuditLog"));
const Tasks = lazy(() => import("@/pages/admin/Tasks"));
const AdminNotifications = lazy(() => import("@/pages/admin/Notifications"));
const Attendance = lazy(() => import("@/pages/admin/Attendance"));
const FleetManagement = lazy(() => import("@/pages/admin/FleetManagement"));
const FleetAssignments = lazy(() => import("@/pages/admin/FleetAssignments"));
const Shipments = lazy(() => import("@/pages/admin/Shipments"));
const Invoices = lazy(() => import("@/pages/admin/Invoices"));
const PayoutManagement = lazy(() => import("@/pages/admin/PayoutManagement"));
const EmailLogs = lazy(() => import("@/pages/admin/EmailLogs"));
const RiskManagement = lazy(() => import("@/pages/admin/RiskManagement"));
const AccountReactivation = lazy(() => import("@/pages/admin/AccountReactivation"));
const AIReports = lazy(() => import("@/pages/admin/AIReports"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));

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
        <Suspense fallback={<PageLoader />}>
          <Routes>

            {/* ══════════════════════════════════════════════════════════════
                PUBLIC WEBSITE
            ══════════════════════════════════════════════════════════════ */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/services/:serviceId" element={<ServiceDetails />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/team" element={<Team />} />
              <Route path="/news" element={<News />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/join-us" element={<JoinUs />} />
              <Route path="/platforms" element={<ForPlatforms />} />
              <Route path="/investors" element={<Investors />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/compliance" element={<Compliance />} />
              <Route path="/governance" element={<Governance />} />
            </Route>

            {/* ── Service detail pages ── */}
            <Route path="/services/dashboard" element={<DashboardService />} />
            <Route path="/services/orders" element={<OrdersService />} />
            <Route path="/services/couriers" element={<CouriersService />} />
            <Route path="/services/finance" element={<FinanceService />} />
            <Route path="/services/complaints" element={<ComplaintsService />} />
            <Route path="/services/staff" element={<StaffService />} />
            <Route path="/services/vehicles" element={<VehiclesService />} />
            <Route path="/services/excel" element={<ExcelService />} />

            {/* ══════════════════════════════════════════════════════════════
                AUTHENTICATION
            ══════════════════════════════════════════════════════════════ */}
            <Route path="/admin/login" element={<AdminAuthProvider><UnifiedPortal /></AdminAuthProvider>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/login" element={<AdminAuthProvider><UnifiedPortal /></AdminAuthProvider>} />
            <Route path="/unified-login" element={<AdminAuthProvider><UnifiedPortal /></AdminAuthProvider>} />

            {/* ══════════════════════════════════════════════════════════════
                ADMIN PANEL (/admin-panel/*)
            ══════════════════════════════════════════════════════════════ */}
            <Route path="/admin-panel" element={<AdminAuthProvider><AdminLayout /></AdminAuthProvider>}>
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
              <Route path="excel" element={<PermissionGuard permission="excel"><AdminExcel /></PermissionGuard>} />
              <Route path="page-builder" element={<AccessGuard roles={["admin", "owner"]}><AdminPageBuilder /></AccessGuard>} />
              <Route path="dispatch" element={<PermissionGuard permission="orders"><AdminDispatch /></PermissionGuard>} />

              {/* ── New AWS-connected pages ── */}
              <Route path="approvals" element={<AccessGuard roles={["admin", "owner"]}><Approvals /></AccessGuard>} />
              <Route path="audit-log" element={<AccessGuard roles={["admin", "owner"]}><AuditLog /></AccessGuard>} />
              <Route path="tasks" element={<AccessGuard roles={["admin", "owner", "staff"]}><Tasks /></AccessGuard>} />
              <Route path="notifications" element={<AccessGuard roles={["admin", "owner", "staff"]}><AdminNotifications /></AccessGuard>} />
              <Route path="attendance" element={<AccessGuard roles={["admin", "owner", "staff"]} departments={["hr"]}><Attendance /></AccessGuard>} />
              <Route path="fleet" element={<AccessGuard roles={["admin", "owner", "staff"]} departments={["fleet"]}><FleetManagement /></AccessGuard>} />
              <Route path="fleet-assignments" element={<AccessGuard roles={["admin", "owner", "staff"]} departments={["fleet"]}><FleetAssignments /></AccessGuard>} />
              <Route path="shipments" element={<PermissionGuard permission="orders"><Shipments /></PermissionGuard>} />
              <Route path="invoices" element={<PermissionGuard permission="finance"><Invoices /></PermissionGuard>} />
              <Route path="payouts" element={<PermissionGuard permission="finance"><PayoutManagement /></PermissionGuard>} />
              <Route path="email-logs" element={<AccessGuard roles={["admin", "owner"]}><EmailLogs /></AccessGuard>} />
              <Route path="risk" element={<AccessGuard roles={["admin", "owner"]}><RiskManagement /></AccessGuard>} />
              <Route path="reactivation" element={<AccessGuard roles={["admin", "owner"]}><AccountReactivation /></AccessGuard>} />
              <Route path="ai-reports" element={<PermissionGuard permission="reports"><AIReports /></PermissionGuard>} />

              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* ── Legacy admin routes ── */}
            <Route path="/admin" element={<AdminAuthProvider><AdminDashboardLegacy /></AdminAuthProvider>} />
            <Route path="/admin/drivers" element={<AdminAuthProvider><AdminDriversLegacy /></AdminAuthProvider>} />

            {/* ══════════════════════════════════════════════════════════════
                DRIVER PORTAL (/driver/*)
            ══════════════════════════════════════════════════════════════ */}
            <Route path="/driver" element={<DriverLayout />}>
              <Route index element={<DriverDashboard />} />
              <Route path="orders" element={<DriverOrders />} />
              <Route path="earnings" element={<DriverEarnings />} />
              <Route path="profile" element={<DriverProfile />} />
              <Route path="entitlements" element={<DriverEntitlements />} />
            </Route>

            {/* ══════════════════════════════════════════════════════════════
                COURIER ONBOARDING
            ══════════════════════════════════════════════════════════════ */}
            <Route path="/courier/register" element={<CourierRegister />} />
            <Route path="/courier/portal" element={<CourierPortal />} />
            <Route path="/application-status" element={<ApplicationStatus />} />

            {/* ══════════════════════════════════════════════════════════════
                FALLBACK
            ══════════════════════════════════════════════════════════════ */}
            <Route path="*" element={<NotFound />} />

          </Routes>
        </Suspense>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

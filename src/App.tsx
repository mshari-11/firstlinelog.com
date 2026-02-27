import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthProvider as AdminAuthProvider } from "@/lib/admin/auth";
import { ROUTE_PATHS } from "@/lib/index";

// الصفحات العامة
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import About from "@/pages/About";
import Services from "@/pages/Services";
import ForPlatforms from "@/pages/ForPlatforms";
import Governance from "@/pages/Governance";
import Investors from "@/pages/Investors";
import JoinUs from "@/pages/JoinUs";
import Contact from "@/pages/Contact";
import Team from "@/pages/Team";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import RegisterPage from "@/pages/Register";
import UnifiedLogin from "@/pages/UnifiedLogin";

// لوحة تحكم الإدارة الجديدة (Dashboard)
import { AdminLayout } from "@/components/dashboard/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminDrivers from "@/pages/admin/AdminDrivers";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminReports from "@/pages/admin/AdminReports";

// لوحة تحكم السائق
import { DriverLayout } from "@/components/driver/DriverLayout";
import DriverDashboard from "@/pages/driver/DriverDashboard";
import DriverOrders from "@/pages/driver/DriverOrders";
import DriverEarnings from "@/pages/driver/DriverEarnings";
import DriverProfile from "@/pages/driver/DriverProfile";

// لوحة الإدارة القديمة (Admin Panel)
import { AdminLayout as AdminPanelLayout } from "@/components/admin/Layout";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import AdminLogin from "@/pages/admin/Login";
import AdminPanelDashboard from "@/pages/admin/Dashboard";
import AdminFinance from "@/pages/admin/Finance";
import AdminStaff from "@/pages/admin/Staff";
import AdminCouriers from "@/pages/admin/Couriers";
import AdminPanelOrders from "@/pages/admin/Orders";
import AdminExcel from "@/pages/admin/Excel";
import AdminComplaints from "@/pages/admin/Complaints";
import AdminVehicles from "@/pages/admin/Vehicles";
import AdminSettings from "@/pages/admin/Settings";
import AdminPanelReports from "@/pages/admin/Reports";

// بوابة المندوب
import CourierRegister from "@/pages/courier/Register";
import CourierPortal from "@/pages/courier/Portal";

// صفحات الخدمات
import CouriersService from "@/pages/services/CouriersService";
import OrdersService from "@/pages/services/OrdersService";
import VehiclesService from "@/pages/services/VehiclesService";
import FinanceService from "@/pages/services/FinanceService";
import ComplaintsService from "@/pages/services/ComplaintsService";
import ExcelService from "@/pages/services/ExcelService";
import DashboardService from "@/pages/services/DashboardService";
import StaffService from "@/pages/services/StaffService";

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
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" richColors closeButton dir="rtl" />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* ==================== لوحة تحكم الإدارة الجديدة (Dashboard) ==================== */}
              <Route path={ROUTE_PATHS.ADMIN} element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="drivers" element={<AdminDrivers />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="reports" element={<AdminReports />} />
              </Route>

              {/* ==================== لوحة تحكم السائق ==================== */}
              <Route path={ROUTE_PATHS.DRIVER} element={<DriverLayout />}>
                <Route index element={<DriverDashboard />} />
                <Route path="orders" element={<DriverOrders />} />
                <Route path="earnings" element={<DriverEarnings />} />
                <Route path="profile" element={<DriverProfile />} />
              </Route>

              {/* ===== Auth ===== */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/unified-login" element={<UnifiedLogin />} />

              {/* ===== صفحات الخدمات الفرعية ===== */}
              <Route path="/services/couriers" element={<CouriersService />} />
              <Route path="/services/orders" element={<OrdersService />} />
              <Route path="/services/vehicles" element={<VehiclesService />} />
              <Route path="/services/finance" element={<FinanceService />} />
              <Route path="/services/complaints" element={<ComplaintsService />} />
              <Route path="/services/excel" element={<ExcelService />} />
              <Route path="/services/dashboard" element={<DashboardService />} />
              <Route path="/services/staff" element={<StaffService />} />

              {/* ===== تسجيل دخول الإدارة القديمة ===== */}
              <Route path="/admin/login" element={<AdminAuthProvider><AdminLogin /></AdminAuthProvider>} />

              {/* ===== بوابة المندوب ===== */}
              <Route path="/courier/register" element={<CourierRegister />} />
              <Route path="/courier/portal" element={<AdminAuthProvider><CourierPortal /></AdminAuthProvider>} />

              {/* ===== لوحة الإدارة القديمة (Admin Panel) ===== */}
              <Route path="/admin-panel" element={<AdminAuthProvider><AdminPanelLayout /></AdminAuthProvider>}>
                <Route path="dashboard" element={<AdminPanelDashboard />} />
                <Route path="couriers" element={<PermissionGuard permission="couriers"><AdminCouriers /></PermissionGuard>} />
                <Route path="orders" element={<PermissionGuard permission="orders"><AdminPanelOrders /></PermissionGuard>} />
                <Route path="excel" element={<PermissionGuard permission="excel"><AdminExcel /></PermissionGuard>} />
                <Route path="finance" element={<PermissionGuard permission="finance"><AdminFinance /></PermissionGuard>} />
                <Route path="complaints" element={<PermissionGuard permission="complaints"><AdminComplaints /></PermissionGuard>} />
                <Route path="reports" element={<PermissionGuard permission="reports"><AdminPanelReports /></PermissionGuard>} />
                <Route path="vehicles" element={<AdminVehicles />} />
                <Route path="staff" element={<AdminStaff />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* ==================== الصفحات العامة (مع Layout) ==================== */}
              <Route path="*" element={
                <Layout>
                  <Routes>
                    <Route path={ROUTE_PATHS.HOME} element={<Home />} />
                    <Route path={ROUTE_PATHS.ABOUT} element={<About />} />
                    <Route path={ROUTE_PATHS.SERVICES} element={<Services />} />
                    <Route path={ROUTE_PATHS.PLATFORMS} element={<ForPlatforms />} />
                    <Route path={ROUTE_PATHS.GOVERNANCE} element={<Governance />} />
                    <Route path={ROUTE_PATHS.INVESTORS} element={<Investors />} />
                    <Route path={ROUTE_PATHS.JOIN_US} element={<JoinUs />} />
                    <Route path={ROUTE_PATHS.CONTACT} element={<Contact />} />
                    <Route path={ROUTE_PATHS.TEAM} element={<Team />} />
                    <Route path={ROUTE_PATHS.PRIVACY} element={<Privacy />} />
                    <Route path={ROUTE_PATHS.TERMS} element={<Terms />} />
                    <Route path="*" element={<Home />} />
                  </Routes>
                </Layout>
              } />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

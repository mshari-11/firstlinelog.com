import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Layout } from "@/components/Layout";
import { ROUTE_PATHS } from "@/lib/index";

// الصفحات العامة
import Home from "@/pages/Home";
import About from "@/pages/About";
import Services from "@/pages/Services";
import ForPlatforms from "@/pages/ForPlatforms";
import Governance from "@/pages/Governance";
import Investors from "@/pages/Investors";
import JoinUs from "@/pages/JoinUs";
import Contact from "@/pages/Contact";

// نظام الإدارة
import { AuthProvider } from "@/lib/admin/auth";
import { AdminLayout } from "@/components/admin/Layout";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminFinance from "@/pages/admin/Finance";
import AdminStaff from "@/pages/admin/Staff";
import AdminCouriers from "@/pages/admin/Couriers";
import AdminOrders from "@/pages/admin/Orders";
import AdminExcel from "@/pages/admin/Excel";
import AdminComplaints from "@/pages/admin/Complaints";
import AdminVehicles from "@/pages/admin/Vehicles";

// بوابة المناديب
import CourierRegister from "@/pages/courier/Register";
import CourierPortal from "@/pages/courier/Portal";

// صفحات Auth الجديدة
import LoginPage from "@/pages/Login";
import RegisterPage from "@/pages/Register";

// صفحات الخدمات الفرعية
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
                                    <Routes>
                                      {/* ===== الموقع العام ===== */}
                                                <Route element={<Layout><Home /></Layout>Layout>} path={ROUTE_PATHS.HOME} />
                                                            <Route element={<Layout><About /></Layout>Layout>} path={ROUTE_PATHS.ABOUT} />
                                                                        <Route element={<Layout><Services /></Layout>Layout>} path={ROUTE_PATHS.SERVICES} />
                                                                                    <Route element={<Layout><ForPlatforms /></Layout>Layout>} path={ROUTE_PATHS.PLATFORMS} />
                                                                                                <Route element={<Layout><Governance /></Layout>Layout>} path={ROUTE_PATHS.GOVERNANCE} />
                                                                                                            <Route element={<Layout><Investors /></Layout>Layout>} path={ROUTE_PATHS.INVESTORS} />
                                                                                                                        <Route element={<Layout><JoinUs /></Layout>Layout>} path={ROUTE_PATHS.JOIN_US} />
                                                                                                                                    <Route element={<Layout><Contact /></Layout>Layout>} path={ROUTE_PATHS.CONTACT} />
                                                                                                                                    
                                                                                                                                      {/* ===== صفحات Auth الجديدة ===== */}
                                                                                                                                                <Route path="/login" element={<LoginPage />} />
                                                                                                                                                <Route path="/register" element={<RegisterPage />} />
                                                                                                                                                <Route path="/unified-login" element={<LoginPage />} />
                                                                                                                                    
                                                                                                                                      {/* ===== صفحات الخدمات الفرعية ===== */}
                                                                                                                                                <Route path="/services/couriers" element={<CouriersService />} />
                                                                                                                                                <Route path="/services/orders" element={<OrdersService />} />
                                                                                                                                                <Route path="/services/vehicles" element={<VehiclesService />} />
                                                                                                                                                <Route path="/services/finance" element={<FinanceService />} />
                                                                                                                                                <Route path="/services/complaints" element={<ComplaintsService />} />
                                                                                                                                                <Route path="/services/excel" element={<ExcelService />} />
                                                                                                                                                <Route path="/services/dashboard" element={<DashboardService />} />
                                                                                                                                                <Route path="/services/staff" element={<StaffService />} />
                                                                                                                                    
                                                                                                                                      {/* ===== تسجيل دخول الإدارة (القديم - محفوظ) ===== */}
                                                                                                                                                <Route path="/admin/login" element={
                                                                                                                                                                <AuthProvider><AdminLogin /></AuthProvider>AuthProvider>
                                                                                                                                                  } />
                                                                                                                                                
                                                                                                                                                  {/* ===== تسجيل المناديب (القديم - محفوظ) ===== */}
                                                                                                                                                            <Route path="/courier/register" element={<CourierRegister />} />
                                                                                                                                                
                                                                                                                                                  {/* ===== بوابة المندوب ===== */}
                                                                                                                                                            <Route path="/courier/portal" element={
                                                                                                                                                                            <AuthProvider><CourierPortal /></AuthProvider>AuthProvider>
                                                                                                                                                              } />
                                                                                                                                                            
                                                                                                                                                              {/* ===== لوحة الإدارة ===== */}
                                                                                                                                                                        <Route path="/admin" element={
                                                                                                                                                                                        <AuthProvider><AdminLayout /></AuthProvider>AuthProvider>
                                                                                                                                                                          }>
                                                                                                                                                                                      <Route path="dashboard" element={<AdminDashboard />} />
                                                                                                                                                                                      <Route path="couriers" element={
                                                                                                                                                                                                        <PermissionGuard permission="couriers"><AdminCouriers /></PermissionGuard>PermissionGuard>
                                                                                                                                                                                        } />
                                                                                                                                                                                                    <Route path="orders" element={
                                                                                                                                                                                                                      <PermissionGuard permission="orders"><AdminOrders /></PermissionGuard>PermissionGuard>
                                                                                                                                                                                                                  } />
                                                                                                                                                                                                                  <Route path="excel" element={
                                                                                                                                                                                                                                    <PermissionGuard permission="excel"><AdminExcel /></PermissionGuard>PermissionGuard>
                                                                                                                                                                                                                                } />
                                                                                                                                                                                                                                <Route path="finance" element={
                                                                                                                                                                                                                                                  <PermissionGuard permission="finance"><AdminFinance /></PermissionGuard>PermissionGuard>
                                                                                                                                                                                                                                              } />
                                                                                                                                                                                                                                              <Route path="complaints" element={
                                                                                                                                                                                                                                                                <PermissionGuard permission="complaints"><AdminComplaints /></PermissionGuard>PermissionGuard>
                                                                                                                                                                                                                                                            } />
                                                                                                                                                                                                                                                            <Route path="vehicles" element={<AdminVehicles />} />
                                                                                                                                                                                                                                                            <Route path="staff" element={<AdminStaff />} />
                                                                                                                                                                                                                                                          </Route>Route>
                                                                                                                                                                                                                                
                                                                                                                                                                                                                                            {/* توجيه افتراضي */}
                                                                                                                                                                                                                                            <Route path="*" element={<Layout><Home /></Layout>Layout>} />
                                                                                                                                                                                                                                                      </Route>Routes>
                                                                                                                                                                                                                                        </Route>BrowserRouter>
                                                                                                                                                                                                                        </Route>TooltipProvider>
                                                                                                                                                                                                        </Route>QueryClientProvider>
                                                                                                                                                                                        );
                                                                                                                                                                                        }</TooltipProvider>

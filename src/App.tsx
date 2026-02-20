// Auto-deployed via Vercel CI/CD - Last update: Feb 2026
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Layout } from "@/components/Layout";
import { ROUTE_PATHS } from "@/lib/index";

import Home from "@/pages/Home";
import About from "@/pages/About";
import Services from "@/pages/Services";
import ForPlatforms from "@/pages/ForPlatforms";
import Governance from "@/pages/Governance";
import Investors from "@/pages/Investors";
import JoinUs from "@/pages/JoinUs";
import Contact from "@/pages/Contact";

// Admin
import { AuthProvider } from "@/lib/admin/auth";
import { AdminLayout } from "@/components/admin/Layout";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminFinance from "@/pages/admin/Finance";
import AdminStaff from "@/pages/admin/Staff";

/**
 * إعداد عميل TanStack Query لإدارة حالات البيانات
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 دقائق
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * المكون الرئيسي للتطبيق (App)
 * يدير التوجيه (Routing) وموفري الحالة (Providers) لموقع فيرست لاين لوجستيكس
 * يدعم اللغة العربية ونظام RTL بشكل كامل
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" richColors closeButton dir="rtl" />
        
        <BrowserRouter>
          <Routes>
            {/* ===== الموقع العام ===== */}
            <Route element={<Layout><Home /></Layout>} path={ROUTE_PATHS.HOME} />
            <Route element={<Layout><About /></Layout>} path={ROUTE_PATHS.ABOUT} />
            <Route element={<Layout><Services /></Layout>} path={ROUTE_PATHS.SERVICES} />
            <Route element={<Layout><ForPlatforms /></Layout>} path={ROUTE_PATHS.PLATFORMS} />
            <Route element={<Layout><Governance /></Layout>} path={ROUTE_PATHS.GOVERNANCE} />
            <Route element={<Layout><Investors /></Layout>} path={ROUTE_PATHS.INVESTORS} />
            <Route element={<Layout><JoinUs /></Layout>} path={ROUTE_PATHS.JOIN_US} />
            <Route element={<Layout><Contact /></Layout>} path={ROUTE_PATHS.CONTACT} />

            {/* ===== لوحة الإدارة ===== */}
            <Route path="/admin/login" element={
              <AuthProvider>
                <AdminLogin />
              </AuthProvider>
            } />
            <Route path="/admin" element={
              <AuthProvider>
                <AdminLayout />
              </AuthProvider>
            }>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="finance" element={
                <PermissionGuard permission="finance">
                  <AdminFinance />
                </PermissionGuard>
              } />
              <Route path="staff" element={<AdminStaff />} />
              {/* صفحات أخرى تضاف هنا */}
            </Route>

            {/* fallback */}
            <Route path="*" element={<Layout><Home /></Layout>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

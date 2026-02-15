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
        {/* مكونات الإشعارات العامة */}
        <Toaster />
        <Sonner position="top-center" richColors closeButton dir="rtl" />
        
        <BrowserRouter>
          {/* مكون التخطيط الرئيسي الذي يحتوي على الهيدر والفوتر */}
          <Layout>
            <Routes>
              {/* الصفحة الرئيسية */}
              <Route
                path={ROUTE_PATHS.HOME}
                element={<Home />}
              />
              
              {/* صفحة من نحن */}
              <Route
                path={ROUTE_PATHS.ABOUT}
                element={<About />}
              />
              
              {/* صفحة الخدمات */}
              <Route
                path={ROUTE_PATHS.SERVICES}
                element={<Services />}
              />
              
              {/* صفحة خدمات المنصات */}
              <Route
                path={ROUTE_PATHS.PLATFORMS}
                element={<ForPlatforms />}
              />
              
              {/* صفحة الحوكمة والامتثال */}
              <Route
                path={ROUTE_PATHS.GOVERNANCE}
                element={<Governance />}
              />
              
              {/* صفحة علاقات المستثمرين */}
              <Route
                path={ROUTE_PATHS.INVESTORS}
                element={<Investors />}
              />
              
              {/* صفحة انضم إلينا (للسائقين والشركاء) */}
              <Route
                path={ROUTE_PATHS.JOIN_US}
                element={<JoinUs />}
              />
              
              {/* صفحة اتصل بنا */}
              <Route
                path={ROUTE_PATHS.CONTACT}
                element={<Contact />}
              />
              
              {/* توجيه افتراضي للصفحات غير الموجودة إلى الصفحة الرئيسية */}
              <Route
                path="*"
                element={<Home />}
              />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/hooks/useAuth";
import { ROUTE_PATHS } from "@/lib/index";

// الصفحات العامة
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import UnifiedLogin from "@/pages/UnifiedLogin";
import Register from "@/pages/Register";
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
import News from "@/pages/News";
import Compliance from "@/pages/Compliance";

// لوحة تحكم الإدارة
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
                            <Route path={ROUTE_PATHS.ADMIN} element={<AdminLayout />}>
                                <Route index element={<AdminDashboard />} />
                                <Route path="drivers" element={<AdminDrivers />} />
                                <Route path="orders" element={<AdminOrders />} />
                                <Route path="reports" element={<AdminReports />} />
                            </Route>

                            <Route path={ROUTE_PATHS.DRIVER} element={<DriverLayout />}>
                                <Route index element={<DriverDashboard />} />
                                <Route path="orders" element={<DriverOrders />} />
                                <Route path="earnings" element={<DriverEarnings />} />
                                <Route path="profile" element={<DriverProfile />} />
                            </Route>

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
                                        <Route path={ROUTE_PATHS.LOGIN} element={<Login />} />
                                        <Route path={ROUTE_PATHS.UNIFIED_LOGIN} element={<UnifiedLogin />} />
                                        <Route path="/register" element={<Register />} />
                                        <Route path={ROUTE_PATHS.NEWS} element={<News />} />
                                        <Route path={ROUTE_PATHS.COMPLIANCE} element={<Compliance />} />
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

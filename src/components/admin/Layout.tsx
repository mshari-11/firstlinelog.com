/**
 * تخطيط لوحة الإدارة — Obsidian Command Layout
 * Top bar with breadcrumbs, system status, and clock.
 * Sidebar + main content area with page transitions.
 */
import { useEffect, useState, useMemo } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/admin/auth";
import { AdminSidebar } from "./Sidebar";
import { AdminAiAssistant } from "./AiAssistant";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const routeNames: Record<string, string> = {
  dashboard: "لوحة التحكم",
  couriers: "المناديب",
  orders: "الطلبات",
  finance: "الرواتب والمالية",
  reports: "التقارير",
  vehicles: "المركبات",
  staff: "الأقسام والموظفين",
  settings: "الإعدادات",
  wallet: "محافظ السائقين",
  reconciliation: "مطابقة مالية",
  "page-builder": "منشئ الصفحات",
  dispatch: "الخريطة والإرسال",
  "driver-applications": "طلبات السائقين",
  kyc: "وثائق KYC",
  "driver-training": "تدريب السائقين",
  "bank-alerts": "التنبيهات البنكية",
  "finance-close": "الإغلاق المالي اليومي",
  "monthly-report": "التقرير المالي الشهري",
  sla: "مراقبة مستويات الخدمة",
  marketplace: "تكاملات المنصات",
  "n8n-workflows": "سير العمل (n8n)",
};

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span
      style={{
        fontFamily: "var(--con-font-mono)",
        fontSize: 12,
        fontWeight: 600,
        color: "var(--con-text-secondary)",
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "0.03em",
      }}
    >
      {time.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}

export function AdminLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/admin/login");
    }
    if (!loading && user && !["admin", "owner", "staff"].includes(user.role)) {
      navigate(user.role === "courier" ? "/courier/portal" : "/admin/login");
    }
  }, [user, loading, navigate]);

  const currentPage = useMemo(() => {
    const seg = location.pathname.split("/").filter(Boolean).pop() || "dashboard";
    return routeNames[seg] || seg;
  }, [location.pathname]);

  if (loading) {
    return (
      <div
        className="fll-console"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--con-radius-md)",
              background: "var(--con-bg-surface-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--con-border-default)",
            }}
          >
            <img
              src="/images/first_line_professional_english_1.png"
              alt="FL"
              style={{ width: 28, height: 28, objectFit: "contain" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </motion.div>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              border: "2px solid var(--con-border-strong)",
              borderTopColor: "var(--con-brand)",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
            جارٍ التحميل...
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user || !["admin", "owner", "staff"].includes(user.role)) return null;

  return (
    <div className="fll-console" dir="rtl" style={{ display: "flex" }}>
      <AdminSidebar />
      <main className="con-main">
        {/* Top Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 24px",
            borderBottom: "1px solid var(--con-border-default)",
            background: "var(--con-bg-surface-1)",
            position: "sticky",
            top: 0,
            zIndex: 40,
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Breadcrumbs */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin-panel/dashboard" style={{ fontSize: 11 }}>
                  لوحة الإدارة
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage style={{ fontSize: 12, fontWeight: 600 }}>
                  {currentPage}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Right side: Status + Clock */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: "var(--con-radius-sm)",
                background: "var(--con-success-subtle)",
                border: "1px solid rgba(34,197,94,0.15)",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--con-success)",
                  animation: "pulse 2s infinite",
                }}
              />
              <span style={{ fontSize: 11, color: "var(--con-success)", fontWeight: 500 }}>متصل</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: "var(--con-radius-sm)",
                background: "var(--con-bg-elevated)",
                border: "1px solid var(--con-border-default)",
              }}
            >
              <Clock size={12} style={{ color: "var(--con-text-muted)" }} />
              <LiveClock />
            </div>
          </div>
        </div>

        {/* Page content with page transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.22, 0.68, 0, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <AdminAiAssistant />
    </div>
  );
}

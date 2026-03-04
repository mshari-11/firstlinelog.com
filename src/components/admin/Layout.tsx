/**
 * تخطيط لوحة الإدارة - Admin Panel Layout
 */
import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AdminSidebar } from "./Sidebar";
import { useAuth } from "@/lib/admin/auth";

export function AdminLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/admin/login", { replace: true });
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "oklch(0.10 0.06 220)" }}
        dir="rtl"
      >
        <div className="text-center space-y-4">
          <div
            className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: "oklch(0.65 0.18 200)", borderTopColor: "transparent" }}
          />
          <p style={{ color: "oklch(0.55 0.06 210)" }}>جاري التحقق...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div
      className="min-h-screen flex"
      dir="rtl"
      style={{ background: "oklch(0.10 0.06 220)" }}
    >
      <AdminSidebar />
      <main className="flex-1 mr-64 min-h-screen overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

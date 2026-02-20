/**
 * تخطيط لوحة الإدارة - يحتوي الشريط الجانبي والمحتوى
 */
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/admin/auth";
import { AdminSidebar } from "./Sidebar";

export function AdminLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/admin/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex" dir="rtl">
      <AdminSidebar />
      {/* المحتوى الرئيسي - مع هامش للشريط الجانبي */}
      <main className="flex-1 mr-64 min-h-screen overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}

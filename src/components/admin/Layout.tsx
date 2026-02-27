h/**
 * تخطيط لوحة الإدارة - بهوية فيرست لاين
 * يحتوي على المساعد الذكي لجميع صفحات الإدارة
 * المساعد الذكي لا يظهر في صفحات المندوبين والسائقين
 */
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/admin/auth";
import { AdminSidebar } from "./Sidebar";
import ChatWidget from "@/components/chat/ChatWidget";

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
                <div
                          className="min-h-screen flex items-center justify-center"
                          style={{ background: "oklch(0.10 0.06 220)" }}
                        >
                        <div className="flex flex-col items-center gap-4">
                          {/* شعار */}
                                  <div
                                                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
                                                style={{ background: "oklch(0.18 0.08 220)" }}
                                              >
                                              <img
                                                              src="/images/first_line_professional_english_1.png"
                                                              alt="FL"
                                                              className="w-10 h-10 object-contain"
                                                              onError={(e) => {
                                                                                (e.target as HTMLImageElement).style.display = "none";
                                                              }}
                                                            />
                                  </div>
                                  <div
                                                className="w-8 h-8 rounded-full border-2 animate-spin"
                                                style={{
                                                                borderColor: "oklch(0.65 0.18 200 / 0.3)",
                                                                borderTopColor: "oklch(0.65 0.18 200)",
                                                }}
                                              />
                                  <p className="text-sm" style={{ color: "oklch(0.55 0.06 210)" }}>
                                              ...جارٍ التحميل
                                  </p>
                        </div>
                </div>
              );
  }
  
    if (!user) return null;
  
    return (
          <div
                  className="min-h-screen flex page-with-logo-bg"
                  dir="rtl"
                  style={{ background: "oklch(0.10 0.06 220)" }}
                >
                <AdminSidebar />
                <main className="flex-1 mr-64 min-h-screen overflow-x-hidden">
                        <Outlet />
                </main>
          
            {/* المساعد الذكي - يظهر فقط للأدوار الإدارية */}
                <ChatWidget
                          userRole={user.role || "staff"}
                          userId={user.id}
                                            userName={user.full_name || user.email}
                        />
          </div>
        );
}

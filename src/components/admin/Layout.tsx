/**
 * تخطيط لوحة الإدارة — Enterprise Console
 * يستخدم .fll-console scope لعزل التصميم المؤسسي عن الموقع العام
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
      <div className="fll-console" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: "40px", height: "40px",
              borderRadius: "8px",
              background: "var(--con-bg-surface-2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <img
              src="/images/first_line_professional_english_1.png"
              alt="FL"
              style={{ width: "28px", height: "28px", objectFit: "contain" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <div
            style={{
              width: "20px", height: "20px",
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

  if (!user) return null;

  return (
    <div className="fll-console" dir="rtl" style={{ display: "flex" }}>
      <AdminSidebar />
      <main className="con-main">
        <Outlet />
      </main>
      <ChatWidget
        userRole={user.role || "staff"}
        userId={user.id}
        userName={user.full_name || user.email}
      />
    </div>
  );
}

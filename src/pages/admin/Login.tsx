/**
 * صفحة تسجيل الدخول — لوحة إدارة فيرست لاين
 * اسم المستخدم + كلمة المرور — خاصة بالموظفين فقط
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/admin/auth";
import { supabase } from "@/lib/supabase";
import {
  Lock, Eye, EyeOff, LogIn, AlertCircle, User,
} from "lucide-react";

export default function AdminLogin() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("أدخل اسم المستخدم"); return; }
    if (!password) { setError("أدخل كلمة المرور"); return; }
    setError(""); setLoading(true);

    const res = await signIn(email.trim(), password);
    setLoading(false);
    if (res.error) { setError(res.error); return; }

    // Redirect based on role
    if (supabase) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from("users").select("role").eq("id", authUser.id).single();
        if (profile?.role === "courier") { navigate("/courier/portal"); return; }
      }
    }
    navigate("/admin-panel/dashboard");
  }

  return (
    <div className="fll-console" style={{
      minHeight: "100vh",
      background: "var(--con-bg-app)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1.5rem",
      fontFamily: "var(--con-font-primary)",
    }} dir="rtl">

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ width: "100%", maxWidth: "400px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: "48px", height: "48px",
            borderRadius: "var(--con-radius-md)",
            background: "var(--con-bg-elevated)",
            border: "1px solid var(--con-border-strong)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 0.875rem",
          }}>
            <img
              src="/images/first_line_professional_english_1.png"
              alt="FL"
              style={{ width: "34px", height: "34px", objectFit: "contain" }}
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                el.style.display = "none";
                (el.parentElement as HTMLElement).innerHTML =
                  '<span style="font-size:15px;font-weight:800;color:var(--con-brand)">FL</span>';
              }}
            />
          </div>
          <h1 style={{ fontSize: "16px", fontWeight: 700, color: "var(--con-text-primary)", marginBottom: "0.25rem" }}>
            First Line Logistics
          </h1>
          <p style={{ fontSize: "12px", color: "var(--con-text-muted)" }}>النظام الإداري الداخلي</p>
        </div>

        {/* Card */}
        <div className="con-card" style={{ padding: "1.75rem" }}>
          <div style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--con-text-primary)", marginBottom: "0.25rem" }}>
              تسجيل الدخول
            </h2>
            <p style={{ fontSize: "12px", color: "var(--con-text-muted)" }}>
              أدخل بيانات الدخول الخاصة بك
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Username / Email */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <label htmlFor="email" style={{ fontSize: "13px", fontWeight: 500, color: "var(--con-text-secondary)" }}>
                اسم المستخدم
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@fll.sa"
                  autoComplete="email"
                  autoFocus
                  className="con-input"
                  style={{ width: "100%", paddingLeft: "2.5rem" }}
                />
                <div style={{ position: "absolute", left: "0.625rem", top: "50%", transform: "translateY(-50%)", color: "var(--con-text-muted)" }}>
                  <User size={15} />
                </div>
              </div>
            </div>

            {/* Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <label htmlFor="password" style={{ fontSize: "13px", fontWeight: 500, color: "var(--con-text-secondary)" }}>
                كلمة المرور
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="con-input"
                  style={{ width: "100%", paddingLeft: "2.5rem" }}
                />
                <button
                  type="button" onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute", left: "0.625rem", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "var(--con-text-muted)",
                    display: "flex", padding: 0,
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: "0.5rem",
                padding: "0.625rem 0.875rem",
                background: "var(--con-danger-subtle)",
                border: "1px solid var(--con-danger)",
                borderRadius: "var(--con-radius)",
                fontSize: "13px",
                color: "var(--con-danger)",
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="con-btn-primary"
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                gap: "0.5rem", opacity: loading ? 0.55 : 1,
              }}
            >
              {loading
                ? <><div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /><span>جارٍ التحميل...</span></>
                : <><LogIn size={15} /> تسجيل الدخول</>
              }
            </button>
          </form>

          {/* Help */}
          <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--con-border-default)", textAlign: "center" }}>
            <p style={{ fontSize: "11px", color: "var(--con-text-muted)", margin: 0 }}>
              هل تحتاج مساعدة؟
            </p>
            <p style={{ fontSize: "11px", color: "var(--con-text-muted)", margin: "0.25rem 0 0" }}>
              تواصل <a href="mailto:support@fll.sa" style={{ color: "var(--con-brand)", textDecoration: "none" }}>Support@fll.sa</a>
            </p>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: "11px", color: "var(--con-text-muted)", marginTop: "1.25rem" }}>
          &copy; {new Date().getFullYear()} First Line Logistics — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}

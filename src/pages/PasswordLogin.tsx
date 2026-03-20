import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, AlertCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function PasswordLogin({ title, subtitle }: { title: string; subtitle: string }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return setError("Supabase غير متصل");
    setError("");
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      return;
    }
    const authRole = (data.user?.user_metadata as any)?.role;
    if (authRole === "courier" || authRole === "driver") {
      navigate("/courier/portal");
      return;
    }
    const { data: profile } = await supabase.from("users").select("role").eq("id", data.user.id).maybeSingle();
    if (profile?.role === "courier") {
      navigate("/courier/portal");
      return;
    }
    navigate("/admin-panel/dashboard");
  }

  return (
    <div className="fll-console" dir="rtl" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 54, height: 54, margin: "0 auto 0.875rem", borderRadius: 12, background: "var(--con-bg-elevated)", border: "1px solid var(--con-border-default)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--con-brand)" }}>
            <ShieldCheck size={24} />
          </div>
          <h1 style={{ margin: 0, fontSize: 18, color: "var(--con-text-primary)", fontWeight: 700 }}>{title}</h1>
          <p style={{ margin: "0.4rem 0 0", fontSize: 12, color: "var(--con-text-muted)" }}>{subtitle}</p>
        </div>
        <div className="con-card" style={{ padding: "1.75rem" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, color: "var(--con-text-secondary)" }}>اسم المستخدم / البريد الإلكتروني</label>
              <input className="con-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@fll.sa" autoFocus />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, color: "var(--con-text-secondary)" }}>كلمة المرور</label>
              <div style={{ position: "relative" }}>
                <input className="con-input" type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ width: "100%", paddingLeft: 40 }} />
                <button type="button" onClick={() => setShowPass((v) => !v)} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--con-text-muted)", cursor: "pointer" }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--con-danger-subtle)", border: "1px solid var(--con-danger)", borderRadius: 8, color: "var(--con-danger)", fontSize: 13 }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}
            <button className="con-btn-primary" type="submit" style={{ width: "100%", justifyContent: "center", opacity: loading ? 0.6 : 1 }} disabled={loading}>
              <LogIn size={14} /> {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </form>
          <div style={{ marginTop: 14, textAlign: "center", fontSize: 12, color: "var(--con-text-muted)" }}>
            مندوب جديد؟ <Link to="/courier/register" style={{ color: "var(--con-brand)", textDecoration: "none" }}>سجّل هنا</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

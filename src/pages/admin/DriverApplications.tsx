/**
 * صفحة طلبات السائقين — Driver Applications Management
 * يعرض طلبات التسجيل من driver_applications مع إمكانية القبول / الرفض
 */
import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw, AlertCircle, CheckCircle2, XCircle, Clock, Eye, User, Phone, Mail, MapPin, Car } from "lucide-react";
import { supabase } from "@/lib/supabase";

type AppStatus = "pending" | "under_review" | "approved" | "rejected" | "archived";

interface DriverApp {
  id: string;
  app_ref: string;
  full_name: string;
  national_id: string;
  nationality: string;
  city: string;
  phone: string;
  email: string;
  platform_app: string;
  contract_type: string;
  has_vehicle: boolean;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_plate?: string;
  face_similarity_score?: number;
  liveness_passed?: boolean;
  status: AppStatus;
  admin_notes?: string;
  rejection_reason?: string;
  submitted_at: string;
  created_at: string;
}

const STATUS_MAP: Record<AppStatus, { label: string; cls: string; icon: JSX.Element }> = {
  pending:      { label: "قيد الانتظار",  cls: "con-badge-warning", icon: <Clock size={11} /> },
  under_review: { label: "قيد المراجعة", cls: "con-badge-info",    icon: <Eye size={11} /> },
  approved:     { label: "مقبول",         cls: "con-badge-success", icon: <CheckCircle2 size={11} /> },
  rejected:     { label: "مرفوض",         cls: "con-badge-danger",  icon: <XCircle size={11} /> },
  archived:     { label: "محفوظ",          cls: "con-badge-warning", icon: <Clock size={11} /> },
};

export default function DriverApplications() {
  const [data, setData] = useState<DriverApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppStatus | "all">("all");
  const [selected, setSelected] = useState<DriverApp | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (!supabase) throw new Error("Supabase غير متاح");
      const { data: rows, error: err } = await supabase
        .from("driver_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (err) throw err;
      setData(rows || []);
    } catch (e: any) {
      setError(e.message || "تعذّر تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleAction(action: "approve" | "reject") {
    if (!selected) return;
    setActionLoading(true);
    try {
      if (!supabase) throw new Error("Supabase غير متاح");
      const update: any = {
        status: action === "approve" ? "approved" : "rejected",
        admin_notes: notes,
        reviewed_at: new Date().toISOString(),
      };
      if (action === "reject") update.rejection_reason = notes;
      const { error: err } = await supabase.from("driver_applications").update(update).eq("id", selected.id);
      if (err) throw err;
      setData(prev => prev.map(a => a.id === selected.id ? { ...a, ...update } : a));
      setSelected(prev => prev ? { ...prev, ...update } : null);
      setNotes("");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  const filtered = data.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.full_name?.toLowerCase().includes(q) || a.phone?.includes(q) || a.app_ref?.includes(q) || a.national_id?.includes(q);
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: data.length,
    pending: data.filter(a => a.status === "pending").length,
    under_review: data.filter(a => a.status === "under_review").length,
    approved: data.filter(a => a.status === "approved").length,
    rejected: data.filter(a => a.status === "rejected").length,
  };

  return (
    <div dir="rtl" style={{ padding: "1.5rem", fontFamily: "var(--con-font-arabic)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--con-text-primary)", margin: 0 }}>طلبات السائقين</h1>
          <p style={{ fontSize: 12, color: "var(--con-text-muted)", margin: "4px 0 0" }}>مراجعة وإدارة طلبات تسجيل السائقين الجدد</p>
        </div>
        <button onClick={fetchData} disabled={loading} className="con-btn con-btn-ghost" style={{ gap: 6 }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> تحديث
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "الكل", value: stats.total, cls: "var(--con-text-secondary)" },
          { label: "انتظار", value: stats.pending, cls: "var(--con-warning)" },
          { label: "مراجعة", value: stats.under_review, cls: "var(--con-info)" },
          { label: "مقبول", value: stats.approved, cls: "var(--con-success)" },
          { label: "مرفوض", value: stats.rejected, cls: "var(--con-danger)" },
        ].map(s => (
          <div key={s.label} className="con-card" style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.cls }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--con-text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={13} style={{ position: "absolute", insetInlineEnd: 10, top: "50%", transform: "translateY(-50%)", color: "var(--con-text-muted)" }} />
          <input className="con-input" placeholder="بحث بالاسم أو الهاتف أو رقم الهوية..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingInlineEnd: 30, width: "100%" }} />
        </div>
        <select className="con-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} style={{ width: 140 }}>
          <option value="all">جميع الحالات</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {error && <div className="con-card" style={{ padding: "1rem", color: "var(--con-danger)", display: "flex", gap: 8 }}><AlertCircle size={16} />{error}</div>}

      {/* Table */}
      <div className="con-card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--con-text-muted)" }}>
            <RefreshCw size={20} className="animate-spin" style={{ margin: "0 auto 8px", display: "block" }} /> جاري التحميل...
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--con-border-default)" }}>
                {["رقم الطلب", "الاسم", "الهاتف", "المدينة", "المنصة", "المركبة", "التحقق", "الحالة", "التاريخ", ""].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "right", fontSize: 11, fontWeight: 600, color: "var(--con-text-muted)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} style={{ padding: "2rem", textAlign: "center", color: "var(--con-text-muted)", fontSize: 13 }}>لا توجد طلبات</td></tr>
              ) : filtered.map(app => {
                const sm = STATUS_MAP[app.status] || STATUS_MAP.pending;
                return (
                  <tr key={app.id} style={{ borderBottom: "1px solid var(--con-border-subtle)", cursor: "pointer" }} onClick={() => { setSelected(app); setNotes(app.admin_notes || ""); }}>
                    <td style={{ padding: "0.75rem 1rem", fontSize: 12, color: "var(--con-text-secondary)", fontFamily: "var(--con-font-mono)" }}>{app.app_ref || app.id.slice(0, 8)}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--con-text-primary)" }}>{app.full_name}</div>
                      <div style={{ fontSize: 11, color: "var(--con-text-muted)" }}>{app.national_id}</div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: 12, color: "var(--con-text-secondary)" }}>{app.phone}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: 12, color: "var(--con-text-secondary)" }}>{app.city}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: 12, color: "var(--con-text-secondary)" }}>{app.platform_app || "—"}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: 12, color: "var(--con-text-secondary)" }}>
                      {app.has_vehicle ? `${app.vehicle_brand || ""} ${app.vehicle_model || ""}`.trim() || "نعم" : "لا"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{ fontSize: 11, color: app.liveness_passed ? "var(--con-success)" : "var(--con-text-muted)" }}>
                        {app.face_similarity_score != null ? `${Math.round(Number(app.face_similarity_score))}%` : "—"}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span className={`con-badge ${sm.cls}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{sm.icon}{sm.label}</span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: 11, color: "var(--con-text-muted)" }}>{new Date(app.created_at).toLocaleDateString("ar-SA")}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <button className="con-btn con-btn-ghost" style={{ padding: "4px 8px", fontSize: 11 }} onClick={e => { e.stopPropagation(); setSelected(app); setNotes(app.admin_notes || ""); }}>
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setSelected(null)}>
          <div className="con-card" style={{ width: 560, maxHeight: "85vh", overflowY: "auto", padding: "1.5rem" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--con-text-primary)", margin: 0 }}>تفاصيل الطلب — {selected.app_ref || selected.id.slice(0, 8)}</h2>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--con-text-muted)" }}><XCircle size={18} /></button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
              {[
                { icon: <User size={13} />, label: "الاسم", value: selected.full_name },
                { icon: <User size={13} />, label: "رقم الهوية", value: selected.national_id },
                { icon: <Phone size={13} />, label: "الهاتف", value: selected.phone },
                { icon: <Mail size={13} />, label: "البريد", value: selected.email },
                { icon: <MapPin size={13} />, label: "المدينة", value: selected.city },
                { icon: <User size={13} />, label: "الجنسية", value: selected.nationality },
                { icon: <User size={13} />, label: "المنصة", value: selected.platform_app },
                { icon: <User size={13} />, label: "نوع العقد", value: selected.contract_type },
              ].map(f => (
                <div key={f.label} style={{ background: "var(--con-bg-surface-2)", borderRadius: "var(--con-radius-sm)", padding: "0.5rem 0.75rem" }}>
                  <div style={{ fontSize: 10, color: "var(--con-text-muted)", display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>{f.icon}{f.label}</div>
                  <div style={{ fontSize: 13, color: "var(--con-text-primary)", fontWeight: 500 }}>{f.value || "—"}</div>
                </div>
              ))}
            </div>

            {selected.has_vehicle && (
              <div style={{ background: "var(--con-bg-surface-2)", borderRadius: "var(--con-radius-sm)", padding: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--con-text-secondary)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><Car size={13} /> معلومات المركبة</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[
                    { label: "الماركة", value: selected.vehicle_brand },
                    { label: "الموديل", value: selected.vehicle_model },
                    { label: "السنة", value: selected.vehicle_year },
                    { label: "لوحة", value: selected.vehicle_plate },
                  ].map(f => (
                    <div key={f.label}>
                      <div style={{ fontSize: 10, color: "var(--con-text-muted)" }}>{f.label}</div>
                      <div style={{ fontSize: 12, color: "var(--con-text-primary)" }}>{f.value || "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: "var(--con-bg-surface-2)", borderRadius: "var(--con-radius-sm)", padding: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--con-text-secondary)", marginBottom: 8 }}>نتائج التحقق</div>
              <div style={{ display: "flex", gap: 16 }}>
                <div><span style={{ fontSize: 11, color: "var(--con-text-muted)" }}>تشابه الوجه: </span><span style={{ fontSize: 13, fontWeight: 600, color: selected.face_similarity_score && Number(selected.face_similarity_score) > 70 ? "var(--con-success)" : "var(--con-danger)" }}>{selected.face_similarity_score != null ? `${Math.round(Number(selected.face_similarity_score))}%` : "—"}</span></div>
                <div><span style={{ fontSize: 11, color: "var(--con-text-muted)" }}>Liveness: </span><span style={{ fontSize: 13, fontWeight: 600, color: selected.liveness_passed ? "var(--con-success)" : "var(--con-danger)" }}>{selected.liveness_passed ? "نجح" : "فشل"}</span></div>
                <div><span style={{ fontSize: 11, color: "var(--con-text-muted)" }}>البريد: </span><span style={{ fontSize: 13, fontWeight: 600, color: selected.email_verified ? "var(--con-success)" : "var(--con-text-muted)" }}>{(selected as any).email_verified ? "موثّق" : "—"}</span></div>
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: 12, color: "var(--con-text-secondary)", display: "block", marginBottom: 6 }}>ملاحظات الإدارة</label>
              <textarea className="con-input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="أضف ملاحظات..." style={{ width: "100%", resize: "vertical" }} />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setSelected(null)} className="con-btn con-btn-ghost">إغلاق</button>
              {selected.status !== "rejected" && (
                <button onClick={() => handleAction("reject")} disabled={actionLoading} className="con-btn" style={{ background: "var(--con-danger)", color: "#fff" }}>
                  <XCircle size={14} /> رفض
                </button>
              )}
              {selected.status !== "approved" && (
                <button onClick={() => handleAction("approve")} disabled={actionLoading} className="con-btn con-btn-primary">
                  <CheckCircle2 size={14} /> قبول
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

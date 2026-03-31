/**
 * صفحة إدارة KYC — Know Your Customer Document Review
 * تقرأ الوثائق من جدول driver_applications (أعمدة doc_*)
 * كل طلب تسجيل سائق يحتوي على عدة وثائق مرفوعة على S3
 */
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Search, RefreshCw, AlertCircle, CheckCircle2, XCircle, Clock,
  Eye, FileText, Shield, User, ExternalLink, ChevronDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type AppStatus = "pending" | "approved" | "rejected" | "under_review";

interface DriverApplication {
  id: string;
  app_ref: string;
  full_name: string;
  national_id: string;
  phone: string;
  email: string;
  city: string;
  platform_app: string;
  contract_type: string;
  status: AppStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  // Document S3 keys
  doc_national_id: string | null;
  doc_national_id_back: string | null;
  doc_selfie: string | null;
  doc_liveness_video: string | null;
  doc_bank_cert: string | null;
  doc_driver_license: string | null;
  doc_vehicle_front: string | null;
  doc_vehicle_back: string | null;
  doc_vehicle_side: string | null;
  doc_vehicle_reg: string | null;
  doc_vehicle_insurance: string | null;
  doc_vehicle_license: string | null;
  liveness_passed: boolean;
  face_similarity_score: number | null;
}

const DOC_FIELDS: { key: string; label: string }[] = [
  { key: "doc_national_id", label: "الهوية الوطنية (أمام)" },
  { key: "doc_national_id_back", label: "الهوية الوطنية (خلف)" },
  { key: "doc_selfie", label: "صورة شخصية" },
  { key: "doc_liveness_video", label: "فيديو التحقق الحيوي" },
  { key: "doc_bank_cert", label: "إفادة بنكية" },
  { key: "doc_driver_license", label: "رخصة القيادة" },
  { key: "doc_vehicle_front", label: "المركبة (أمام)" },
  { key: "doc_vehicle_back", label: "المركبة (خلف)" },
  { key: "doc_vehicle_side", label: "المركبة (جانب)" },
  { key: "doc_vehicle_reg", label: "استمارة المركبة" },
  { key: "doc_vehicle_insurance", label: "تأمين المركبة" },
  { key: "doc_vehicle_license", label: "رخصة المركبة" },
];

const STATUS_MAP: Record<string, { label: string; cls: string; icon: JSX.Element }> = {
  pending:      { label: "بانتظار المراجعة", cls: "con-badge-warning", icon: <Clock size={11} /> },
  under_review: { label: "قيد المراجعة",    cls: "con-badge-info",    icon: <Eye size={11} /> },
  approved:     { label: "مقبول",           cls: "con-badge-success", icon: <CheckCircle2 size={11} /> },
  rejected:     { label: "مرفوض",           cls: "con-badge-danger",  icon: <XCircle size={11} /> },
};

function countDocs(app: DriverApplication): number {
  return DOC_FIELDS.filter(f => !!(app as any)[f.key]).length;
}

export default function KYCManagement() {
  const [data, setData] = useState<DriverApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppStatus | "all">("all");
  const [selected, setSelected] = useState<DriverApplication | null>(null);
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleReview(status: "approved" | "rejected") {
    if (!selected) return;
    setActionLoading(true);
    try {
      if (!supabase) throw new Error("Supabase غير متاح");
      const update = {
        status,
        admin_notes: notes,
        reviewed_at: new Date().toISOString(),
      };
      const { error: err } = await supabase
        .from("driver_applications")
        .update(update)
        .eq("id", selected.id);
      if (err) throw err;
      setData(prev => prev.map(a => a.id === selected.id ? { ...a, ...update } : a));
      setSelected(prev => prev ? { ...prev, ...update } : null);
      toast.success(status === "approved" ? "تم قبول الطلب" : "تم رفض الطلب");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  const filtered = data.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      a.full_name?.toLowerCase().includes(q) ||
      a.app_ref?.toLowerCase().includes(q) ||
      a.national_id?.includes(q) ||
      a.phone?.includes(q) ||
      a.email?.toLowerCase().includes(q);
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

  const totalDocs = data.reduce((sum, a) => sum + countDocs(a), 0);

  return (
    <div dir="rtl" style={{ padding: "1.5rem", fontFamily: "var(--con-font-arabic)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--con-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={18} style={{ color: "var(--con-accent)" }} /> إدارة وثائق KYC
          </h1>
          <p style={{ fontSize: 12, color: "var(--con-text-muted)", margin: "4px 0 0" }}>
            مراجعة الوثائق المرفوعة للتحقق من هوية السائقين — {totalDocs} وثيقة من {data.length} طلب
          </p>
        </div>
        <button onClick={fetchData} disabled={loading} className="con-btn con-btn-ghost" style={{ gap: 6 }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> تحديث
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "الكل", value: stats.total, color: "var(--con-text-secondary)" },
          { label: "بانتظار المراجعة", value: stats.pending, color: "var(--con-warning)" },
          { label: "قيد المراجعة", value: stats.under_review, color: "var(--con-info)" },
          { label: "مقبول", value: stats.approved, color: "var(--con-success)" },
          { label: "مرفوض", value: stats.rejected, color: "var(--con-danger)" },
        ].map(s => (
          <div key={s.label} className="con-card" style={{ padding: "0.75rem", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--con-text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={13} style={{ position: "absolute", insetInlineEnd: 10, top: "50%", transform: "translateY(-50%)", color: "var(--con-text-muted)" }} />
          <input className="con-input" placeholder="بحث بالاسم، الرقم المرجعي، الهوية، الجوال..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingInlineEnd: 30, width: "100%" }} />
        </div>
        <select className="con-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} style={{ width: 180 }}>
          <option value="all">جميع الحالات</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {error && <div className="con-card" style={{ padding: "1rem", color: "var(--con-danger)", display: "flex", gap: 8, marginBottom: "1rem" }}><AlertCircle size={16} />{error}</div>}

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
                {["السائق", "الرقم المرجعي", "المدينة", "المنصة", "الوثائق", "تاريخ التقديم", "الحالة", ""].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "right", fontSize: 11, fontWeight: 600, color: "var(--con-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: "2.5rem", textAlign: "center", color: "var(--con-text-muted)", fontSize: 13 }}>
                  {data.length === 0 ? "لا توجد طلبات تسجيل بعد — ستظهر هنا عند تسجيل سائق جديد" : "لا توجد نتائج مطابقة"}
                </td></tr>
              ) : filtered.map(app => {
                const sm = STATUS_MAP[app.status] || STATUS_MAP.pending;
                const docCount = countDocs(app);
                return (
                  <tr key={app.id} style={{ borderBottom: "1px solid var(--con-border-subtle)", cursor: "pointer" }} onClick={() => { setSelected(app); setNotes(app.admin_notes || ""); }}>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--con-bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <User size={14} style={{ color: "var(--con-text-muted)" }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--con-text-primary)" }}>{app.full_name}</div>
                          <div style={{ fontSize: 11, color: "var(--con-text-muted)" }}>{app.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: 12, color: "var(--con-text-secondary)", fontFamily: "var(--con-font-mono)" }}>{app.app_ref}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: 12, color: "var(--con-text-secondary)" }}>{app.city || "—"}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: 12, color: "var(--con-text-secondary)" }}>{app.platform_app || "—"}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{ fontSize: 12, color: docCount > 0 ? "var(--con-success)" : "var(--con-text-muted)" }}>
                        {docCount} / {DOC_FIELDS.length}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: 11, color: "var(--con-text-muted)" }}>
                      {app.created_at ? new Date(app.created_at).toLocaleDateString("ar-SA") : "—"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span className={`con-badge ${sm.cls}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{sm.icon}{sm.label}</span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <button className="con-btn con-btn-ghost" style={{ padding: "4px 8px", fontSize: 11 }} onClick={(e) => { e.stopPropagation(); setSelected(app); setNotes(app.admin_notes || ""); }}>
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

      {/* Review Modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", overflowY: "auto", padding: "2rem" }} onClick={() => setSelected(null)}>
          <div className="con-card" style={{ width: 600, maxHeight: "90vh", overflowY: "auto", padding: "1.5rem" }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--con-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Shield size={16} style={{ color: "var(--con-accent)" }} />
                مراجعة طلب — {selected.full_name}
              </h2>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--con-text-muted)" }}><XCircle size={18} /></button>
            </div>

            {/* Applicant Info */}
            <div style={{ background: "var(--con-bg-surface-2)", borderRadius: "var(--con-radius-sm)", padding: "1rem", marginBottom: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", fontSize: 13 }}>
                <div><span style={{ color: "var(--con-text-muted)" }}>المرجع: </span><span style={{ color: "var(--con-text-primary)", fontFamily: "var(--con-font-mono)" }}>{selected.app_ref}</span></div>
                <div><span style={{ color: "var(--con-text-muted)" }}>الهوية: </span><span style={{ color: "var(--con-text-primary)" }}>{selected.national_id}</span></div>
                <div><span style={{ color: "var(--con-text-muted)" }}>الجوال: </span><span style={{ color: "var(--con-text-primary)" }}>{selected.phone}</span></div>
                <div><span style={{ color: "var(--con-text-muted)" }}>البريد: </span><span style={{ color: "var(--con-text-primary)" }}>{selected.email}</span></div>
                <div><span style={{ color: "var(--con-text-muted)" }}>المدينة: </span><span style={{ color: "var(--con-text-primary)" }}>{selected.city}</span></div>
                <div><span style={{ color: "var(--con-text-muted)" }}>المنصة: </span><span style={{ color: "var(--con-text-primary)" }}>{selected.platform_app}</span></div>
                <div><span style={{ color: "var(--con-text-muted)" }}>التعاقد: </span><span style={{ color: "var(--con-text-primary)" }}>{selected.contract_type}</span></div>
                <div>
                  <span style={{ color: "var(--con-text-muted)" }}>التحقق الحيوي: </span>
                  <span style={{ color: selected.liveness_passed ? "var(--con-success)" : "var(--con-danger)" }}>
                    {selected.liveness_passed ? "ناجح" : "غير مكتمل"}
                    {selected.face_similarity_score != null ? ` (${(selected.face_similarity_score * 100).toFixed(0)}%)` : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Documents List */}
            <div style={{ marginBottom: "1rem" }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--con-text-secondary)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <FileText size={14} /> الوثائق المرفوعة ({countDocs(selected)} / {DOC_FIELDS.length})
              </h3>
              <div style={{ display: "grid", gap: 6 }}>
                {DOC_FIELDS.map(({ key, label }) => {
                  const s3Key = (selected as any)[key] as string | null;
                  return (
                    <div key={key} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 12px", borderRadius: 8,
                      background: s3Key ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
                      border: `1px solid ${s3Key ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.12)"}`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {s3Key ? <CheckCircle2 size={14} style={{ color: "var(--con-success)" }} /> : <XCircle size={14} style={{ color: "var(--con-danger)", opacity: 0.5 }} />}
                        <span style={{ fontSize: 12, color: s3Key ? "var(--con-text-primary)" : "var(--con-text-muted)" }}>{label}</span>
                      </div>
                      {s3Key && (
                        <span style={{ fontSize: 10, color: "var(--con-text-muted)", fontFamily: "var(--con-font-mono)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s3Key.split("/").pop()}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Admin Notes */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: 12, color: "var(--con-text-secondary)", display: "block", marginBottom: 6 }}>ملاحظات المراجعة</label>
              <textarea className="con-input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="أضف ملاحظات..." style={{ width: "100%", resize: "vertical" }} />
            </div>

            {/* Review date if exists */}
            {selected.reviewed_at && (
              <div style={{ fontSize: 11, color: "var(--con-text-muted)", marginBottom: "1rem" }}>
                تمت المراجعة: {new Date(selected.reviewed_at).toLocaleString("ar-SA")}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setSelected(null)} className="con-btn con-btn-ghost">إغلاق</button>
              <button onClick={() => handleReview("rejected")} disabled={actionLoading} className="con-btn" style={{ background: "var(--con-danger)", color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
                <XCircle size={14} /> رفض
              </button>
              <button onClick={() => handleReview("approved")} disabled={actionLoading} className="con-btn con-btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 size={14} /> قبول
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

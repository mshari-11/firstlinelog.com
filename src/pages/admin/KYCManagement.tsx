/**
 * صفحة إدارة KYC — Know Your Customer Document Review
 * مراجعة وثائق الهوية المرفوعة عبر Lambda fll-kyc-upload
 */
import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw, AlertCircle, CheckCircle2, XCircle, Clock, Eye, FileText, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";

type ReviewStatus = "pending" | "approved" | "rejected" | "needs_review";

interface KYCFile {
  id: string;
  driver_id: string;
  doc_type: string;
  s3_key: string;
  file_size_bytes: number;
  mime_type: string;
  uploaded_at: string;
  reviewed_by?: string;
  review_status: ReviewStatus;
  review_notes?: string;
  reviewed_at?: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  national_id:       "الهوية الوطنية",
  national_id_back:  "هوية (خلف)",
  selfie:            "صورة شخصية",
  liveness_video:    "فيديو التحقق",
  bank_cert:         "إفادة بنكية",
  driver_license:    "رخصة قيادة",
  vehicle_front:     "المركبة (أمام)",
  vehicle_back:      "المركبة (خلف)",
  vehicle_reg:       "استمارة المركبة",
  vehicle_insurance: "تأمين المركبة",
};

const STATUS_MAP: Record<ReviewStatus, { label: string; cls: string; icon: JSX.Element }> = {
  pending:      { label: "لم يُراجع",  cls: "con-badge-warning", icon: <Clock size={11} /> },
  approved:     { label: "موافق",       cls: "con-badge-success", icon: <CheckCircle2 size={11} /> },
  rejected:     { label: "مرفوض",      cls: "con-badge-danger",  icon: <XCircle size={11} /> },
  needs_review: { label: "يحتاج مراجعة", cls: "con-badge-info",  icon: <Eye size={11} /> },
};

export default function KYCManagement() {
  const [data, setData] = useState<KYCFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "all">("all");
  const [selected, setSelected] = useState<KYCFile | null>(null);
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (!supabase) throw new Error("Supabase غير متاح");
      const { data: rows, error: err } = await supabase
        .from("kyc_files")
        .select("*")
        .order("uploaded_at", { ascending: false });
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
      const update = { review_status: status, review_notes: notes, reviewed_at: new Date().toISOString() };
      const { error: err } = await supabase.from("kyc_files").update(update).eq("id", selected.id);
      if (err) throw err;
      setData(prev => prev.map(f => f.id === selected.id ? { ...f, ...update } : f));
      setSelected(prev => prev ? { ...prev, ...update } : null);
      setNotes("");
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(false); }
  }

  const filtered = data.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q || f.driver_id?.includes(q) || DOC_TYPE_LABELS[f.doc_type]?.includes(q) || f.doc_type?.includes(q);
    const matchStatus = statusFilter === "all" || f.review_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: data.length,
    pending: data.filter(f => f.review_status === "pending").length,
    approved: data.filter(f => f.review_status === "approved").length,
    rejected: data.filter(f => f.review_status === "rejected").length,
    needs_review: data.filter(f => f.review_status === "needs_review").length,
  };

  return (
    <div dir="rtl" style={{ padding: "1.5rem", fontFamily: "var(--con-font-arabic)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--con-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={18} style={{ color: "var(--con-accent)" }} /> إدارة وثائق KYC
          </h1>
          <p style={{ fontSize: 12, color: "var(--con-text-muted)", margin: "4px 0 0" }}>مراجعة الوثائق المرفوعة للتحقق من هوية السائقين</p>
        </div>
        <button onClick={fetchData} disabled={loading} className="con-btn con-btn-ghost" style={{ gap: 6 }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> تحديث
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "الكل", value: stats.total, color: "var(--con-text-secondary)" },
          { label: "لم يُراجع", value: stats.pending, color: "var(--con-warning)" },
          { label: "يحتاج مراجعة", value: stats.needs_review, color: "var(--con-info)" },
          { label: "موافق", value: stats.approved, color: "var(--con-success)" },
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
          <input className="con-input" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingInlineEnd: 30, width: "100%" }} />
        </div>
        <select className="con-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} style={{ width: 160 }}>
          <option value="all">جميع الحالات</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {error && <div className="con-card" style={{ padding: "1rem", color: "var(--con-danger)", display: "flex", gap: 8, marginBottom: "1rem" }}><AlertCircle size={16} />{error}</div>}

      <div className="con-card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--con-text-muted)" }}>
            <RefreshCw size={20} className="animate-spin" style={{ margin: "0 auto 8px", display: "block" }} /> جاري التحميل...
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--con-border-default)" }}>
                {["نوع الوثيقة", "معرف السائق", "الحجم", "نوع الملف", "تاريخ الرفع", "الحالة", ""].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "right", fontSize: 11, fontWeight: 600, color: "var(--con-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--con-text-muted)", fontSize: 13 }}>لا توجد وثائق</td></tr>
              ) : filtered.map(f => {
                const sm = STATUS_MAP[f.review_status] || STATUS_MAP.pending;
                return (
                  <tr key={f.id} style={{ borderBottom: "1px solid var(--con-border-subtle)" }}>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <FileText size={14} style={{ color: "var(--con-accent)" }} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--con-text-primary)" }}>{DOC_TYPE_LABELS[f.doc_type] || f.doc_type}</span>
                      </div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: 11, color: "var(--con-text-muted)", fontFamily: "var(--con-font-mono)" }}>{f.driver_id?.slice(0, 12)}…</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: 12, color: "var(--con-text-secondary)" }}>
                      {f.file_size_bytes ? `${(f.file_size_bytes / 1024).toFixed(0)} KB` : "—"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: 11, color: "var(--con-text-muted)" }}>{f.mime_type || "—"}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: 11, color: "var(--con-text-muted)" }}>{new Date(f.uploaded_at).toLocaleDateString("ar-SA")}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span className={`con-badge ${sm.cls}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{sm.icon}{sm.label}</span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <button className="con-btn con-btn-ghost" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => { setSelected(f); setNotes(f.review_notes || ""); }}>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setSelected(null)}>
          <div className="con-card" style={{ width: 480, padding: "1.5rem" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--con-text-primary)", margin: 0 }}>مراجعة الوثيقة</h2>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--con-text-muted)" }}><XCircle size={18} /></button>
            </div>
            <div style={{ background: "var(--con-bg-surface-2)", borderRadius: "var(--con-radius-sm)", padding: "1rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--con-text-primary)", marginBottom: 8 }}>{DOC_TYPE_LABELS[selected.doc_type] || selected.doc_type}</div>
              <div style={{ fontSize: 12, color: "var(--con-text-muted)" }}>مسار S3: <code style={{ fontSize: 11 }}>{selected.s3_key}</code></div>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: 12, color: "var(--con-text-secondary)", display: "block", marginBottom: 6 }}>ملاحظات المراجعة</label>
              <textarea className="con-input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="أضف ملاحظات..." style={{ width: "100%", resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setSelected(null)} className="con-btn con-btn-ghost">إغلاق</button>
              <button onClick={() => handleReview("rejected")} disabled={actionLoading} className="con-btn" style={{ background: "var(--con-danger)", color: "#fff" }}>
                <XCircle size={14} /> رفض
              </button>
              <button onClick={() => handleReview("approved")} disabled={actionLoading} className="con-btn con-btn-primary">
                <CheckCircle2 size={14} /> قبول
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

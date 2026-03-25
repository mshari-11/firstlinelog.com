/**
 * صفحة تدريب السائقين — Driver Training Records
 * سجلات التدريب من جدول driver_training_records
 */
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Search, RefreshCw, AlertCircle, CheckCircle2, Clock, GraduationCap, Plus, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type TrainingStatus = "assigned" | "in_progress" | "completed" | "failed" | "expired";

interface TrainingRecord {
  id: string;
  driver_id: string;
  training_type: string;
  training_name: string;
  status: TrainingStatus;
  completed_at?: string;
  certificate_s3?: string;
  created_at: string;
}

const STATUS_MAP: Record<TrainingStatus, { label: string; cls: string }> = {
  assigned:    { label: "مُعيَّن",     cls: "con-badge-info" },
  in_progress: { label: "قيد التنفيذ", cls: "con-badge-warning" },
  completed:   { label: "مكتمل",       cls: "con-badge-success" },
  failed:      { label: "فشل",          cls: "con-badge-danger" },
  expired:     { label: "منتهي",        cls: "con-badge-warning" },
};

const TYPE_LABELS: Record<string, string> = {
  onboarding:    "التأهيل الأولي",
  safety:        "السلامة",
  compliance:    "الامتثال",
  skills:        "مهارات التوصيل",
  customer_service: "خدمة العملاء",
  vehicle:       "قيادة المركبة",
};

export default function DriverTraining() {
  const [data, setData] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TrainingStatus | "all">("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ driver_id: "", training_type: "onboarding", training_name: "", status: "assigned" as TrainingStatus });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (!supabase) throw new Error("Supabase غير متاح");
      const { data: rows, error: err } = await supabase
        .from("driver_training_records")
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

  async function handleSave() {
    setSaving(true);
    try {
      if (!supabase) throw new Error("Supabase غير متاح");
      const { data: inserted, error: err } = await supabase
        .from("driver_training_records")
        .insert([{ ...form, created_at: new Date().toISOString() }])
        .select();
      if (err) throw err;
      if (inserted) setData(prev => [inserted[0], ...prev]);
      setShowModal(false);
      setForm({ driver_id: "", training_type: "onboarding", training_name: "", status: "assigned" });
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function updateStatus(id: string, status: TrainingStatus) {
    if (!supabase) return;
    const update: any = { status };
    if (status === "completed") update.completed_at = new Date().toISOString();
    await supabase.from("driver_training_records").update(update).eq("id", id);
    setData(prev => prev.map(r => r.id === id ? { ...r, ...update } : r));
  }

  const filtered = data.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.training_name?.toLowerCase().includes(q) || r.driver_id?.includes(q) || TYPE_LABELS[r.training_type]?.includes(q);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: data.length,
    completed: data.filter(r => r.status === "completed").length,
    in_progress: data.filter(r => r.status === "in_progress").length,
    assigned: data.filter(r => r.status === "assigned").length,
  };

  return (
    <div dir="rtl" style={{ padding: "1.5rem", fontFamily: "var(--con-font-arabic)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--con-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <GraduationCap size={18} style={{ color: "var(--con-accent)" }} /> تدريب السائقين
          </h1>
          <p style={{ fontSize: 12, color: "var(--con-text-muted)", margin: "4px 0 0" }}>سجلات وإدارة برامج تدريب السائقين</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={fetchData} disabled={loading} className="con-btn con-btn-ghost" style={{ gap: 6 }}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> تحديث
          </button>
          <button onClick={() => setShowModal(true)} className="con-btn con-btn-primary" style={{ gap: 6 }}>
            <Plus size={14} /> إضافة تدريب
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "إجمالي السجلات", value: stats.total, color: "var(--con-text-secondary)" },
          { label: "مُعيَّن", value: stats.assigned, color: "var(--con-info)" },
          { label: "قيد التنفيذ", value: stats.in_progress, color: "var(--con-warning)" },
          { label: "مكتمل", value: stats.completed, color: "var(--con-success)" },
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
          <input className="con-input" placeholder="بحث باسم التدريب أو معرف السائق..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingInlineEnd: 30, width: "100%" }} />
        </div>
        <select className="con-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} style={{ width: 140 }}>
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
                {["اسم التدريب", "النوع", "معرف السائق", "الحالة", "تاريخ الاكتمال", "الشهادة", "إجراء"].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "right", fontSize: 11, fontWeight: 600, color: "var(--con-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--con-text-muted)", fontSize: 13 }}>لا توجد سجلات تدريب</td></tr>
              ) : filtered.map(r => {
                const sm = STATUS_MAP[r.status] || STATUS_MAP.assigned;
                return (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--con-border-subtle)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontSize: 13, fontWeight: 500, color: "var(--con-text-primary)" }}>{r.training_name}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: 12, color: "var(--con-text-secondary)" }}>{TYPE_LABELS[r.training_type] || r.training_type}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: 11, color: "var(--con-text-muted)", fontFamily: "var(--con-font-mono)" }}>{r.driver_id?.slice(0, 12)}…</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span className={`con-badge ${sm.cls}`}>{sm.label}</span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: 11, color: "var(--con-text-muted)" }}>
                      {r.completed_at ? new Date(r.completed_at).toLocaleDateString("ar-SA") : "—"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: 11, color: "var(--con-text-muted)" }}>
                      {r.certificate_s3 ? <CheckCircle2 size={13} style={{ color: "var(--con-success)" }} /> : "—"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      {r.status !== "completed" && (
                        <select
                          className="con-input"
                          value={r.status}
                          onChange={e => updateStatus(r.id, e.target.value as TrainingStatus)}
                          style={{ fontSize: 11, padding: "3px 6px", width: "auto" }}
                          onClick={e => e.stopPropagation()}
                        >
                          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowModal(false)}>
          <div className="con-card" style={{ width: 440, padding: "1.5rem" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--con-text-primary)", margin: 0 }}>إضافة سجل تدريب</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--con-text-muted)" }}><XCircle size={18} /></button>
            </div>
            {[
              { label: "معرف السائق", key: "driver_id", type: "text" },
              { label: "اسم التدريب", key: "training_name", type: "text" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: "0.75rem" }}>
                <label style={{ fontSize: 12, color: "var(--con-text-secondary)", display: "block", marginBottom: 4 }}>{f.label}</label>
                <input className="con-input" type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={{ width: "100%" }} />
              </div>
            ))}
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ fontSize: 12, color: "var(--con-text-secondary)", display: "block", marginBottom: 4 }}>نوع التدريب</label>
              <select className="con-input" value={form.training_type} onChange={e => setForm(p => ({ ...p, training_type: e.target.value }))} style={{ width: "100%" }}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button onClick={() => setShowModal(false)} className="con-btn con-btn-ghost">إلغاء</button>
              <button onClick={handleSave} disabled={saving || !form.driver_id || !form.training_name} className="con-btn con-btn-primary">
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />} حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

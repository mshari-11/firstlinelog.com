import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, RefreshCw, AlertCircle, ListTodo, Clock, CheckCircle2, XCircle, Users, Plus, X } from "lucide-react";
import { API_BASE } from "@/lib/api";

type Priority = "high" | "medium" | "low";
type TaskStatus = "pending" | "in_progress" | "completed" | "overdue";
interface Task { id: string; title: string; assignee: string; priority: Priority; status: TaskStatus; date: string; description?: string; }

const STATUS_MAP: Record<TaskStatus, { label: string; cls: string }> = {
  pending: { label: "معلقة", cls: "con-badge-warning" },
  in_progress: { label: "قيد التنفيذ", cls: "con-badge-info" },
  completed: { label: "مكتملة", cls: "con-badge-success" },
  overdue: { label: "متأخرة", cls: "con-badge-danger" },
};

const PRIORITY_MAP: Record<Priority, { label: string; cls: string }> = {
  high: { label: "عالية", cls: "con-badge-danger" },
  medium: { label: "متوسطة", cls: "con-badge-warning" },
  low: { label: "منخفضة", cls: "con-badge-info" },
};

const MOCK: Task[] = [
  { id: "TSK-001", title: "مراجعة تقارير المالية الشهرية", assignee: "أحمد المالية", priority: "high", status: "pending", date: "2026-03-21T09:00:00Z", description: "مراجعة جميع التقارير المالية لشهر مارس" },
  { id: "TSK-002", title: "تحديث بيانات السائقين", assignee: "خالد HR", priority: "medium", status: "in_progress", date: "2026-03-20T10:00:00Z", description: "تحديث معلومات الاتصال والرخص" },
  { id: "TSK-003", title: "صيانة المركبات الدورية", assignee: "عمر العمليات", priority: "high", status: "overdue", date: "2026-03-15T08:00:00Z", description: "جدولة صيانة الأسطول" },
  { id: "TSK-004", title: "تدريب الموظفين الجدد", assignee: "نورة الموارد", priority: "low", status: "completed", date: "2026-03-18T11:00:00Z", description: "تدريب على النظام الجديد" },
  { id: "TSK-005", title: "إعداد تقرير الأداء الأسبوعي", assignee: "سارة العمليات", priority: "medium", status: "pending", date: "2026-03-21T14:00:00Z", description: "تقرير أداء المناديب" },
];

export default function Tasks() {
  const navigate = useNavigate();
  const [data, setData] = useState<Task[]>(MOCK);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", assignee: "", priority: "medium" as Priority });

  useEffect(() => { fetchData(); }, []);
  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tasks`);
      if (res.ok) { const d = await res.json(); if (Array.isArray(d) && d.length) setData(d); }
    } catch { /* keep mock */ }
    setLoading(false);
  }

  async function handleAdd() {
    const newTask: Task = { id: `TSK-${String(data.length + 1).padStart(3, "0")}`, title: form.title, assignee: form.assignee, priority: form.priority, status: "pending", date: new Date().toISOString(), description: form.description };
    try { await fetch(`${API_BASE}/api/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newTask) }); } catch {}
    setData(prev => [newTask, ...prev]);
    setForm({ title: "", description: "", assignee: "", priority: "medium" });
    setShowModal(false);
  }

  const filtered = data.filter(a => {
    const matchSearch = a.title.includes(search) || a.assignee.includes(search);
    const matchFilter = filter === "all" || a.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    pending: data.filter(a => a.status === "pending").length,
    in_progress: data.filter(a => a.status === "in_progress").length,
    completed: data.filter(a => a.status === "completed").length,
    overdue: data.filter(a => a.status === "overdue").length,
  };

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ background: "rgba(59,130,246,0.12)", borderRadius: 8, padding: 7, display: "flex", alignItems: "center", justifyContent: "center" }}><ListTodo size={18} style={{ color: "var(--con-brand)" }} /></div>
            <h1 style={{ fontSize: "var(--con-text-page-title)", fontWeight: 700, color: "var(--con-text-primary)", margin: 0 }}>المهام</h1>
          </div>
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", margin: 0, paddingRight: 44 }}>إدارة المهام وتتبع التقدم</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="con-btn-primary" onClick={() => setShowModal(true)}><Plus size={14} /> مهمة جديدة</button>
          <button className="con-btn-ghost" onClick={fetchData} disabled={loading}><RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> تحديث</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "معلقة", value: stats.pending, icon: Clock, accent: "var(--con-warning)", onClick: () => setFilter("pending") },
          { label: "قيد التنفيذ", value: stats.in_progress, icon: ListTodo, accent: "var(--con-brand)", onClick: () => setFilter("in_progress") },
          { label: "مكتملة", value: stats.completed, icon: CheckCircle2, accent: "var(--con-success)", onClick: () => setFilter("completed") },
          { label: "متأخرة", value: stats.overdue, icon: XCircle, accent: "var(--con-danger)", onClick: () => setFilter("overdue") },
        ].map(k => (
          <div key={k.label} className="con-kpi-card" onClick={k.onClick} style={{ cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>{k.label}</span>
              <k.icon size={14} style={{ color: k.accent }} />
            </div>
            <div className="con-kpi-value" style={{ fontSize: 26, color: k.accent }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="con-toolbar" style={{ flexWrap: "wrap", gap: 10 }}>
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
          <Search size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--con-text-muted)", pointerEvents: "none" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className="con-input" style={{ paddingRight: 32, width: "100%" }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "pending", "in_progress", "completed", "overdue"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: "4px 12px", borderRadius: 6, fontSize: "var(--con-text-caption)", fontWeight: 500, border: "1px solid", cursor: "pointer", background: filter === s ? "var(--con-brand)" : "transparent", borderColor: filter === s ? "var(--con-brand)" : "var(--con-border-strong)", color: filter === s ? "#fff" : "var(--con-text-muted)" }}>
              {s === "all" ? "الكل" : STATUS_MAP[s].label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--con-bg-surface-1)", border: "1px solid var(--con-border-default)", borderRadius: 10, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div className="con-empty"><AlertCircle size={32} style={{ opacity: 0.25, marginBottom: 10 }} /><div>لا توجد مهام مطابقة</div></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="con-table">
              <thead><tr><th>العنوان</th><th>المعيّن</th><th>الأولوية</th><th>الحالة</th><th>التاريخ</th></tr></thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td><span style={{ fontWeight: 600 }}>{a.title}</span></td>
                    <td style={{ cursor: "pointer", color: "var(--con-brand)" }} onClick={() => navigate("/admin-panel/staff")}>{a.assignee}</td>
                    <td><span className={`con-badge con-badge-sm ${PRIORITY_MAP[a.priority].cls}`}>{PRIORITY_MAP[a.priority].label}</span></td>
                    <td><span className={`con-badge con-badge-sm ${STATUS_MAP[a.status].cls}`}>{STATUS_MAP[a.status].label}</span></td>
                    <td><span style={{ fontFamily: "var(--con-font-mono)", fontSize: 12 }}>{new Date(a.date).toLocaleDateString("ar-SA")}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div style={{ background: "var(--con-bg-surface-1)", borderRadius: 12, padding: 24, width: "90%", maxWidth: 450, border: "1px solid var(--con-border-default)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--con-text-primary)" }}>مهمة جديدة</h2>
              <button className="con-btn-ghost" onClick={() => setShowModal(false)} style={{ padding: 4 }}><X size={16} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input className="con-input" placeholder="العنوان" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={{ width: "100%" }} />
              <textarea className="con-input" placeholder="الوصف" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ width: "100%", minHeight: 70, resize: "vertical" }} />
              <input className="con-input" placeholder="المعيّن" value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))} style={{ width: "100%" }} />
              <select className="con-input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))} style={{ width: "100%" }}>
                <option value="high">عالية</option>
                <option value="medium">متوسطة</option>
                <option value="low">منخفضة</option>
              </select>
              <button className="con-btn-primary" onClick={handleAdd} disabled={!form.title || !form.assignee} style={{ marginTop: 8 }}><Plus size={14} /> إضافة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

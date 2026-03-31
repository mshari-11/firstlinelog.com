import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, RefreshCw, AlertCircle, ClockIcon, UserCheck, UserX, Users, Clock, Building2, Download, Printer, Plus, X } from "lucide-react";

function downloadCSV(data: Record<string, any>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(","), ...data.map(r => headers.map(h => `"${r[h] ?? ""}"`).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename + ".csv"; a.click();
}
import { API_BASE } from "@/lib/api";
import { toast } from "sonner";

type AttendanceStatus = "present" | "late" | "absent";
interface AttendanceEntry { id: string; name: string; department: string; checkIn: string; checkOut: string; status: AttendanceStatus; }

const STATUS_MAP: Record<AttendanceStatus, { label: string; cls: string }> = {
  present: { label: "حاضر", cls: "con-badge-success" },
  late: { label: "متأخر", cls: "con-badge-warning" },
  absent: { label: "غائب", cls: "con-badge-danger" },
};

const MOCK: AttendanceEntry[] = [
  { id: "ATT-001", name: "مشاري العنزي", department: "الإدارة", checkIn: "07:55", checkOut: "16:05", status: "present" },
  { id: "ATT-002", name: "أحمد المالكي", department: "المالية", checkIn: "08:00", checkOut: "16:00", status: "present" },
  { id: "ATT-003", name: "خالد الشمري", department: "الموارد البشرية", checkIn: "08:35", checkOut: "16:10", status: "late" },
  { id: "ATT-004", name: "سارة القحطاني", department: "العمليات", checkIn: "07:50", checkOut: "16:00", status: "present" },
  { id: "ATT-005", name: "عمر الدوسري", department: "التوصيل", checkIn: "—", checkOut: "—", status: "absent" },
  { id: "ATT-006", name: "نورة الحربي", department: "الموارد البشرية", checkIn: "08:20", checkOut: "16:00", status: "late" },
  { id: "ATT-007", name: "فهد السبيعي", department: "التوصيل", checkIn: "07:45", checkOut: "16:30", status: "present" },
  { id: "ATT-008", name: "ريم العتيبي", department: "المالية", checkIn: "—", checkOut: "—", status: "absent" },
];

export default function Attendance() {
  const navigate = useNavigate();
  const [data, setData] = useState<AttendanceEntry[]>(MOCK);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AttendanceStatus | "all">("all");
  const [loading, setLoading] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinForm, setCheckinForm] = useState({ name: "", time: "", type: "check-in" as "check-in" | "check-out" });

  useEffect(() => { fetchData(); }, []);
  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/attendance`);
      if (res.ok) { const d = await res.json(); if (Array.isArray(d) && d.length) setData(d); }
    } catch { toast.error("فشل تحميل بيانات الحضور"); }
    setLoading(false);
  }

  const filtered = data.filter(a => {
    const matchSearch = a.name.includes(search) || a.department.includes(search);
    const matchFilter = filter === "all" || a.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    present: data.filter(a => a.status === "present").length,
    late: data.filter(a => a.status === "late").length,
    absent: data.filter(a => a.status === "absent").length,
    total: data.length,
  };

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ background: "rgba(59,130,246,0.12)", borderRadius: 8, padding: 7, display: "flex", alignItems: "center", justifyContent: "center" }}><Clock size={18} style={{ color: "var(--con-brand)" }} /></div>
            <h1 style={{ fontSize: "var(--con-text-page-title)", fontWeight: 700, color: "var(--con-text-primary)", margin: 0 }}>الحضور والانصراف</h1>
          </div>
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", margin: 0, paddingRight: 44 }}>متابعة حضور وانصراف الموظفين</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button className="con-btn-ghost" onClick={() => { window.print(); }}><Printer size={14} /> طباعة</button>
          <button className="con-btn-ghost" onClick={() => {
            const rows = data.map(a => ({
              الاسم: a.name, القسم: a.department, وقت_الحضور: a.checkIn,
              وقت_الانصراف: a.checkOut, الحالة: STATUS_MAP[a.status].label,
            }));
            downloadCSV(rows, "attendance_export");
          }}><Download size={14} /> تصدير CSV</button>
          <button className="con-btn-ghost" onClick={fetchData} disabled={loading}><RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> تحديث</button>
          <button className="con-btn-primary" onClick={() => setShowCheckinModal(true)}><Plus size={14} /> تسجيل يدوي</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "حاضرين", value: stats.present, icon: UserCheck, accent: "var(--con-success)", onClick: () => setFilter("present") },
          { label: "متأخرين", value: stats.late, icon: Clock, accent: "var(--con-warning)", onClick: () => setFilter("late") },
          { label: "غائبين", value: stats.absent, icon: UserX, accent: "var(--con-danger)", onClick: () => setFilter("absent") },
          { label: "الإجمالي", value: stats.total, icon: Users, accent: "var(--con-brand)", onClick: () => navigate("/admin-panel/staff") },
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
          <Search size={14} style={{ position: "absolute", insetInlineEnd: 10, top: "50%", transform: "translateY(-50%)", color: "var(--con-text-muted)", pointerEvents: "none" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className="con-input" style={{ paddingInlineEnd: 32, width: "100%" }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "present", "late", "absent"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: "4px 12px", borderRadius: 6, fontSize: "var(--con-text-caption)", fontWeight: 500, border: "1px solid", cursor: "pointer", background: filter === s ? "var(--con-brand)" : "transparent", borderColor: filter === s ? "var(--con-brand)" : "var(--con-border-strong)", color: filter === s ? "#fff" : "var(--con-text-muted)" }}>
              {s === "all" ? "الكل" : STATUS_MAP[s].label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--con-bg-surface-1)", border: "1px solid var(--con-border-default)", borderRadius: 10, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div className="con-empty"><AlertCircle size={32} style={{ opacity: 0.25, marginBottom: 10 }} /><div>لا توجد سجلات مطابقة</div></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="con-table">
              <thead><tr><th>الاسم</th><th>القسم</th><th>وقت الحضور</th><th>وقت الانصراف</th><th>الحالة</th></tr></thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td style={{ cursor: "pointer", color: "var(--con-brand)" }} onClick={() => navigate("/admin-panel/staff")}>{a.name}</td>
                    <td style={{ cursor: "pointer", color: "var(--con-brand)" }} onClick={() => navigate("/admin-panel/staff")}><Building2 size={12} style={{ display: "inline", marginLeft: 4 }} />{a.department}</td>
                    <td><span style={{ fontFamily: "var(--con-font-mono)", fontSize: 12 }}>{a.checkIn}</span></td>
                    <td><span style={{ fontFamily: "var(--con-font-mono)", fontSize: 12 }}>{a.checkOut}</span></td>
                    <td><span className={`con-badge con-badge-sm ${STATUS_MAP[a.status].cls}`}>{STATUS_MAP[a.status].label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Check-in Modal */}
      {showCheckinModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }} onClick={(e) => { if (e.target === e.currentTarget) setShowCheckinModal(false); }}>
          <div dir="rtl" style={{ background: "var(--con-bg-elevated)", border: "1px solid var(--con-border-strong)", borderRadius: 12, width: "100%", maxWidth: 400, boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid var(--con-border-default)" }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--con-text-primary)", margin: 0 }}>تسجيل حضور يدوي</h2>
              <button onClick={() => setShowCheckinModal(false)} style={{ background: "transparent", border: "none", color: "var(--con-text-muted)", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--con-text-muted)", fontWeight: 600, marginBottom: 4, display: "block" }}>اسم الموظف *</label>
                <input className="con-input" value={checkinForm.name} placeholder="اسم الموظف" onChange={(e) => setCheckinForm(prev => ({ ...prev, name: e.target.value }))} style={{ width: "100%" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--con-text-muted)", fontWeight: 600, marginBottom: 4, display: "block" }}>الوقت *</label>
                <input className="con-input" type="time" value={checkinForm.time} onChange={(e) => setCheckinForm(prev => ({ ...prev, time: e.target.value }))} style={{ width: "100%" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--con-text-muted)", fontWeight: 600, marginBottom: 4, display: "block" }}>النوع</label>
                <select className="con-input" value={checkinForm.type} onChange={(e) => setCheckinForm(prev => ({ ...prev, type: e.target.value as "check-in" | "check-out" }))} style={{ width: "100%" }}>
                  <option value="check-in">تسجيل حضور</option>
                  <option value="check-out">تسجيل انصراف</option>
                </select>
              </div>
              <button className="con-btn-primary" disabled={!checkinForm.name || !checkinForm.time} onClick={() => {
                const existing = data.find(a => a.name === checkinForm.name);
                if (existing) {
                  setData(prev => prev.map(a => a.id === existing.id ? {
                    ...a,
                    ...(checkinForm.type === "check-in" ? { checkIn: checkinForm.time, status: "present" as AttendanceStatus } : { checkOut: checkinForm.time }),
                  } : a));
                } else {
                  const next: AttendanceEntry = {
                    id: `ATT-${Date.now()}`, name: checkinForm.name, department: "—",
                    checkIn: checkinForm.type === "check-in" ? checkinForm.time : "—",
                    checkOut: checkinForm.type === "check-out" ? checkinForm.time : "—",
                    status: "present",
                  };
                  setData(prev => [next, ...prev]);
                }
                setShowCheckinModal(false);
                setCheckinForm({ name: "", time: "", type: "check-in" });
              }} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
                <Plus size={14} /> تسجيل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
